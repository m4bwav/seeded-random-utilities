---
title: Retrofit Phase 0 gap audit (2.0.0)
kind: note
date: 2026-09-29
verified: 2026-09-29
stale_after: 2027-03-29
tags: [retrofit, phase-0, survey, golden, npm, upgrade, deprecation, workflows]
summary: "what seeded-random-utilities 2.0.0 lacks against the package-modernize standard (gap table), the golden recordings replayed against today's npm packages, the new capture of the published 2.0.0 with edge inputs and error classes, every 1.x version measured with the 1.1.4 capture (1.0.0 to 1.1.3 shuffle with Math.random), the deprecation recommendation, and the errors in the shipped CHANGELOG, README and wiki; read before the retrofit plan or any release"
---

# Retrofit Phase 0 gap audit: seeded-random-utilities 2.0.0

## Summary

seeded-random-utilities 2.0.0 was modernized on 2026-09-25 by the playbook the package-modernize skill was later built from (pull request #17, 3ed7bb2). This audit, made with the skill's retrofit path on 2026-09-29 (its first npm retrofit), measures the package against the skill's current standard. The library needs no change for correctness: the recordings replay exactly, the new capture found one misleading error message and no wrong answer, and the build from master reproduces the published `dist/` byte for byte. The gaps are in the release path (the template's hardening of 2026-09-26 and the checks L-120 added on 2026-09-28), the install cooldown, a tag ruleset, and the docs. The audit also found that the CHANGELOG hides a behaviour change: 1.0.0 to 1.1.3 shuffle with `Math.random()`, so their `shuffle` and `generateRandomArrayOfUniqueIntegers` ignore the seed, and 1.1.4 fixed it. Evidence: [2026-09-29-survey.txt](2026-09-29-survey.txt) and `test/golden/`.

## Registry and repository

| Fact | Value |
|---|---|
| Versions | 1.0.0 (2019-11-22); 1.1.0 to 1.1.3 (2019-11-24); 1.1.4 (2019-11-25); 2.0.0-beta.1 and 2.0.0 (2026-09-25). None deprecated. Dist-tags: `latest` 2.0.0 only |
| Downloads | month to 2026-09-27: 502. Week to 2026-09-27 by version: 2.0.0 188, 2.0.0-beta.1 134, 1.1.4 88, 1.1.3 6, 1.1.2 5, 1.1.1 4, 1.0.0 4, 1.1.0 3 |
| 2.0.0 | 10 files, 44,434 bytes packed; provenance (SLSA v1) and a registry signature; no dependencies |
| 2.0.0-beta.1 | the same `dist/` byte for byte; only the CHANGELOG heading ("Unreleased") and the version differ |
| 1.x packages | every version has its CommonJS and ES builds and declarations; 1.0.0 to 1.1.3 ship the same JavaScript; 1.1.4 changes one expression (below); all depend on rand-seed ^0.1.2, which installs 0.1.5 (not deprecated) |
| Dependents | three public repositories name it, all `^1.1.4` and idle: DevLeoko/ArticleTrainer (last push 2022-04), Mervap/SoftwareTesting (2021-01), geometry-app/frontend (2024-10); the registry counts 0 |
| GitHub | 2 stars, 1 fork (gitter-badger, 2019); no issues ever; pull requests #1 to #17 all closed or merged; branches: master only; 0 alerts, 0 webhooks, no secrets or variables, no environments |
| Settings | secret scanning, push protection, Dependabot security updates and private vulnerability reporting on; workflow permissions read, Actions may not approve; wiki on; homepage the npm page |
| Rulesets | 24022136 on master (deletion and non-fast-forward blocked, required check `ci`, admin bypass); **no tag ruleset** |
| Licence | GitHub reports "other": LICENSE carries rand-seed's MIT notice after the package's own, which the licence detector does not match. npm reads `license: MIT` from package.json. Nothing to change |
| Actions | all pinned to SHAs, all on the node24 runtime; actionlint 1.7.12 with shellcheck 0.11.0: clean; zizmor 1.30.1: two `dependabot-cooldown` warnings, one `adhoc-packages` note on verify-published |
| README images | 3 badges (npm version, CI, npm downloads), all live; the repository README and the published one are identical; `check-readme-images.mjs --registry npm` exit 0 on both |
| Baseline (fresh clone of master 03fa799, Node 24.18.0, npm 11.16.0) | `npm ci` 493 packages; lint clean; typecheck clean; `npm test` 1223 of 1223; `npm run check` clean; coverage 100 percent; `npm run test:consumers` 6 of 6 (Bun and Deno skipped locally); the built `dist/` is byte-identical to the published 2.0.0 |

## Golden recordings

- `1.1.4.json` (322 cases, captured 2026-09-25 from the npm 1.1.4 with rand-seed 0.1.5): `capture-1.1.4.cjs` run today against a fresh install of 1.1.4 gave the same file byte for byte, apart from the capture date.
- `2.0.0.json` (150 cases of the methods new in 2.0.0, captured from the build before the release): `capture-2.0.0.cjs` run today against the published 2.0.0 and 2.0.0-beta.1 gave the same file, apart from the date.
- Against the current capture rules they fall short: no error class is recorded (2.0.0 throws TypeError and RangeError on purpose); the codec did not exist, so NaN, -0, Infinity, undefined, wrapper objects and Sets were never inputs; 2.0.0.json has no thrown case and no odd input, so 2.0.0's argument checks are pinned only by unit tests; and `capture-1.1.4.cjs` cannot run against 2.0.0 without a hand patch, because it reads rand-seed/package.json (L-123 `replayable-capture`). Both recordings are lossless (lone surrogates are JSON escapes, no carriage returns), and their thrown messages are the library's own.
- So a third capture was added, of the published 2.0.0 from npm: `test/golden/capture-2.0.0-npm.cjs` with the template's `codec.cjs`, written to `2.0.0-npm.json` (507 cases). It holds every public method with normal, edge and odd inputs on sfc32, the normal calls on all five algorithms and two seeds, the constructor's seed and algorithm handling, hand-made random sources, `Rand`, `getState` and `fromState` with valid and invalid states, and the export shape (export names, static and prototype members with their arities, `PRNG`). After each case it records one more `random()`, which pins how many numbers the calls drew. The file is ASCII (every other character is a JSON escape, L-112).
- Runtimes: the capture gives the same file run twice, and on Node 20.20.2, 22.23.3, 24.18.0 and 26.10.0 apart from the `node` line; Deno 2.9.6 gives the same cases; Bun 1.4.2 differs in one case only, the engine's wording of "is not a function" for a method that does not exist (the header lists it under `engineWorded`). One recording therefore serves every runtime, and the golden suite compares that message on Node only.
- Replayable: it loads the package by name, records a missing method or export as the error it throws, and reads rand-seed's version with a lookup that answers `none`, so it runs unchanged against 1.1.4 or a future 3.0.0.

## What the new capture shows

Every answer is 2.0.0's documented behaviour or 1.1.4's kept on purpose, with one finding:

1. `selectWeightedRandomElement(['a', 'b'], [Number.MAX_VALUE, Number.MAX_VALUE])` throws `RangeError: selectWeightedRandomElement: the weights must add up to more than 0`. Each weight is valid; their sum overflows to Infinity, and the check that refuses it shares the message of the zero-total check. The class is right (a unit test expects the throw); the wording is wrong, and the JSDoc says only "or the weights add up to 0". Found no other bug.

Kept from 1.1.4 and recorded, not findings: `selectRandomElement` and `shuffle` of a number or a Set return undefined or an empty array; `selectUniqueRandomElements` with 1.5 picks returns two elements, with NaN none and with Infinity all; the deprecated names return NaN for NaN arguments. New in 2.0.0 and recorded: `getRandomChar` and `getRandomString` pick from a pool by code point, so a lone surrogate in a pool is a character; `fromState` accepts an all-zero sfc32 state and refuses an all-zero xoshiro state; a custom source's numbers pass through unchecked (`next()` returning 1 or -0.5 comes back from `random()`).

## Every version, measured with the 1.1.4 capture (L-094, L-108, L-110)

- The most downloaded version is 2.0.0; 1.1.4 is third and is the contract. So no popular old version needs its own recording.
- `capture-1.1.4.cjs` run against 1.0.0, 1.1.0, 1.1.1, 1.1.2 and 1.1.3: all five answer alike and match 1.1.4 in 274 of 322 cases. The 48 others are every `shuffle` case (24), every `generateRandomArrayOfUniqueIntegers` case that shuffles (18) and the six scripts. The cause is one expression: 1.0.0 to 1.1.3 compute the shuffle index with `Math.random()`, 1.1.4 with `this.random()`. So in 1.0.0 to 1.1.3 those two methods give a different answer on every run for the same seed (checked: two runs with the seed "1234" differ), and every number drawn after a shuffle comes out shifted, because the shuffle draws nothing from the seeded generator.
- The CHANGELOG entry for 1.1.4 says "The same code as 1.1.3, published again", and the wiki's Versions and upgrading table repeats it. Both are wrong.
- 1.1.4, the last 1.x, loads and gives its first number for the seed "1234" (0.3111365893855691) on Node 20, 22, 24 and 26.

Deprecation recommendation (for the plan): deprecate 1.0.0 to 1.1.3, whose seeded shuffle is not seeded; leave 1.1.4, which works and which the three dependents resolve, until 3.0.0.

## Gap table

| Item | Current state | Standard (SKILL.md, references/npm.md, references/retrofit.md, templates/npm) |
|---|---|---|
| Golden capture | 1.1.4.json and 2.0.0.json, replay exactly today; no error classes, no odd inputs for 2.0.0, not replayable against 2.0.0 | done in Phase 0: capture-2.0.0-npm.cjs, codec.cjs, 2.0.0-npm.json; the golden suite must replay the new file too |
| Golden files untouched | checked by hand and by scripts/preflight-tag-npm.sh before a tag | also in CI on every push (L-120), against the commit that added each file |
| release.yml publish job | one job holds contents and id-token set to write, stages without `--ignore-scripts`, then creates the GitHub Release | template of 2026-09-26: the staging job holds only id-token, installs nothing, `npm stage publish --ignore-scripts`; the GitHub Release is its own job with contents set to write (R-20260926-1) |
| release.yml checks | tag equals package.json version; changelog section and date; lint, typecheck, test, check, consumers on a tarball it packs itself; then packs again for staging | L-120 for npm (not yet in the npm template): the tagged commit is on master and has a successful `ci` check; the consumers and the content check run on the very tarball that is staged, also on Windows and the Node floor |
| ci.yml | cancels in-progress runs on master too | cancel only pull request runs, so every master commit keeps its `ci` result (L-120); the golden files checked unchanged |
| verify-published.yml | registry package on three OSes, Node 20 to 26, Bun, Deno, fresh-project smoke, `npm audit signatures`; waits 20 tries | as now; zizmor's `adhoc-packages` suppressed by the template's zizmor.yml |
| Install cooldown | no `.npmrc` | template `.npmrc` with `min-release-age=3` |
| Dependabot | weekly, grouped, held majors; no cooldown | seven-day cooldown on both ecosystems (zizmor) |
| zizmor config | none | template .github/zizmor.yml |
| xo config and .gitignore | neither ignores `release-notes.md` (L-039); `unicorn/prefer-promise-with-resolvers` on while the floor is Node 20 (L-049) | template entries |
| Tag ruleset | none | admins only (templates/rulesets/tags-admins-only.json) |
| Branch ruleset, security settings | done | nothing to do |
| README | the error sentence is wrong (the wiki note's item 1); omissions: yarn 4's `yarn node`, the `instanceof` hazard across the two builds, `String` seeds, `getState()` on an unseeded generator | corrected in the next release (npm renders the README from the tarball) |
| CHANGELOG | the 1.1.4 entry is wrong (above); the 1.1.0 to 1.1.3 entry does not say 1.0.0's `ISeededRandomUtilities` went away | corrected in the next release |
| AGENTS.md | "stays the published version until 2.0.0 ships" and "Once v2 lands" are stale; no word of the new capture, the cooldown or the L-120 checks | rewritten for 2.x standing work |
| ai-docs | everlast, mode repo, sync push, lint clean | nothing to do |
| GitHub wiki | nine pages for 2.0.0 (wiki commit 7980d4b) with a verification script and its saved output | wikiwright Update mode after the release: fix the Versions table's 1.1.4 line, add what the new capture shows |
| Data provenance (L-093) | no embedded data; the algorithms are checked against BigInt oracles from the authors' C code | nothing to rebuild |
| Old versions | none deprecated | deprecate 1.0.0 to 1.1.3 (above), the maintainer's ruling |

Related: builds on [2026-09-28-github-wiki.md](2026-09-28-github-wiki.md); see also [2026-09-25-rand-seed-history-and-the-1-1-4-golden-sequences.md](2026-09-25-rand-seed-history-and-the-1-1-4-golden-sequences.md), [../plans/2026-09-25-modernization-and-v2-release.md](../plans/2026-09-25-modernization-and-v2-release.md).
