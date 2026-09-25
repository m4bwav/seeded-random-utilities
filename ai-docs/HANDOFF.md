# Handoff

Updated 2026-09-25: Stages 0, 1 and 2 of the v2 plan are done. Stage 3, the release, waits for Mark to add the npm trusted publisher. Read this first, then [log.md](log.md) for evidence.

## Current state

- **master.** At 3ed7bb2, the squash-merge of pull request #17, plus these docs. CI on master is green (run 36198953515).
- **The code.** It is 2.0.0, but `package.json` still says 1.1.4 and the CHANGELOG heading reads "Unreleased" until the release step.
- **Tests.** 1,223 pass on Node 20, 22, 24 and 26, plus Bun and Deno in CI; coverage is 100 percent.
- **An independent review** found 12 items, all fixed in 19f7f09; the summary is on #17.
- **GitHub:**
  - Dependabot alerts 0; no open pull requests (#5 to #16 closed with comments); only `master` on the remote; 0 webhooks.
  - Ruleset 24022136 protects `master`.
  - Private vulnerability reporting, secret scanning and push protection are on, and workflow permissions are read-only.
- **npm.** Only 1.1.4 is published. `release.yml`, `verify-published.yml` and `dependabot.yml` are in place; the first Dependabot run is on a Monday.
- **The plan.** Its Stage 4 item collects the playbook differences to apply at the end: [plans/2026-09-25-modernization-and-v2-release.md](plans/2026-09-25-modernization-and-v2-release.md).

## Waiting for Mark

1. **The npm trusted publisher**, once, in the browser. On npmjs.com, open seeded-random-utilities, then Settings, then Trusted publishing, and add a GitHub Actions publisher: user `m4bwav`, repository `seeded-random-utilities`, workflow `release.yml`, environment blank, "Allow npm publish" unticked. Also check that publishing access requires two-factor authentication. The exact form and its traps are in get-title-at-url's solution entry: `D:\m4bwa\Claude\Projects\Ai\get-title-at-url\ai-docs\solutions\2026-09-25-publish-to-npm-from-github-actions-without-a-stored-token-th.md`.
2. **Any time:** revoke the codecov token at codecov.io, and remove any Codecov, SonarCloud or Travis app at github.com/settings/installations and github.com/settings/applications.

## Next single action

When Mark confirms the trusted publisher, release the beta:

1. On `master`, run `npm version 2.0.0-beta.1`, then `git push --follow-tags`.
2. Watch `release.yml`, which stages the version under `next`, and stop while Mark approves it.
3. Run `verify-published.yml` with `2.0.0-beta.1`, and check `npm view seeded-random-utilities dist-tags` (`latest` must still be 1.1.4).
4. Then 2.0.0 the same way, after dating the CHANGELOG heading.
5. Then Stage 4: the inventory row, the playbook update, and the skill verdict.

## Dead ends hit

- The Bash tool fails on nested quoting (a node script in double quotes with backticks and dollar signs); use the Edit tool or a script file.
- The everlast handoff refuses a body without `## Next single action`.
