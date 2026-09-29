#!/usr/bin/env bash
# Copied from the package-modernize skill (scripts/check-golden-untouched.sh, 2026-09-29) so ci.yml can run it; keep the two alike.
# Prove the golden recording was never edited after it was committed (package-modernize, Phase 2 exit and before every tag).
# Usage: check-golden-untouched.sh [REPO_DIR] [GOLDEN_DIR]     (defaults: . and test/golden)
# For every recording file in GOLDEN_DIR at HEAD (*.json, capture*, codec*, fixture-server*), finds the commit that added it and diffs the
# file from that commit to the working tree. A later file (the new major's own recording, 2.0.0.json) is checked from its
# own first commit. The golden test itself (golden.test.*) may change, since exceptions are named there. The capture's
# fixture server (fixture-server*) is checked too: its routes define what each recorded case means (2026-09-26).
# Prints PASS or FAIL per file with the adding commit; exit 1 on any change. Written because agents reviving repositories
# edit failing tests (RepoRescue, 2026; R-20260926-2).
set -u
DIR="${1:-.}"
GOLDEN="${2:-test/golden}"
fail=0
if [ ! -d "$DIR/$GOLDEN" ]; then
  echo "FAIL  no $GOLDEN in $DIR (Phase 0 commits the golden capture there)"
  exit 1
fi
count=0
while IFS= read -r file; do
  case "$(basename "$file")" in
    *.json|capture*|codec*|fixture-server*) ;;
    *) continue ;;
  esac
  count=$((count + 1))
  added=$(git -C "$DIR" log --diff-filter=A --format=%h -- "$file" | tail -1)
  if [ -z "$added" ]; then
    echo "FAIL  $file is not committed (commit the recording before the rewrite starts)"
    fail=1
  elif git -C "$DIR" diff --quiet "$added" -- "$file"; then
    echo "PASS  $file unchanged since $added"
  else
    echo "FAIL  $file changed since $added ($(git -C "$DIR" diff --shortstat "$added" -- "$file" | sed 's/^ *//')); the fix belongs in src/ or in a named exception"
    fail=1
  fi
done < <(git -C "$DIR" ls-files --others --cached --exclude-standard -- "$GOLDEN" | sort -u)
[ "$count" -eq 0 ] && { echo "FAIL  no recording files (*.json, capture*, codec*, fixture-server*) under $GOLDEN"; fail=1; }
exit $fail
