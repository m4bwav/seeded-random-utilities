# Handoff

Updated 2026-09-29: the retrofit to the package-modernize standard is done ([plans/2026-09-29-retrofit-and-2.0.1-release.md](plans/2026-09-29-retrofit-and-2.0.1-release.md), status done). 2.0.1 is released and verified, 1.0.0 to 1.1.3 are deprecated, `next` points at 2.0.1, and the wiki is updated for 2.0.1. Read [log.md](log.md) for evidence.

## Current state

- **npm.** `latest` and `next` are both 2.0.1 (published 2026-09-29, approved by Mark, SLSA provenance, no dependencies). 1.0.0 to 1.1.3 carry the deprecation message "1.0.0 to 1.1.3 shuffle with Math.random, so shuffle and generateRandomArrayOfUniqueIntegers ignore the seed. Use 2.x, which keeps 1.1.4's sequences, or 1.1.4."; 1.1.4 and 2.x are not deprecated. The prerelease 2.0.1-beta.2 is on npm; the tag v2.0.1-beta.1 exists on GitHub with no npm version (its release run failed before staging).
- **Verified from the registry.** verify-published run 36621026089 green in all 15 jobs (Node 20 to 26 on Linux, Windows and macOS, Bun, Deno); `verify-registry-npm.sh` VERIFIED (signature and attestation); the README's three badges load from the published tarball, and npm shows the corrected error sentence.
- **GitHub:**
  - Releases v2.0.1, v2.0.1-beta.2 (prerelease), v2.0.0, v2.0.0-beta.1.
  - Ruleset 24022136 protects `master` (requires the final `ci` job); ruleset 24191908 limits tags to admins. Only `master`, 0 webhooks, no open pull requests or issues.
  - Secret scanning, push protection and private vulnerability reporting are on, and workflow permissions are read-only.
- **The release path.** release.yml checks that the tag is on master, waits for ci's push run, builds, runs publint and attw, tests, packs once, checks the tarball and runs the consumer fixtures on it, stages that tarball and makes the GitHub Release. The ci wait worked for 2.0.1-beta.2 and 2.0.1.
- **The contract.** `test/golden/1.1.4.json` (322 cases), `2.0.0.json` (150) and `2.0.0-npm.json` (507); CI fails if any recording, capture script or `codec.cjs` changes. Never regenerate them.
- **The wiki** (https://github.com/m4bwav/seeded-random-utilities/wiki, 9 pages, commit 3b789c5, 2026-09-29). How to update it at the next release: [notes/2026-09-28-github-wiki.md](notes/2026-09-28-github-wiki.md); the script and its output are `notes/2026-09-29-wiki-verify.mjs` and `.out.txt`.
- **The codecov token of 2019** is not revoked, by Mark's decision; see the log.

## Waiting on Mark

- m4bwav/package-modernize#20: the skill fixes from this release (release job builds before publint, watch-run.sh reads the conclusion; lessons L-132 to L-134, L-127 confirmed). Merging it was refused to the agent as a merge without review.
- m4bwav/package-modernization#16: the records (inventory row, Wikis row, kickoff status and findings, the overlay line on npm 2FA commands).

## Standing work

1. **Dependabot** opens npm (minor and patch grouped) and GitHub Actions pull requests on Mondays. Merge when `ci` is green, and read the release notes for a major. Two majors are held in `.github/dependabot.yml`: TypeScript 7, until xo supports it, and the Node type definitions, which are bumped by hand.
2. **A patch or minor** follows the ritual in AGENTS.md; no beta is needed unless `release.yml` or the npm setup changed. If release.yml's steps change, run the build job's `run:` lines in order in a fresh clone before tagging (skill L-132 `build-before-publint`). `npm deprecate` and `npm dist-tag` are Mark's to run in his terminal (after `npm login` when `npm whoami` fails); the agent gives the exact commands and reads the results back.
3. **Never change a seeded sequence.** A fix goes under a new name, with a decision entry and a changelog line (AGENTS.md).
4. **3.0.0**, not before Node 22 reaches end of life on 2027-04-30:
   - Remove the deprecated `getRandomIntegar`, `getRandomArbitrary`, `getRandomIntInclusive`, `generateRandomArrayOfUniqueIntegers` and the static `default`.
   - Raise `engines` to Node 24, as get-title-at-url's v4 plan does.
   - After it: `next` to 3.0.0 or removed (never below `latest`).
5. **The wiki** is updated at each release with wikiwright's update mode (the note above).
6. **Optional, Mark:** revoke Codecov under Authorized OAuth Apps at github.com/settings/applications, and remove any unused SonarCloud or Travis CI app.
7. **Optional Stage 5, not planned:** JSR, or a seeded-random playground page on markdavidrogers.com.
8. **Evergreen upkeep** the SessionStart hooks asked for on 2026-09-29 (refresh game-snapshots, context-health, everlast-protocol, unity-agent-cli; the evergreen plugin's verify-at-use claims), and package-modernize's research refresh by 2026-10-05. Not part of this package.

## Next single action

None for this package until Dependabot's next pull request or a new release. Mark merges package-modernize#20 and package-modernization#16.

## Dead ends hit

- The Bash tool fails on nested quoting and drops the backslashes of Windows paths; use the Edit tool or a script file. A quoted heredoc turned `\\n` into a real newline inside a Python string on 2026-09-29.
- `xo --fix` rewrites code; stage first and read the diff it makes to `src/`.
- The everlast lint reads at-sign words as handles, and the handoff needs a `## Next single action` section.
- A local preflight passes with a stale `dist/` on disk; only a fresh clone shows what a release job's step order does.
