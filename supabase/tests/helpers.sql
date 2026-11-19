-- Test helpers (included by each test file). A regular schema is used so that tests can switch
-- to the anon/authenticated roles and still call them. The database is thrown away afterwards.
create schema if not exists t;
grant usage on schema t to public;

create or replace function t.assert(cond boolean, msg text) returns void language plpgsql as $$
begin
  if cond is not true then raise exception 'TEST FAILED: %', msg; end if;
  raise notice 'ok   - %', msg;
end $$;

-- The statement must be rejected (optionally with a specific SQLSTATE).
create or replace function t.expect_error(stmt text, msg text, expected text default null) returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    if expected is not null and sqlstate <> expected then
      raise exception 'TEST FAILED: % (expected SQLSTATE %, got %: %)', msg, expected, sqlstate, sqlerrm;
    end if;
    raise notice 'ok   - % [rejected %]', msg, sqlstate;
    return;
  end;
  raise exception 'TEST FAILED: % (statement was ACCEPTED)', msg;
end $$;

-- The statement must succeed.
create or replace function t.expect_ok(stmt text, msg text) returns void language plpgsql as $$
begin
  execute stmt;
  raise notice 'ok   - %', msg;
exception when others then
  raise exception 'TEST FAILED: % (rejected %: %)', msg, sqlstate, sqlerrm;
end $$;

-- Runs a statement and returns the number of rows it affected (what RLS let it touch).
create or replace function t.rows(stmt text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n;
end $$;

-- Pretend to be a Supabase API request from this user.
create or replace function t.as_user(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
end $$;
