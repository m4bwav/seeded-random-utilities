---
title: Retrofit and 2.0.1 release
kind: plan
status: active
date: 2026-09-29
verified: 2026-09-29
stale_after: never
tags: [retrofit, plan, npm, github-actions, golden, release, deprecation, wiki]
summary: "the living plan for bringing seeded-random-utilities 2.0.0 up to the package-modernize standard: the gap audit's findings, decisions R1-R12 (no library change, the third golden recording, the release path that checks what it stages, the install cooldown, a tag ruleset, docs corrections, a 2.0.1 patch rehearsed as 2.0.1-beta.1, deprecating 1.0.0 to 1.1.3), phases with checkboxes, verification checklist"
---

# Retrofit and 2.0.1 release plan: seeded-random-utilities

The retrofit path of the package-modernize skill (references/retrofit.md, its first npm run) applied to 2.0.0, which the playbook produced on 2026-09-25. Evidence goes in [../log.md](../log.md); the audit behind every row is [../notes/2026-09-29-phase-0-gap-audit.md](../notes/2026-09-29-phase-0-gap-audit.md). Work happens on the branch `v2-retrofit`.

## Status

Active, 2026-09-29: Phase 0 done (gap audit, third golden recording committed on `v2-retrofit`). Waiting for Mark's rulings on the decisions below.

## Goal

- Behaviour unchanged: every recorded answer of 1.1.4 and 2.0.0 stays exact, proven by three recordings on both builds, every Node line, Bun and Deno.
- A release path that stages only a tarball whose `ci` passed on master and whose consumers ran on that very file.
- The template standard of 2026-09-29 (cooldowns, zizmor, tag ruleset), with the npm templates brought to the NuGet templates' L-120 level and proven here.
- The shipped README and CHANGELOG corrected on npm, and the old versions that ignore the seed deprecated.

## Where it stands (survey 2026-09-29)

See the audit note's tables. In short: 2.0.0 latest with provenance; 1.0.0 to 1.1.4 undeprecated; three idle dependents on `^1.1.4`; no issues, pull requests, alerts, webhooks or stale branches; master ruleset and security settings in place; no tag ruleset; baseline all green (1223 tests, 100 percent coverage) and the build reproduces the published `dist/` byte for byte.

## What the audit found, and what the retrofit does

1. 1.0.0 to 1.1.3 shuffle with `Math.random()`, so `shuffle` and `generateRandomArrayOfUniqueIntegers` ignore the seed there; 1.1.4 fixed it, and its CHANGELOG entry calls it a re-publish. Retrofit: correct the CHANGELOG entry (2.0.1), the wiki's Versions table, and deprecate 1.0.0 to 1.1.3 (R9).
2. `selectWeightedRandomElement` says "the weights must add up to more than 0" when valid weights overflow to Infinity. Retrofit: no code change (R1); the wiki's Errors page names the case.
3. The README's error sentence, the missing 1.0.0 type rename in the CHANGELOG and the stale AGENTS.md lines (the wiki note's items 1, 3 and 4). Retrofit: corrected (R8).
4. The release path predates the template's hardening and L-120 (R3, R4).

## Decisions (recommendation first; Mark rules in the plan review, silence means the recommendation stands)

| # | Question | Recommendation | Why | Alternative |
|---|---|---|---|---|
| R1 | Library code | No change to `src/`. The overflowing-weights message stays as it is in 2.x; 3.0.0 can word it "the weights must add up to a finite number above 0" | The class is right, a unit test expects the throw, and the case needs weights near 1.8e308; the kickoff's default is none | Fix the message in place in 2.0.1: the one case in 2.0.0-npm.json becomes a named exception, and a caller matching on the text sees a new message |
| R2 | The golden contract | Three recordings, replayed on both builds: 1.1.4.json (322), 2.0.0.json (150) and the new 2.0.0-npm.json (507, the published 2.0.0 with edge inputs and error classes, through codec.cjs); the one engine-worded message is compared on Node only | The old two replay exactly but hold no error class or odd input for 2.0.0's own checks; the new capture runs unchanged against 1.1.4 and a 3.0.0 | Keep two recordings and pin 2.0.0's checks with unit tests only |
| R3 | release.yml | The template's current shape: staging job with only id-token set to write, no install, `npm stage publish --ignore-scripts`; the GitHub Release in its own job. Plus the L-120 checks for npm: the tagged commit is on master; release.yml waits (bounded, 30 minutes) for the `ci` check run on the tagged commit and stops unless it succeeded; packs once; the content check and the consumer fixtures run on that tarball on Linux (Node 24), Linux (Node 20) and Windows; that tarball is what gets staged | `npm version` pushes the commit and the tag together, so `ci` on the tagged commit is still running when release.yml starts: a wait keeps the one-command ritual; a check without the wait would always fail | Tag only after `ci` is green: `npm version --no-git-tag-version` in a commit, push, wait, then `git tag` and push the tag (two steps, no wait loop) |
| R4 | ci.yml | Cancel in-progress runs only for pull requests; a step that fails when any golden recording, capture script or codec.cjs differs from the commit that added it; the rest unchanged | L-120: every master commit keeps its `ci` result, which release.yml reads; the untouched check runs on every push, not only before a tag | Leave cancelling on and rely on preflight-tag-npm.sh |
| R5 | Install cooldown, Dependabot, zizmor | Add `.npmrc` (`min-release-age=3`), a seven-day Dependabot cooldown on both ecosystems, and .github/zizmor.yml from the template; xo and `.gitignore` ignore `release-notes.md`; xo turns `unicorn/prefer-promise-with-resolvers` off while the floor is Node 20 | Template standard since 2026-09-26 (L-039, L-049); zizmor then reports nothing | Skip the cooldowns (zizmor keeps warning) |
| R6 | Tag ruleset | Apply templates/rulesets/tags-admins-only.json (create, move and delete any tag: repository admins only) before the pull request stop | Whoever can push a `v*` tag starts release.yml; staged publishing still needs Mark, but the ruleset stops a leaked token from staging at all (L-077: settings before the pull request) | No tag ruleset (the stage-and-approve gate stays) |
| R7 | Node floor, runtime dependencies, dev dependencies | Unchanged: engines `>=20`, CI 20 to 26, zero runtime dependencies, dev dependencies as locked (only the held majors TypeScript 7 and Node types 26 are newer) | Nothing moved; the next floor change is 3.0.0 after 2027-04-30 | none |
| R8 | Docs | README: the error sentence corrected, and four short additions (yarn 4 needs `yarn node`; ES and CommonJS builds are two classes, so `instanceof` fails across them; a `String` object is a seed; `getState()` throws on an unseeded generator). CHANGELOG: a 2.0.1 section (docs and release path only, same answers), the 1.1.4 entry corrected, the 1.0.0 type rename named. AGENTS.md: the stale lines rewritten, the three recordings, the release checks | npm shows the README and CHANGELOG from the tarball, so they reach users only with a release; the wiki found these on 2026-09-28 | Fix only the repository and leave npm on 2.0.0's text |
| R9 | Deprecations on npm | `npm deprecate seeded-random-utilities@"<1.1.4" "1.0.0 to 1.1.3 shuffle with Math.random, so shuffle and generateRandomArrayOfUniqueIntegers ignore the seed. Use 2.x, which keeps 1.1.4's sequences, or 1.1.4."` Leave 1.1.4 undeprecated until 3.0.0 | The range is exactly the five versions measured; their seeded shuffle is not seeded; 1.1.4 works and three dependents resolve it | Deprecate all of 1.x with "Use 2.x, which keeps 1.1.4's sequences" (the three dependents then see a warning on install) |
| R10 | Release and version | 2.0.1, a patch: README and CHANGELOG corrections and the new release path, the same `dist/` answers. Rehearsed as 2.0.1-beta.1 under `next`, because release.yml changes shape (a new wait, a new job, checks read). After 2.0.1: move `next` to 2.0.1 (`npm dist-tag add seeded-random-utilities@2.0.1 next`), which I may run in my terminal session since Mark stays logged in | A release is warranted by the README on npm and the first use of a changed release workflow (retrofit.md); a beta proves the path without touching `latest` | No release: workflows and docs on master only, the wiki against 2.0.0; or 2.0.1 without a beta; or remove `next` instead of moving it |
| R11 | GitHub deletions | None needed: master is the only branch, no webhooks, no open pull requests. `v2-retrofit` is deleted by GitHub on merge (delete_branch_on_merge is on) | Nothing stale | none |
| R12 | Templates and the skill | The npm templates take R3 to R5 once proven here; references/retrofit.md becomes registry-neutral with the npm specifics in references/npm.md; lessons from L-125 | The kickoff's skill work | none |

## Build and package specifics

- Unchanged: `src/`, `tsdown.config.ts`, `tsconfig.json`, package.json's shape and `files`.
- `test/golden/golden.test.js` gains a third block for 2.0.0-npm.json that builds each case's instance the way the capture does (a `$source` seed is a cycling source), decodes the arguments with codec.cjs, compares results and `next` exactly, and skips the engine-worded message off Node.
- `test/consumers/consumers.test.js` accepts a tarball path in CONSUMER_PACKAGE, so release.yml can run the fixtures on the file it stages.
- A small test/package/check-tarball.sh (or a node script) compares a tarball's file list with the expected ten files; ci.yml and release.yml both call it.

## Phases

### Phase 0: gap audit (2026-09-29, no package code changed)
- [x] Survey saved: [../notes/2026-09-29-survey.txt](../notes/2026-09-29-survey.txt); gap audit: [../notes/2026-09-29-phase-0-gap-audit.md](../notes/2026-09-29-phase-0-gap-audit.md)
- [x] Baseline from a fresh clone: all green; the build reproduces the published `dist/`
- [x] Recordings replayed against today's npm packages; 1.0.0 to 1.1.3 measured; 1.1.4 loaded on Node 20 to 26
- [x] Third recording committed: test/golden/capture-2.0.0-npm.cjs, codec.cjs, 2.0.0-npm.json (identical on Node 20 to 26 and Deno; Bun differs in one engine message)
### Phase 1: plan
- [ ] This plan. **Stop**: Mark rules on R1 to R12, and answers the one question (the tag ruleset, the deprecation and the `next` tag).
### Phase 2: retrofit on v2-retrofit
- [ ] Golden suite replays 2.0.0-npm.json on both builds; commit; canary: a planted line in `src/` turns it red, reverted, green (both runs logged); `git diff --exit-code` on the golden files against their commits
- [ ] Workflows, `.npmrc`, Dependabot, zizmor, xo and `.gitignore` from the templates; each new CI check run locally with `bash -e -o pipefail` on the real tarball with a right and a wrong expectation (L-103); CI's exact commands locally (L-101)
- [ ] README, CHANGELOG (2.0.1 section), AGENTS.md
- [ ] actionlint with shellcheck, zizmor, check-workflow-shell.py, check-readme-images.mjs --registry npm clean; placeholders grepped
- [ ] Pushed; pull request with a "For review" list
### Phase 3: review
- [ ] Independent read-only review (prompts/review-subagent.md) with a differential of the new build against the published 2.0.0 over generated inputs on every supported Node line; findings fixed or answered
- [ ] Tag ruleset applied (R6) before the pull request stop. **Stop.**
### Phase 4: merge
- [ ] CI green (run id); merged by Mark or with his go; method and SHA read back
### Phase 5 and 6: rehearsal and release
- [ ] `preflight-tag-npm.sh 2.0.1-beta.1` READY; tagged; staged under `next`; **stop** for Mark's approval; verified from the registry
- [ ] CHANGELOG dated; 2.0.1 tagged, staged, **stop** for the approval; verify-published on every platform and runtime; `check-next-tag-npm.sh` passes after `next` moves
- [ ] Deprecation of 1.0.0 to 1.1.3 (R9) run after Mark's OK; `npm view seeded-random-utilities@1.1.3 deprecated` shows it
### Phase 7: wrap-up
- [ ] Wiki with wikiwright's Update mode for 2.0.1 (Versions table, the new capture's findings)
- [ ] HANDOFF, inventory row, Wikis row, kickoff corrections, skill lessons and templates

## Test strategy

| Layer | What it proves | Runs where |
|---|---|---|
| Golden: 1.1.4.json, 2.0.0.json, 2.0.0-npm.json | every recorded answer, error class and draw count, both builds | CI on Node 20 to 26, Windows, macOS; 1.1.4.json also under Bun and Deno through the consumer fixture |
| Unit, generators, distribution | properties and the BigInt oracles | as now |
| Package shape and the tarball check | ten files, exports, portability, bare engine | ci.yml and release.yml (on the staged tarball) |
| Consumer fixtures | ESM, CommonJS, four TypeScript modes | ci.yml; release.yml on the staged tarball (Linux Node 24 and 20, Windows); verify-published from npm |
| Release gate | ci green on the tagged commit, on master | release.yml, proven by 2.0.1-beta.1 |

## Security

No tokens exist (trusted publishing, staged, no environment, workflow release.yml). The staging job loses contents set to write and runs nothing from dependencies. Tag ruleset (R6). Install cooldown (R5). Nothing else changes: secret scanning, push protection, private reporting and read-only workflow permissions are on.

## Verification checklist

| Claim | Command or place | Expected |
|---|---|---|
| Same answers | `npm test`, CI, verify-published | 1.1.4.json, 2.0.0.json and 2.0.0-npm.json exact on both builds and every line |
| Recordings untouched | CI step; `git diff --exit-code` against each file's commit | empty |
| Release checks what it stages | release.yml run of 2.0.1-beta.1 | the ci wait, the tarball check and the consumers on the staged file all logged |
| Workflows clean | actionlint (shellcheck), zizmor, check-workflow-shell.py | no findings |
| README on npm | check-readme-images.mjs on the published 2.0.1 README; `npm view seeded-random-utilities readme` | exit 0; the corrected error sentence |
| Tags | `npm view seeded-random-utilities dist-tags`; check-next-tag-npm.sh | latest 2.0.1; next 2.0.1 or absent |
| Deprecation | `npm view seeded-random-utilities@1.1.3 deprecated`, `@1.1.4 deprecated` | the R9 message; empty |

## Risks and open points

- The ci wait: `ci` on the version commit takes about five minutes; the wait is bounded and fails loudly if the check is missing or red.
- Staging from a tarball packed in one job and tested in another: the tarball travels as an artifact and its SHA-512 is printed in both jobs.

## Next single action

Mark rules on R1 to R12 and answers the one question in the stop message.
