-- Running the seed again must change nothing (safe to re-run in any environment).
\i supabase/tests/helpers.sql

create temp table seed_before as
select table_name,
       (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', table_name), false, true, '')))[1]::text::bigint as n
  from information_schema.tables
 where table_schema = 'public' and table_type = 'BASE TABLE' and table_name <> 'audit_log';

create function pg_temp.table_hash(tn text) returns text language plpgsql as $$
declare h text;
begin
  execute format('select md5(coalesce(string_agg(j, '','' order by j), '''')) from (select (to_jsonb(t) - ''updated_at'')::text as j from public.%I t) x', tn) into h;
  return h;
end $$;

create temp table hash_before as select table_name, pg_temp.table_hash(table_name) as h from seed_before;

\i supabase/seed.sql

create temp table seed_after as
select table_name, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', table_name), false, true, '')))[1]::text::bigint as n
  from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' and table_name <> 'audit_log';
create temp table hash_after as select table_name, pg_temp.table_hash(table_name) as h from seed_after;

select t.assert((select count(*) from seed_before) = 31, 'compared all 31 tables (26 content + 5 user-data; the audit log is excluded)');
select t.assert(not exists (select 1 from seed_before b join seed_after a using (table_name) where a.n <> b.n), 're-running the seed adds or removes no rows in any table');
select t.assert(not exists (select 1 from hash_before b join hash_after a using (table_name) where a.h <> b.h), 're-running the seed changes the content of no table');
select t.assert((select count(*) from public.audit_log) = 0, 're-running the seed writes nothing to the audit log');
