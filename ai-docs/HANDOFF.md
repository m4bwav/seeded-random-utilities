# Handoff

Updated 2026-09-25: seeded-random-utilities 2.0.0 is released and verified, and the modernization plan is done. What remains is standing work. Read [log.md](log.md) for evidence.

## Current state

- **npm.** `latest` is 2.0.0, approved by Mark on 2026-09-25, with SLSA provenance and no dependencies; `next` is 2.0.0-beta.1. GitHub Releases v2.0.0 and v2.0.0-beta.1 (a prerelease) exist. master holds the release, and CI is green on every push.
- **Verified from the registry.** verify-published run 36202020534 was green in all 15 jobs (Node 20 to 26 on Linux, Windows and macOS, Bun, Deno). Locally, `npm audit signatures` verified the signature and the attestation, and require and import give 1.1.4's numbers.
- **GitHub:**
  - 0 Dependabot alerts, no open pull requests or issues, only `master`, 0 webhooks.
  - Ruleset 24022136 protects `master`.
  - Secret scanning, push protection and private vulnerability reporting are on, and workflow permissions are read-only.
- **The contract.** `test/golden/1.1.4.json` holds 322 cases from the published 1.1.4, and `test/golden/2.0.0.json` holds 150 cases pinning the methods new in 2.0.0. Never regenerate either one.
- **Records.** The plan, now a record: [plans/2026-09-25-modernization-and-v2-release.md](plans/2026-09-25-modernization-and-v2-release.md). The release ritual is in AGENTS.md; the npmjs.com trusted-publisher fields are in get-title-at-url's solution entry on trusted publishing.
- **The codecov token of 2019** is not revoked, by Mark's decision; see the log.

## Standing work

1. **Dependabot** opens npm (minor and patch grouped) and GitHub Actions pull requests on Mondays. Merge when `ci` is green, and read the release notes for a major. Two majors are held in `.github/dependabot.yml`: TypeScript 7, until xo supports it, and the Node type definitions, which are bumped by hand.
2. **A patch or minor** follows the ritual in AGENTS.md; no beta is needed unless `release.yml` or the npm setup changed. verify-published already passes `--minimum-dependency-age=0` to Deno for versions under 24 hours old.
3. **Never change a seeded sequence.** A fix goes under a new name, with a decision entry and a changelog line (AGENTS.md).
4. **3.0.0**, not before Node 22 reaches end of life on 2027-04-30:
   - Remove the deprecated `getRandomIntegar`, `getRandomArbitrary`, `getRandomIntInclusive`, `generateRandomArrayOfUniqueIntegers` and the static `default`.
   - Raise `engines` to Node 24, as get-title-at-url's v4 plan does.
5. **`next` stays on 2.0.0-beta.1.** Removing the tag needs an npm login with 2FA, and a 3.0.0 beta will move it anyway.
6. **Optional, Mark:** revoke Codecov under Authorized OAuth Apps at github.com/settings/applications, and remove any unused SonarCloud or Travis CI app.
7. **Optional Stage 5, not planned:** JSR, or a seeded-random playground page on markdavidrogers.com.

## Next single action

Nothing is pending. Start from item 1 when Dependabot pull requests appear.

## Dead ends hit

- The Bash tool fails on nested quoting and drops the backslashes of Windows paths; use the Edit tool or a script file.
- `xo --fix` rewrites code; stage first and read the diff it makes to `src/`.
- The everlast lint reads at-sign words as handles, and the handoff needs a `## Next single action` section.
