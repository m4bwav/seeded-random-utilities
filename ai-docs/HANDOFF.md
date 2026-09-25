# Handoff

Updated 2026-09-25, interim: Stage 1 is done and pull request #17 is open with CI green; Stage 2 is in progress. Read this first, then [log.md](log.md) for evidence.

## Current state

- **Mark's rulings (2026-09-25).** Every recommendation was accepted, including D2b, added in Stage 1. The agent may delete the webhook and the branches, apply the repo settings, and turn on secret scanning and push protection. He said "do it all".
- **Branch `v2`.** It holds the rewrite in 6e48c40 (src/, config, lockfile v3), f0b59fb (tests), 5f3a37e (README, CHANGELOG, SECURITY.md, LICENSE) and 528bccf (workflows, dependabot.yml), plus doc commits. It is pushed.
- **Pull request #17**, v2 into master: https://github.com/m4bwav/seeded-random-utilities/pull/17. CI run 36195647679 is green in all 11 jobs; Bun 1.4.2 and Deno ran every golden case.
- **Verified locally:** 905 of 905 tests on Node 20.20.2, 22.23.3, 24.18.0 and 26.10.0, coverage 100 percent, publint and attw clean, tarball 40.5 kB, and a fresh clone is clean.
- **Ruleset 24022136** "master" is active: deletion and force push blocked, `ci` required, admin bypass.
- **An independent review** (a subagent) of src/ was started; its findings go into the pull request as a comment and into the log.
- **Nothing is published.** npm still has only 1.1.4.

## Next single action

Triage the independent review's findings on pull request #17 (the steps below follow).

## Stage 2 steps left, in order

1. Triage the review findings, and fix the real ones on v2 with a test each; CI must be green again.
2. Squash-merge #17. Record the full merge SHA as M, and let v2 be deleted.
3. Check that `gh api "repos/m4bwav/seeded-random-utilities/dependabot/alerts?state=open" --jq length` prints 0.
4. Close #5 to #16 with the loop in the plan's appendix (it names M and the tool behind each package).
5. Delete webhook 160643172 and apply the repo settings (plan appendix).
6. Turn on secret scanning and push protection:
   `gh api -X PATCH repos/m4bwav/seeded-random-utilities -f 'security_and_analysis[secret_scanning][status]=enabled' -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled'`.
7. **Stop:** Mark adds the npm trusted publisher (plan, Stage 3). Then 2.0.0-beta.1, then 2.0.0.

## Mark's own tasks

- Revoke the codecov token at codecov.io.
- Remove any Codecov, SonarCloud or Travis app at github.com/settings/installations and github.com/settings/applications.
- Add the npm trusted publisher.
- Approve each staged version with 2FA.

## Dead ends hit

- Nested quoting through the Bash tool (a node script inside double quotes with backticks and dollar signs) fails; use the Edit tool.
- `xo --fix` rewrites code. Stage your work first and read its diff to src/; it was harmless here.
