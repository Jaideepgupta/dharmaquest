#!/usr/bin/env bash
# Builds a throwaway database, applies the shim + migrations + seed, then runs every SQL test.
# Usage: supabase/tests/run.sh            (uses the local PostgreSQL via the default psql connection)
set -euo pipefail
cd "$(dirname "$0")/../.."
DB="${DQ_TEST_DB:-dq_test}"
PSQL=(psql -X -q -o /dev/null -v ON_ERROR_STOP=1)

dropdb --if-exists "$DB" >/dev/null
createdb "$DB"
trap 'dropdb --if-exists "$DB" >/dev/null 2>&1 || true' EXIT

echo "== shim";       "${PSQL[@]}" -d "$DB" -f supabase/tests/shim.sql
for f in supabase/migrations/*.sql; do echo "== migration $(basename "$f")"; "${PSQL[@]}" -d "$DB" -f "$f"; done
if [ -f supabase/seed.sql ]; then echo "== seed"; "${PSQL[@]}" -d "$DB" -f supabase/seed.sql; fi
for f in supabase/tests/[0-9]*.sql; do [ -e "$f" ] || continue; echo "== test $(basename "$f")"; "${PSQL[@]}" -d "$DB" -f "$f"; done
echo "ALL DATABASE CHECKS PASSED"
