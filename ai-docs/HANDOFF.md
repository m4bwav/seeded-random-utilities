# Handoff

Updated 2026-09-25: Stages 0 to 2 are done, and 2.0.0-beta.1 is staged on npm waiting for Mark's approval (Stage 3). Read this first, then [log.md](log.md) for evidence.

## Current state

- **master.** At 11aff9f ("2.0.0-beta.1", tag v2.0.0-beta.1) plus doc commits. The rewrite is pull request #17, 3ed7bb2. CI is green. The CHANGELOG heading reads "## [2.0.0] - Unreleased", which is correct for a prerelease.
- **Release run 36200979437** is green: the build job ran lint, types, tests, check and the consumer fixtures. `npm stage publish` staged seeded-random-utilities@2.0.0-beta.1 with tag `next` (stage id f59d0341-fbe2-4423-837d-45441b2bd9e4, provenance signed, sigstore log index 2962717492, 44.4 kB, 10 files). The GitHub prerelease v2.0.0-beta.1 exists.
- **npm dist-tags:** `latest` is 1.1.4. The staged version is invisible until approved.
- **The trusted publisher** was added by Mark on 2026-09-25.
- **The codecov token** will not be revoked, by Mark's decision; see the log.
- **The plan:** [plans/2026-09-25-modernization-and-v2-release.md](plans/2026-09-25-modernization-and-v2-release.md). Its Stage 4 item collects the playbook differences.

## Waiting for Mark

Approve 2.0.0-beta.1 on npmjs.com (the package page's Staged Packages tab, with 2FA).

## Next single action

After the approval:

1. Run `gh workflow run verify-published.yml -R m4bwav/seeded-random-utilities -f version=2.0.0-beta.1` and watch it; all 15 jobs must pass.
2. Check `npm view seeded-random-utilities dist-tags`: `latest` must still be 1.1.4 and `next` must be 2.0.0-beta.1.
3. In a temp project, `npm install seeded-random-utilities@next` and run `npm audit signatures`.
4. Then 2.0.0:
   - Date the CHANGELOG heading (`## [2.0.0] - <date>`) and commit.
   - Run `npm version 2.0.0` and `git push --follow-tags`.
   - Mark approves; run verify-published with 2.0.0.
5. Then Stage 4: rewrite this file, add the inventory row, update the playbook from the plan's collected list, and give the skill verdict.

## Dead ends hit

- The Bash tool loses backslashes and fails on nested quoting; use the Edit tool or a script file (it cost two retries this run).
- The everlast handoff refuses a body without `## Next single action`.
