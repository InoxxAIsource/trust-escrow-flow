#!/usr/bin/env bash
# =============================================================================
# scripts/build-combined-sql.sh
#
# Regenerates supabase/combined/FRESH_INSTALL.sql and APPLY_ALL.sql from the
# individual migration files in supabase/migrations/, in timestamp order.
#
# Usage:
#   ./scripts/build-combined-sql.sh           # build/overwrite combined files
#   ./scripts/build-combined-sql.sh --check   # exit 1 if files are out of date
#
# Run from any directory — all paths are resolved relative to the repo root.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

exec python3 "$SCRIPT_DIR/build-combined-sql.py" --repo-root "$REPO_ROOT" "$@"
