---
title: Modernization and v2 release
kind: plan
status: active
date: 2026-09-25
verified: 2026-09-25
stale_after: never
tags: [v2, plan, npm, github-actions, typescript, tests, release, determinism, prng]
summary: "the living plan for seeded-random-utilities 2.0.0: survey and baseline, what 1.1.4 gets wrong, decisions D1-D21 (determinism, zero deps, names, additions), the v2 API with the 1.1.4 name map, build and test strategy per artifact, stages 0-4 with checkboxes, pull request dispositions, security, verification checklist"
---

# Modernization and v2.0.0 release plan: seeded-random-utilities

This is a living plan. Tick items as they land and put the evidence (commit, pull request, workflow run id, `npm view` output) in [../log.md](../log.md); dates are absolute. It follows the package modernization playbook, which lives outside this repository at `D:\m4bwa\Claude\Projects\Ai\package-modernization\playbook.md`. It copies its templates from get-title-at-url (`D:\m4bwa\Claude\Projects\Ai\get-title-at-url`, public at github.com/m4bwav/get-title-at-url), whose own plan is the reference run.

The research behind the determinism decisions is [../notes/2026-09-25-rand-seed-history-and-the-1-1-4-golden-sequences.md](../notes/2026-09-25-rand-seed-history-and-the-1-1-4-golden-sequences.md), and the decision record is [../decisions/2026-09-25-v2-shape-keep-the-1-1-4-sequences-zero-deps-deprecated-aliases.md](../decisions/2026-09-25-v2-shape-keep-the-1-1-4-sequences-zero-deps-deprecated-aliases.md). Paths of files that do not exist yet are written without code formatting.

## Goal

Ship `seeded-random-utilities` 2.0.0 to npm with these properties:

- **Same seed, same sequence.** Every seeded call that 1.1.4 handled returns exactly what 1.1.4 returned, on every runtime, proven by golden fixtures captured from the published 1.1.4.
- **Usable everywhere.** It works from `import` and `require` with types for both, on every supported Node line (20, 22, 24, 26), and in browsers, Bun, Deno and workers. The library uses nothing but ECMAScript: no Node APIs and no DOM.
- **No runtime dependencies.**
- **Fixed and more useful.** Every bug below is fixed and the API is more useful, without breaking a 1.1.4 name.
- **Released properly.** It is published from GitHub Actions through npm trusted publishing in staged mode, with provenance, GitHub Releases, a changelog, CI on every push and pull request, and Dependabot. None of the dead services remain (Travis, codecov, David, Gitter, SonarCloud), and the leaked codecov token is revoked.
- **Documented for handoff.** The README is rewritten, AGENTS.md is imported by CLAUDE.md with a Copilot pointer, and `ai-docs/` is kept current.

## Status

2026-09-25: Stage 0 is done.

- **Done.** The survey and baseline are below. The golden fixtures are committed on master, captured from the published 1.1.4 before any code change. Everlast is registered (mode repo, sync push). AGENTS.md, CLAUDE.md and the Copilot pointer are written, along with this plan, the research note and the decision record.
- **Waiting for Mark.** He rules on the decisions table (silence means the recommendations stand) and answers the three questions under Stage 0.
- **Not started.** No package code has changed and nothing is published.

Update this section as stages land.

## Where it stands (survey 2026-09-25)

| Area | State | Evidence |
|---|---|---|
| npm | 1.1.4 is `latest`, published 2019-11-25. There are six versions since 2019-11-22 (1.0.0, 1.1.0 to 1.1.4). 72 downloads from 2026-08-25 to 2026-09-23 and 3,885 in the year to 2026-09-23; 0 dependents. Maintainer `markrogers` | `npm view`, api.npmjs.org, registry search |
| Package shape | `main` is the CJS bundle, `module` the ES bundle, `types` is `dist/index.d.ts`, and `files` is `[dist]`. There is no `exports`, `engines` or `sideEffects`. CommonJS callers need `.default` (rollup warns "Mixing named and default exports"). Both bundles import `rand-seed`, so the README's `<script>` usage cannot work. The build targets ES5 with `dom` in `lib` | `package.json`, baseline build, `grep` of dist |
| Code | `src/SeededRandomUtilities.ts` (the class), `src/RandomUtilities.ts` (its interface, without `skipShuffle`), `src/index.ts` (default export plus `Rand`, `PRNG`, `RandomUtilities`). One test file, `tests/SeededRandomUtilities.test.ts` (21 jest tests). `sample/` holds two manual scripts | repo |
| Works today? | Yes on Node 24.18.0, but only through Git Bash. `npm ci --ignore-scripts` installs 599 packages. Lint exits 0 with 1 warning. jest passes 21 of 21 with coverage of 93.83 percent lines and 66.67 percent branches (uncovered: lines 77, 87, 114, 118, 135). The rollup build exits 0 and `node sample/index.js` prints two equal sequences. Under cmd.exe, npm's script shell on Windows, every script fails with "'.' is not recognized", because the scripts call `./node_modules/.bin/…` | baseline 2026-09-25, log |
| Runtime dependency | `rand-seed ^0.1.2`. A fresh install resolves 0.1.5; the lockfile pins 0.1.2; the current release is 3.0.0. 0.1.2 to 1.0.0 give identical numbers, 1.0.1 and later change xoshiro128ss, and 3.0.0 changes sfc32 | the research note |
| Dev dependencies | rollup 1 with seven plugins (two deprecated), jest 24 with ts-jest, eslint 6 with typescript-eslint 2, TypeScript 3.7. `npm ci` prints 34 deprecation warnings | `package.json`, baseline |
| Lockfile | lockfileVersion 1. `npm ci` reports 84 vulnerabilities (11 critical, 30 high, 39 moderate, 4 low) | baseline |
| Dependabot alerts | 72 open, all in the development scope: 9 critical, 41 high, 19 medium, 3 low | `gh api …/dependabot/alerts` |
| GitHub Actions | None. Default workflow permissions are `write`, and workflows may approve pull requests | `gh api …/actions/permissions/workflow` |
| CI leftovers | `.travis.yml` runs Travis CI and a pip-installed codecov uploader, with a CODECOV_TOKEN in plain text since commit 3f407ba (2019-11-24). The token has been public for almost seven years, so it is burned. `.sonarcloud.properties` is empty. Webhook 160643172 goes to codecov.io (active; events push, pull_request, status, delete, public, repository; last response "unused") | `git log -S`, `gh api …/hooks` |
| Pull requests | 12 open Dependabot pull requests (#5 to #16, 2021-03-31 to 2023-01-05) and 2 closed (#3, #4). 2 are merged: #1, the Gitter badge (2019-11-24), and #2, acorn (2020-03-14) | `gh pr list --state all` |
| Branches and tags | `master` plus the 12 `dependabot/npm_and_yarn/*` branches of the open pull requests. No tags, no releases | `git branch -a`, `gh release list` |
| Issues | None, ever | `gh issue list --state all` |
| Forks | gitter-badger/seeded-random-utilities, last pushed 2019-11-24; it carried only the merged #1 | `gh api …/forks` |
| Repo settings | The description is "Common random functions that are seedable with TypeScript support " (with a trailing space). No homepage and no topics; wiki and projects on; delete-branch-on-merge off. Secret scanning and push protection are off; Dependabot security updates are on; private vulnerability reporting is off. No rulesets, no branch protection, no environments, no deploy keys. The community profile scores 42 percent; 2 stars | `gh repo view`, `gh api` |
| README | Ten badges. npm version, downloads and licence work. Travis, the two David badges and Gitter are dead; codecov, jest and SonarCloud are obsolete. Several method descriptions are wrong (B10 below) | `README.md` |
| Local machine | Node 24.18.0, npm 11.16.0. `gh` is logged in as m4bwav with gist, read:org, repo and workflow scopes (repo covers webhooks). npm is not logged in and stays that way. `core.autocrlf` is false, so line endings are committed as written | 2026-09-25 |

## What 1.1.4 gets wrong, confirmed, and what 2.0.0 does

| # | Finding | Evidence | 2.0.0 |
|---|---|---|---|
| B1 | `getRandomIntegar` is misspelled | source | Deprecated alias of `getRandomInteger(min, max)` (D5) |
| B2 | Every range method takes `(max, min)`, the reverse of the MDN functions it came from and of every common library | source | New `(min, max)` names; the old ones stay (D5) |
| B3 | `shuffle` is typed `T[] \| string` for arrays, so a TypeScript caller must cast every result | `dist/SeededRandomUtilities.d.ts` | Overloads: a string gives a string, an array gives `T[]` (D9) |
| B4 | `shuffle` splits strings into UTF-16 code units, so emoji come out as lone surrogates (broken text) | golden case `shuffle('a😀b')` | Shuffle by code point (D9) |
| B5 | `generateRandomArrayOfUniqueIntegers` builds and shuffles `0..maxValue`: O(maxValue) time and memory for any amount (a maxValue of 1e9 exhausts the heap). Its `maxValue` is inclusive while `getRandomIntegar`'s max is exclusive, it returns fewer than `amount` when the range is smaller, and the interface omits `skipShuffle` | source, golden | Kept exactly and deprecated; the bounded `getUniqueRandomIntegers` is new (D6) |
| B6 | `selectUniqueRandomElements` has a dead `remainingItems < 1` branch: the loop bound keeps it at least 1 | source line 134; coverage misses line 135 | Removed; no behaviour change |
| B7 | `selectRandomElement` returns `undefined` for `[]` but is typed `T`. It also draws up to n numbers to pick one element, because it walks the array with selection sampling | the 1.1.4 test "returns undefined…", source | Typed `T \| undefined`; behaviour kept (D1) |
| B8 | A number as seed (JavaScript) gives the `''` sequence, whatever the number | golden quirks | `String(n)` (D7) |
| B9 | An unknown algorithm name, or an explicit `null` algorithm, silently makes the generator unseeded (Math.random) | golden quirks | Unknown name throws TypeError; `null` means the default (D7) |
| B10 | README errors: `random()` is called "a random integer" (it is a float in [0, 1)); `<script src=…seeded-random-utilities.js>` cannot load a bundle that requires rand-seed; `getRandomBool()`'s example is commented "Generate a new random number"; `PRNG` is used without an import. `getRandomArbitrary` is "a random arbitary"; `chooseBooleanRandomlyWithProbability` "Choose a number of boolean randomly with the provide percentage" (it is true with probability picks / itemCount); the `generateRandomArrayOfUniqueIntegers` row is vague; the `\|` in the shuffle row breaks the table | `README.md` | README rewritten |
| B11 | The `random()` test asserts `<= 1`, not `< 1`. `shuffle`, `selectUniqueRandomElements`, `chooseBooleanRandomlyWithProbability` and `getRandomIntegar` have no direct test, and there is no golden-sequence test | the 1.1.4 test file, coverage | Golden and unit tests, c8 thresholds (D15) |
| B12 | The npm scripts call `./node_modules/.bin/…`, which cmd.exe cannot run | baseline | Scripts call the tools by name |
| B13 | Correction to the kickoff survey: `''` is a real seed in 1.1.4 (the hash of the empty string), not "no seed". Only `null` and `undefined` are unseeded | golden quirks | Kept (D7) |
| B14 | CommonJS callers need `require(…).default` | rollup warning | `require()` returns an object with `default` and a named `SeededRandomUtilities` (D12) |

## Target state

| Area | v2 target |
|---|---|
| Source | TypeScript in `src/` (layout in the build section): the class, the inlined generators with their attribution header, the `Rand` and `PRNG` compatibility exports, the interface |
| Build | tsdown emits dist/index.mjs (ESM), dist/index.cjs (CommonJS), dist/index.d.mts, dist/index.d.cts and their source maps |
| package.json | An `exports` map with `import` and `require`, plus `main`, `module` and `types` for old resolvers. `files: ["dist", "CHANGELOG.md"]`, `engines.node` `>=20`, `sideEffects: false`, `type: module`, expanded keywords, and an https author URL |
| Runtime dependencies | None |
| Tests | Golden (1.1.4), unit, package shape (publint, attw, pack list, portability), consumer fixtures (ESM, CJS, four TypeScript resolution setups), Bun and Deno, a bare-engine run, c8 coverage, and post-publish verification from the registry. No live tests: nothing here touches the network |
| Lint and types | xo 5 (flat config), `tsc --noEmit`, publint and attw |
| CI | `ci.yml` runs Node 20, 22, 24 and 26 on `ubuntu-24.04`, Node 24 on Windows and macOS, Bun, Deno and a package job, then a final `ci` job. Also `release.yml`, `verify-published.yml` and `dependabot.yml`. Actions are pinned to commit SHAs and `permissions` default to read |
| Release | `npm version`, then `git push --follow-tags`. `release.yml` stages the publish through trusted publishing and creates the GitHub Release; Mark approves on npmjs.com; `verify-published.yml` runs against the registry |
| Repo hygiene | The Dependabot pull requests are closed and their branches gone, and the codecov webhook is gone. The token is revoked and secret scanning and push protection are on (both Mark's). Private vulnerability reporting is on, the description, topics and homepage are set, and the ruleset protects `master` |
| Docs | README, CHANGELOG, SECURITY.md, LICENSE with rand-seed's MIT notice appended, AGENTS.md with its CLAUDE.md import and Copilot pointer, and `ai-docs/` |

## Decisions (recommendation first; Mark rules in the plan review, silence means the recommendation stands)

| # | Question | Recommendation | Why | Alternative |
|---|---|---|---|---|
| D1 | Determinism | 2.0.0 reproduces 1.1.4 bit for bit: every 1.1.4 method called with arguments 1.1.4 handled returns the same values for every algorithm, including how many numbers each method draws. `test/golden/1.1.4.json` (322 cases from the published 1.1.4) runs with strict equality against both builds on every Node line, Bun, Deno and the registry. The first line of the 2.0.0 changelog says so, and names D9's one exception | Same seed, same sequence is the product: anyone who stored a seed (save games, generated worlds, test fixtures) keeps their data. The research found no correctness bug in sfc32 (the default) or mulberry32 | Adopt rand-seed 3.0.0's numbers; every stored seed changes |
| D2 | xoshiro128ss | `PRNG.xoshiro128ss` stays xoshiro128** version 1.0 exactly, as in 1.1.4. xoshiro128** 1.1, the authors' reference, is added as `PRNG.xoshiro128ssReference`. sfc32 stays the default, and the README recommends it for new code | The authors call 1.0's scrambling of `s[0]` a mistake, so the correct algorithm belongs under a new name (the kickoff's rule). The reference also lets a caller match other implementations given the same four state words (with D10's state import). sfc32 needs no new name: 1.1.4's is PractRand's with the counter one higher, the same generator | Name it `xoshiro128ss11` or `xoshiro128StarStar`; or add nothing and document the 1.0 flaw |
| D2b | mulberry32 (added in Stage 1, under D2's rule) | `PRNG.mulberry32` keeps 1.1.4's counter, a JavaScript number that is never wrapped, exactly. `PRNG.mulberry32Reference` adds Tommy Ettinger's algorithm with a wrapping 32-bit counter | Found on 2026-09-25: the unwrapped counter passes 2^53 after 4,917,757 to 4,917,759 draws (checked for three seed words). From there its low bits round away and the stream departs from mulberry32, losing quality as it goes. rand-seed 3.0.0 has the same flaw | Document the flaw and add nothing |
| D3 | Runtime dependencies | None. xfnv1a, sfc32, mulberry32 and both xoshiro128** versions are inlined, about 60 lines. rand-seed's MIT notice goes in the file header and is appended to LICENSE; the README credits bryc's public-domain ports and the algorithms' authors | rand-seed can never be upgraded without breaking D1 (1.0.1 and later change xoshiro, 3.0.0 changes sfc32). Inlined, the numbers are ours to guarantee, with zero supply chain | Pin `rand-seed@0.1.5` exactly; it stays in every consumer's tree for good |
| D4 | Compatibility exports | Keep `PRNG`, as a const object plus a union type: `PRNG.sfc32` works as before, and plain `'sfc32'` now type-checks. Export our own `Rand` with rand-seed 0.1's API (`new Rand(seed?, prng)`, `next()`). The constructor accepts any object with `next(): number` (rand-seed's `Rand` of any version included) instead of testing `instanceof` | Existing `import {Rand, PRNG}` code compiles and gives the same numbers. The TypeScript enum cannot stay, because the tsconfig bases turn on `erasableSyntaxOnly`. Duck typing lets callers plug in any generator | Drop `Rand` and document the break |
| D5 | Misspelled and `(max, min)` names | `getRandomIntegar`, `getRandomArbitrary` and `getRandomIntInclusive` become deprecated aliases (JSDoc's deprecated tag) for one major of `getRandomInteger`, `getRandomFloat` and `getRandomIntegerInclusive`. The new names take `(max)` or `(min, max)`, give the same numbers as the old ones for the same state, and throw RangeError for an empty or reversed range | A caller who corrects only the spelling and keeps `(max, min)` gets an error, never silently swapped bounds. The same numbers make the move free for stored seeds | Short modern names (`int`, `float`, `bool`, `pick`) |
| D6 | `generateRandomArrayOfUniqueIntegers` (the kickoff asked for it to be bounded by the amount) | Keep its 1.1.4 output exactly, marked deprecated. Add `getUniqueRandomIntegers(amount, max)` or `(amount, min, max)`: O(amount) time and memory (a sparse Fisher–Yates), an exclusive max like `getRandomInteger`, random order, and a RangeError when the amount exceeds the range | **This conflicts with D1 and needs Mark's ruling.** 1.1.4's output depends on drawing maxValue + 1 numbers for a full shuffle, and sfc32 cannot jump ahead, so no algorithm bounded by the amount can reproduce it | Make the old method bounded in place, as the kickoff asked. Its sequences then change, and the changelog's first line names it as the second exception |
| D7 | Seeds and algorithm names | A string is a seed as before, `''` included (it is one in 1.1.4). A number is hashed as `String(n)`, so `42` and `'42'` agree. `undefined` and `null` mean unseeded (Math.random), as before. Anything else (arrays, objects, NaN, Infinity) throws TypeError. An unknown algorithm name throws TypeError, and an explicit `null` algorithm means the default | In 1.1.4 every number gave the `''` sequence, and a typo in the algorithm name silently disabled seeding. Both are listed in the changelog as fixes for inputs 1.1.4 mishandled | Numbers used as raw state words |
| D8 | Bad arguments | New methods throw TypeError (wrong type) or RangeError (empty range, negative or non-integer count, probability outside [0, 1], a range wider than 2^32). Plain `Error` subclasses, no error class. Deprecated names keep 1.1.4's behaviour for every input, including reversed bounds. Existing methods keep their 1.1.4 messages ("Parameter source is not set", "… cannot be negative") | The playbook's rule for a utility library. Keeping the deprecated names exact honours D1 for callers who relied on odd inputs. One 32-bit draw can only give 2^32 distinct values, so a wider integer range would silently skip values | A `SeededRandomError` with codes (nothing here needs selective catching) |
| D9 | Strings in `shuffle` | Shuffle strings by code point (`Array.from`). Types become overloads: a string gives a string, an array gives `T[]` | Identical to 1.1.4 for every string without characters outside the Basic Multilingual Plane. For the rest, 1.1.4 returned broken UTF-16, so nobody can rely on it. This is the one exception to D1, and the changelog's first line names it | Keep code units, exactly as 1.1.4 (broken text for emoji) |
| D10 | Additions | Keep: numeric seeds (D7), state export and import, `getRandomBool(probability)`, `getRandomFloat` (D5), weighted choice, `getRandomString` with pools. Replace the Math.random-style factory with a bound `random`. Drop: array seeds, child generators, the Gaussian, the iterator. The list with a reason for each is under the API section | Each kept item is a common need that is easy to get wrong by hand. Each dropped item is covered in one line by what exists, or (the Gaussian) would break D1 across engines | Mark trims or restores any row |
| D11 | Unseeded mode | Unchanged: no seed means Math.random. `getState()` on an unseeded instance throws | 1.1.4's documented behaviour | Pick a random seed with `crypto.getRandomValues`, so unseeded runs can report their seed (not requested) |
| D12 | Module format | Dual ESM and CommonJS from one source. `require()` returns an object whose `default` and `SeededRandomUtilities` are the same class, plus `Rand` and `PRNG` | 1.1.4's `require(…).default` keeps working, and CommonJS on any Node line needs no `require(esm)`. attw and publint guard the shape | ESM only, with `engines` `^20.19.0 \|\| >=22.12.0` |
| D13 | Node floor | `engines.node` `>=20`; CI matrix 20, 22, 24, 26 | Playbook default. Nothing here needs newer. Node 20 is past end of life (2026-04-30) but costs nothing | `>=22` |
| D14 | Language and build | TypeScript 6.0 (xo 5 declares `^6.0.3`; 7.0.2 waits), tsdown 0.23.0 pinned exactly, `platform: 'neutral'`, source maps, `lib` without `dom` | Playbook default, as built and verified for get-title-at-url. The library needs no DOM | Two `tsc` passes if tsdown breaks twice |
| D15 | Tests | `node --test` against `dist/`, both builds, every layer in the test strategy below. c8 thresholds of 95 percent lines and 90 percent branches (the playbook default; aim for 100). No coverage service. `npm test` never touches the network | Playbook default. The golden layer is the contract | jest 30 |
| D16 | Lint | xo 5 (`xo.config.js`, every override with its reason) | Playbook default | Biome |
| D17 | Lockfile and the 12 Dependabot pull requests | Regenerate `package-lock.json` as lockfileVersion 3. After the merge, confirm the alerts are 0, then close each pull request with one comment that names the merge commit and says which removed tool brought its package in | Merging them changes only a lockfile consumers never install. The regenerated lockfile removes every one of the 72 alerts | Merge them one by one first (pointless churn) |
| D18 | Dead services | Remove Travis (`.travis.yml`, badge), codecov (webhook, badge; Mark revokes the token), SonarCloud (`.sonarcloud.properties`, badge), David and Gitter (badges) and the jest badge. The README keeps three live badges: npm version, CI, downloads | Playbook default | None |
| D19 | Old files | Remove `sample/`: its script requires a bundle path that no longer exists, and the README examples and consumer fixtures replace it. Also remove `.npmignore` (`files` decides what ships) and the rollup, jest and eslint configs | Less to maintain; nothing in them is referenced after the rewrite | Port `sample/` to the new build |
| D20 | Release and version | 2.0.0, rehearsed as 2.0.0-beta.1 under the `next` tag. `release.yml` stages the publish through trusted publishing; Mark approves each version with 2FA. The deprecated names go in 3.0.0 | The package shape, the Node floor, `PRNG`'s type, the `selectRandomElement` type and the fixed inputs all break something; a minor would not be honest | 1.2.0 |
| D21 | Default branch and optional extras | Keep `master`. JSR and a tool page on markdavidrogers.com stay out of this run (optional Stage 5, Mark's call) | JSR has no approval step, and Deno users install from npm. A seeded-random playground page would be cheap after 2.0.0 if Mark wants one | Rename to `main` |

## Proposed public API (v2)

The deprecated members carry JSDoc's deprecated tag in the source, so editors strike them through. The sketch writes it as DEPRECATED, because the doc lint reads the tag's at sign as a social handle.

```ts
/** The generator algorithms. The values are plain strings, so 'sfc32' works wherever PRNG.sfc32 does. */
export const PRNG: {
  /** sfc32 (Chris Doty-Humphrey, PractRand). The default. As in 1.1.4. */
  readonly sfc32: 'sfc32';
  /** mulberry32 (Tommy Ettinger). 32-bit state, period 2^32. As in 1.1.4. */
  readonly mulberry32: 'mulberry32';
  /** xoshiro128** version 1.0, as in 1.1.4: scrambles s[0], which the authors corrected in 1.1. Kept so stored seeds reproduce. */
  readonly xoshiro128ss: 'xoshiro128ss';
  /** xoshiro128** 1.1, the authors' reference algorithm. New in 2.0.0 (D2). */
  readonly xoshiro128ssReference: 'xoshiro128ssReference';
};
export type PRNG = (typeof PRNG)[keyof typeof PRNG];

/** A seed: a string, or a number hashed as String(n) (D7). */
export type Seed = string | number;

/** Anything whose next() returns numbers in [0, 1): Rand, rand-seed's Rand of any version, or your own. */
export interface RandomSource { next(): number }

/** Where a generator is in its sequence. Plain data: safe to JSON.stringify and store. */
export interface GeneratorState { readonly algorithm: PRNG; readonly state: readonly number[] }

/** rand-seed 0.1's class: the same constructor and the same numbers, without the dependency (D4). */
export class Rand implements RandomSource {
  constructor(seed?: Seed | null, prng?: PRNG);
  next(): number;
}

/** Every public method of SeededRandomUtilities, including skipShuffle and the 2.0.0 additions. */
export interface RandomUtilities { /* … */ }

export class SeededRandomUtilities implements RandomUtilities {
  /** No seed (undefined or null): Math.random, as in 1.1.4. */
  constructor(seed?: Seed | RandomSource | null, prng?: PRNG);
  /** A generator that continues exactly where getState() was called. */
  static fromState(state: GeneratorState): SeededRandomUtilities;
  getState(): GeneratorState;

  /** A float in [0, 1). Bound to its instance: pass `rng.random` wherever a Math.random-style function is accepted. */
  random(): number;
  getRandom(): number;
  /** An integer in [min, max); one argument means [0, max). The same numbers as getRandomIntegar(max, min). */
  getRandomInteger(max: number): number;
  getRandomInteger(min: number, max: number): number;
  /** An integer in [min, max]. The same numbers as getRandomIntInclusive(max, min). */
  getRandomIntegerInclusive(max: number): number;
  getRandomIntegerInclusive(min: number, max: number): number;
  /** A float in [min, max). The same numbers as getRandomArbitrary(max, min). */
  getRandomFloat(max: number): number;
  getRandomFloat(min: number, max: number): number;
  /** true with the given probability (default 0.5). Computed as random() >= 1 - p, so the no-argument call is 1.1.4's. */
  getRandomBool(probability?: number): boolean;
  /** One character (code point) from pool; the default is 1.1.4's 81 characters. */
  getRandomChar(pool?: string): string;
  /** length characters, each drawn as getRandomChar(pool) would. */
  getRandomString(length: number, pool?: string): string;
  selectRandomElement<T>(source: readonly T[]): T | undefined;
  /** picks distinct elements, in their original order. */
  selectUniqueRandomElements<T>(source: readonly T[], picks: number): T[];
  /** One element, chosen with probability weight / sum of weights; one draw. */
  selectWeightedRandomElement<T>(source: readonly T[], weights: readonly number[]): T;
  /** amount distinct integers from [min, max), in random order; O(amount) time and memory (D6). */
  getUniqueRandomIntegers(amount: number, max: number): number[];
  getUniqueRandomIntegers(amount: number, min: number, max: number): number[];
  shuffle(text: string, copy?: boolean): string;
  shuffle<T>(array: readonly T[]): T[];
  shuffle<T>(array: T[], copy: boolean): T[];
  /** true with probability picks / itemCount. */
  chooseBooleanRandomlyWithProbability(itemCount: number, picks?: number): boolean;

  /** DEPRECATED: use getRandomInteger(min, max): the same numbers, with the arguments in (min, max) order. Removed in 3.0.0. */
  getRandomIntegar(max: number, min?: number): number;
  /** DEPRECATED: use getRandomFloat(min, max). Removed in 3.0.0. */
  getRandomArbitrary(max: number, min?: number): number;
  /** DEPRECATED: use getRandomIntegerInclusive(min, max). Removed in 3.0.0. */
  getRandomIntInclusive(max: number, min?: number): number;
  /** DEPRECATED: O(maxValue) time and memory. Use getUniqueRandomIntegers(amount, 0, maxValue + 1): O(amount), but a different sequence. Removed in 3.0.0. */
  generateRandomArrayOfUniqueIntegers(amount: number, maxValue: number, skipShuffle?: boolean): number[];
}
export default SeededRandomUtilities;
```

### Every 1.1.4 name in 2.0.0

| 1.1.4 | 2.0.0 | Numbers for the same seed |
|---|---|---|
| `new SeededRandomUtilities(seed?: string \| Rand, prng?)` | The seed may also be a number or any `{next()}` object; `PRNG` gains `xoshiro128ssReference` | Same for strings and `Rand`; numbers change (D7) |
| `random()`, `getRandom()` | Unchanged; `random` is bound to its instance | Same |
| `getRandomIntegar(max, min = 0)` | Deprecated alias of `getRandomInteger(min, max)` | Same |
| `getRandomArbitrary(max, min = 0)` | Deprecated alias of `getRandomFloat(min, max)` | Same |
| `getRandomIntInclusive(max, min = 0)` | Deprecated alias of `getRandomIntegerInclusive(min, max)` | Same |
| `getRandomBool()` | `getRandomBool(probability = 0.5)` | Same |
| `getRandomChar()` | `getRandomChar(pool?)` | Same with the default pool |
| `selectRandomElement(source)` | Unchanged; typed `T \| undefined` | Same |
| `selectUniqueRandomElements(source, picks)` | Unchanged; accepts readonly arrays | Same |
| `shuffle(array, copy = true)` | Unchanged for arrays; typed overloads | Same, except strings with characters outside the BMP (D9) |
| `chooseBooleanRandomlyWithProbability(itemCount, picks = 1)` | Unchanged; documented correctly | Same |
| `generateRandomArrayOfUniqueIntegers(amount, maxValue, skipShuffle?)` | Deprecated, unchanged; successor `getUniqueRandomIntegers` | Same (D6) |
| exports `default`, `Rand`, `PRNG`, `RandomUtilities` | The same names, plus `SeededRandomUtilities`, `GeneratorState`, `RandomSource`, `Seed` | Same |

### Additions: the kickoff's list, for Mark to trim

| Proposed | Recommendation | Why |
|---|---|---|
| Numeric seeds | Keep (D7) | `new SeededRandomUtilities(42)` is what people write, and in 1.1.4 it silently gave the same sequence for every number |
| Array seeds | Drop | A template string (`${world}:${x}:${y}`) combines values with no new hashing rules to document |
| State export and import | Keep: `getState()` and `SeededRandomUtilities.fromState()` | Resume exactly mid-sequence after a save or a crash (save games, long simulations, replays); the state is plain JSON |
| Child generators for independent streams | Drop | A second instance seeded with a derived string (`seed + ':loot'`) already gives an independent stream; the README shows the pattern |
| `getRandomBool(probability)` | Keep | The helper people most often hand-roll. `random() >= 1 - p` keeps the no-argument call identical to 1.1.4 |
| Random float in a range | Keep, as `getRandomFloat(min, max)` | The `(min, max)` rename of `getRandomArbitrary` (D5), not new code |
| Weighted choice | Keep: `selectWeightedRandomElement(items, weights)` | Loot tables and weighted choices; one draw per pick; easy to get subtly wrong by hand (zero weights, float rounding at the end) |
| A Gaussian | Drop | ECMAScript leaves `Math.log`, `Math.sin` and `Math.cos` implementation-approximated, so a Box–Muller value can differ in the last bit between V8 (Node, Deno, Chrome) and JavaScriptCore (Bun, Safari). It would be the one method that breaks D1's "same numbers everywhere". If Mark wants it anyway: Box–Muller, two draws per value, with that caveat in the README |
| Random string from a pool | Keep: `getRandomString(length, pool?)`, and `getRandomChar(pool?)` | Ids, codes and test fixtures. Each character is drawn as `getRandomChar` draws it, so the default pool matches 1.1.4 character for character |
| A Math.random-compatible function factory | Replace with a bound `random` | The failure people actually hit is passing `rng.random` to a library and losing `this`. Binding `random` in the constructor fixes that with no new name; `Array.from({length: 10}, rng.random)` works. The alternative is an `asFunction()` factory, which lint rules such as typescript-eslint's unbound-method understand better |
| An iterator | Drop | `Array.from({length: n}, rng.random)` covers it, and the iterator helpers that would make it pleasant (`take`, `toArray`) need Node 22 |

## Build and package specifics (what Stage 1 implements)

The templates are get-title-at-url's files, copied and edited, not rewritten from memory: `tsconfig.json`, `tsdown.config.ts`, `xo.config.js`, `.editorconfig`, `.gitattributes`, `.gitignore`, `SECURITY.md`, test/helpers/builds.js, test/package/shape.test.js, test/consumers/. Their traps are in get-title-at-url's ai-docs/notes/2026-09-25-v3-build-and-test-traps-tsdown-0-23-xo-5-npm-11-node-test.md. The tool versions were re-checked with `npm view` on 2026-09-25: tsdown 0.23.0, TypeScript 7.0.2 latest (stay on `~6.0.3`, which xo 5.0.1 requires), c8 12.0.0, publint 0.3.24, attw 0.18.5, the two tsconfig bases 20.1.10 and 23.6.4.

### Output files and package.json

tsdown with `fixedExtension: true` and `exports: true` writes dist/index.mjs, dist/index.cjs, dist/index.d.mts, dist/index.d.cts and their maps, and rewrites `main`, `module`, `types` and `exports` on every build. The hand-written rest follows get-title-at-url's package.json:

```json
{
  "name": "seeded-random-utilities",
  "version": "1.1.4",
  "description": "Seeded random numbers, integers, booleans, strings, picks and shuffles: the same seed gives the same sequence everywhere. Zero dependencies, TypeScript, ESM and CommonJS, Node 20+.",
  "license": "MIT",
  "author": "Mark Rogers (https://www.markdavidrogers.com)",
  "type": "module",
  "exports": {".": {"import": "./dist/index.mjs", "require": "./dist/index.cjs"}, "./package.json": "./package.json"},
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.cts",
  "files": ["dist", "CHANGELOG.md"],
  "sideEffects": false,
  "engines": {"node": ">=20"},
  "keywords": ["random", "seed", "seeded", "prng", "rng", "deterministic", "reproducible", "shuffle", "sfc32", "mulberry32", "xoshiro128", "typescript", "esm", "cjs"]
}
```

The version stays 1.1.4 until the release step. The scripts follow get-title-at-url's: `build`, `test` (build, then `test:dist`), `test:dist`, `test:consumers`, `coverage`, `lint`, `typecheck`, `check`, `prepack`, `prepublishOnly`. They call tools by name, never through `./node_modules/.bin/` (B12). The devDependencies are get-title-at-url's: tsdown, typescript, xo, c8, publint, the attw CLI, the two tsconfig bases and the Node types (for the config file and the tests).

### Source layout

- src/generators.ts: xfnv1a, sfc32, mulberry32, xoshiro128** 1.0 and 1.1, each with a `next()` and a state getter and setter. No imports. The header carries rand-seed's MIT notice and credits bryc's public-domain ports and the algorithms' authors. Each generator is a copy of rand-seed 0.1.5's, checked against the golden streams, not a rewrite.
- src/rand.ts: `PRNG` (const object, union type, and a type-only namespace if TypeScript allows it under `erasableSyntaxOnly`, so `PRNG.sfc32` also works in type position) and `Rand`.
- src/random-utilities.ts: the interface.
- src/seeded-random-utilities.ts: the class. Every 1.1.4 method body is carried over expression by expression, because the golden layer is the judge. New methods sit next to them, with argument checks.
- src/index.ts: the exports (default and named).
- Portability rule, enforced by the shape test: nothing in `src/` references `process`, `Buffer`, `require`, `__dirname`, `globalThis.crypto`, a `node:` module or a DOM type. `Math.random` appears once, in the unseeded path.

### tsdown.config.ts

get-title-at-url's library entry, without the CLI entry and without the version `define`. The format is ESM and CommonJS; `platform: 'neutral'`; `dts: {sourcemap: false}`; `fixedExtension`, `exports` and `sourcemap` are on; `outputOptions: {exports: 'named', comments: {jsdoc: false}}`. The `build:done` hook removes the dangling declaration-map comment if tsdown 0.23.0 still writes one. Stage 1 checks that the licence header survives the build (it has to be a `/*!` legal comment). LICENSE carries the notice either way.

## Stages

### Stage 0: survey, baseline, docs (2026-09-25, no package code changed)

- [x] Cloned to `D:\m4bwa\Claude\Projects\Ai\seeded-random-utilities` and ran the playbook's survey. The table above holds the results; the log holds the evidence.
- [x] Ran the old build and tests as they are: through Git Bash, lint, test and build pass; under cmd.exe they fail.
- [x] Captured golden outputs from the published 1.1.4 in a scratch project before any code change. Committed `test/golden/1.1.4.json` and the capture script `test/golden/capture-1.1.4.cjs`; neither is part of the 1.1.4 build or its jest run.
- [x] Researched rand-seed's history and checked a zero-dependency port against the fixtures (the research note).
- [x] Registered everlast (mode repo, sync push). Wrote AGENTS.md, CLAUDE.md (its first line imports AGENTS.md), `.github/copilot-instructions.md`, this plan and the decision record.
- [x] Mark: rule on the decisions table. D2's name, D6's conflict with the kickoff's wording, D9 and D10's list are the ones most worth a look. Silence means the recommendations stand. (2026-09-25: every recommendation accepted: "D6 do as you recommend, we want to move forward with the best lib. D2 do it. D9 sure. D10 do what you wish.")
- [x] Mark: answer three questions. (2026-09-25: yes to all three; the agent turns on secret scanning and push protection itself. Mark also said "do it all", so Stage 1 runs straight into Stage 2, and the next stop is the trusted publisher.)
  1. **Deleting on GitHub in Stage 2.** May the agent delete the codecov webhook (id 160643172) and the 12 Dependabot branches (`gh pr close --delete-branch`), and let `v2` be deleted at the squash-merge?
  2. **Repo settings in Stage 2.** May the agent apply them through `gh`: description, homepage, topics, wiki and projects off, delete-branch-on-merge on, private vulnerability reporting on, and workflow permissions read-only?
  3. **Secret scanning and push protection.** The kickoff makes these Mark's own task; should the agent turn them on with one `gh api` call instead, as it did for get-title-at-url?
- [ ] Mark, any time (it blocks nothing): revoke the codecov token at codecov.io (the repository's settings; regenerate the upload token, or deactivate the repository, since D18 drops codecov). Also look at github.com/settings/installations and github.com/settings/applications for Codecov, SonarCloud (SonarQube Cloud) and Travis CI, and remove the ones no repository needs.

### Stage 1: rewrite on branch `v2`

- [x] Branch `v2` from `master`. Remove `.travis.yml`, `.sonarcloud.properties`, `.eslintrc.json`, `.eslintignore`, `.npmignore`, `jest.config.js`, `rollup.config.js`, the three tsconfig files, `tests/`, `sample/`, and `package-lock.json` (regenerated).
- [x] Add `package.json`, `tsconfig.json`, `tsdown.config.ts`, `xo.config.js`, `.editorconfig`, `.gitattributes` (`* text=auto eol=lf`) and `.gitignore`, copied from get-title-at-url and adapted. Deny any dev-only install script in `allowScripts`, as there.
- [x] Write `src/` per the source layout, then the golden test first. The first build must pass all 322 cases before any new method is written.
- [x] If D2 stands: capture rand-seed 3.0.0's xoshiro128ss streams as the oracle for `xoshiro128ssReference` (a capture-rand-seed-3.0.0.cjs next to the 1.1.4 one), plus raw-state cases from the C reference's algorithm.
- [x] Write the rest of `test/`, per the test strategy.
- [x] Rewrite the README. It keeps three badges and covers install, usage for ESM, CommonJS, TypeScript, Deno, Bun and browsers, the algorithms table with credits, the determinism promise and its exceptions, the API reference, migration from 1.x, limits (the 2^32 range, the bias bound, O(n) walks) and what the package is not (cryptographic).
- [x] Write the CHANGELOG (Keep a Changelog). The first line of 2.0.0 states the determinism decision, followed by a compressed history of 1.0.0 to 1.1.4.
- [x] Add SECURITY.md (from get-title-at-url, with 2.x as the supported line) and append rand-seed's notice to LICENSE.
- [x] Update AGENTS.md for v2: commands, layout, traps.
- [x] Verify on Node 24: lint, typecheck, build, test, check, coverage and the consumer fixtures. Run the suites on Node 20, 22 and 26 (portable builds in the scratchpad, as get-title-at-url did), then from a fresh clone. Record everything in the log.
- [ ] Run the simplify, code-review and security-review skills on the branch diff; fix or answer what they find.
- [ ] Push `v2` and open the pull request, with a "For review" list covering departures from this plan and anything Mark has not ruled on. **Stop** for Mark's review.

### Stage 1 notes (2026-09-25): where the build departs from the plan

Evidence is in the log.

- D2b added: `PRNG.mulberry32Reference`, because 1.1.4's mulberry32 counter is never wrapped and passes 2^53 after about 4.9 million draws.
- The generators are checked against BigInt versions written from the authors' C code, as well as against rand-seed 3.0.0's streams (`test/golden/rand-seed-3.0.0.json`); the plan named only the rand-seed oracle.
- `null` is not in the public types (xo bans it, and 1.1.4's types never accepted it); the runtime still treats null as no seed and as the default algorithm.
- Tarball 40.5 kB with 10 files, most of it the two source maps; the shape test's budget is 45 kB.
- ci.yml adds `npm audit signatures` (493 packages verified) and `npm audit --omit=dev`, which get-title-at-url's did not have. verify-published imports the package instead of running a CLI.
- The capture scripts and golden JSON files are excluded from lint and kept exactly as run; `1.1.4.json` contains lone surrogates, which are 1.1.4's broken string shuffles.

### Stage 2: CI and repository settings (same branch)

- [x] Add .github/workflows/ci.yml, `release.yml`, `verify-published.yml` and .github/dependabot.yml, copied from get-title-at-url and adapted. There is no CLI, fixture server or `live.yml`. The consumer fixtures also run the golden check, so Bun, Deno and verify-published prove D1 too. Re-check the pinned action SHAs; actionlint must be clean. (2026-09-25: adapted, actionlint clean; see the log.)
- [x] Add the AGENTS.md lines on CI and releases. (2026-09-25: the release ritual, Dependabot, CI on Node 24 and the trusted publisher trap.)
- [ ] Get CI green on the pull request and record the run id.
- [ ] Create the ruleset on `master`, as get-title-at-url's 24003504: deletion and non-fast-forward blocked, required check `ci`, admin bypass.
- [ ] Squash-merge after Mark's review of the pull request.
- [ ] Confirm the Dependabot alerts are 0. Then close #5 to #16, one comment each, naming the merge commit and the removed tool that brought the package in (the table below).
- [ ] Delete the codecov webhook (Stage 0 question 1). Apply the repo settings (question 2).
- [ ] Mark: revoke the codecov token if not done, remove any Codecov app, and turn on secret scanning and push protection (or the agent does it, question 3). After that, close any secret-scanning alert for the token as revoked.

### Stage 3: release 2.0.0

- [ ] Mark, once, in the browser, following get-title-at-url's trusted-publishing solution (ai-docs/solutions/2026-09-25-publish-to-npm-from-github-actions-without-a-stored-token-th.md there): on npmjs.com, open seeded-random-utilities, then Settings, then Trusted publishing, and add a GitHub Actions publisher. The fields are: user `m4bwav`, repository `seeded-random-utilities`, workflow `release.yml`, environment blank, "Allow npm publish" unticked. Check that the package's publishing access requires 2FA.
- [ ] Agent, only after Mark confirms: run `npm version 2.0.0-beta.1` on `master`, then `git push --follow-tags`. `release.yml` stages the version under `next`. **Stop** while Mark approves. Then verify: `npm view seeded-random-utilities dist-tags` (`latest` still 1.1.4), `verify-published.yml` with `2.0.0-beta.1`, and `npm audit signatures` in a temporary project.
- [ ] Agent: date the changelog, run `npm version 2.0.0`, push, and watch the run. **Stop** while Mark approves. Then verify from the registry: `verify-published.yml` with `2.0.0`, the GitHub Release `v2.0.0` and provenance.

### Stage 4: wrap-up and standing work

- [ ] Rewrite HANDOFF.md around the standing work.
- [ ] Add this package's row to package-modernization/inventory.md.
- [ ] Update the playbook with what differed from get-title-at-url. Collected so far (add to this list as the run goes):
  - **Stage 0 order.** Golden fixtures, AGENTS.md, CLAUDE.md and the Copilot pointer were committed to `master` in Stage 0 (the kickoff asked for fixtures before any code change). get-title-at-url put the three instruction files on its branch in Stage 1.
  - **Survey facts can be wrong.** The kickoff said `''` is no seed; the golden capture's quirks section proved otherwise. The playbook's survey should say: record the odd inputs (empty string, numbers, null, unknown options) in the capture and check every survey claim against it.
  - **Caret ranges.** A caret range in the old package (`^0.1.2`) installs a newer version on a fresh install (0.1.5) than the old lockfile pins. Capture golden outputs from a fresh `npm install` of the published version, and check every version the range covers for behaviour changes.
  - **Kickoff wishes can conflict.** "Bounded by the amount" and "bit for bit" cannot both hold for `generateRandomArrayOfUniqueIntegers` (D6). A prompt should test each requested fix against the determinism promise before asking for both.
  - **Windows trap for old scripts.** 2019-era npm scripts that call `./node_modules/.bin/…` fail under cmd.exe; run the baseline with `--script-shell` pointing at Git Bash.
  - **Everlast lint traps.**
    - The privacy scan reads any at-sign word as a social handle: JSDoc's deprecated tag, CLAUDE.md's import line, npm scopes. It refuses a HANDOFF that contains one.
    - Decisions need a `## Reasons` heading.
    - Paths to files that do not exist yet must be written without backticks.
  - **Working directory.** A `cd` inside a Bash call moves the session's primary working directory for every later call; use absolute paths and `git -C`.
- [ ] Tell Mark whether the playbook is ready to become the `npm-modernize` evergreen skill (not built in this run).
- [ ] Standing work: merge Dependabot pull requests when CI is green. 3.0.0 removes the deprecated names; plan it together with the Node floor moving to 24 after Node 22 reaches end of life (2027-04-30).

## Test strategy: every artifact, every runtime, and the sequences themselves

| Layer | What it proves | How | Runs where |
|---|---|---|---|
| 1. Golden | D1 | test/golden/golden.test.js runs all 322 cases of `1.1.4.json` against both builds with strict equality (deep for arrays), decoding `$undefined` and `$throws`. It also checks the renames: `getRandomInteger(min, max)` against the `getRandomIntegar(max, min)` cases, and the same for the other two. D9's documented difference is asserted as its own case | Every CI job, both builds |
| 2. Unit | Every method's contract | Ranges and ends (min included, max excluded, the inclusive variants); argument errors (types, messages); `getRandomBool` at 0, 0.5 and 1; weighted choice with zero weights and float sums; `getRandomString` pools by code point; `getUniqueRandomIntegers` with `max` 2^32 and amount 5 (fast, no big allocation); state round trips through `JSON.stringify` (the next 1,000 values match); `Rand` against the class; a duck-typed source; `rng.random` passed as a callback; `xoshiro128ssReference` against its oracle; seeds (numbers, `''`, null, unknown algorithm) | Every CI job, both builds |
| 3. Distribution sanity | Nothing is badly skewed | Fixed seeds with 100,000 draws: integer buckets, `getRandomBool(0.3)`, weighted frequencies and unique-integer positions within fixed tolerances. The seeds are fixed, so the checks are deterministic and never flaky | Every CI job |
| 4. Package shape | The published layout | publint; `attw --pack .` in all four modes; `npm pack --json` listing exactly dist/index.mjs, dist/index.cjs, dist/index.d.mts, dist/index.d.cts, their maps, `package.json`, `README.md`, `LICENSE` and `CHANGELOG.md`, under a size budget set from the first build; the portability grep; a bare-engine run that evaluates dist/index.cjs in `node:vm` with only `module` and `exports` defined and draws from it | Node 24 job |
| 5. Consumer fixtures | Each artifact from a consumer's side | The packed tarball is installed into temporary copies of `test/consumers/*`. `esm-node` covers default and named imports and the golden check. `cjs-node` checks that `require().default` and `.SeededRandomUtilities` are the same class and runs 1.1.4-style code unchanged. `ts-nodenext-esm`, `ts-nodenext-cjs`, `ts-bundler` and `ts-node10` type-check assertions: the overloads, `T \| undefined`, `PRNG` accepting strings, the deprecated names still compiling | Every Node job |
| 6. Other runtimes | Bun and Deno, JavaScriptCore included | `CONSUMER_RUNTIMES=bun,deno` runs the esm-node fixture, golden check included, under Bun and Deno, plus cjs-node under Bun | Bun and Deno jobs |
| 7. Coverage | Nothing important untested | c8 over layers 1 to 3, mapped back to `src/` (`--exclude-after-remap`), thresholds 95 percent lines and 90 percent branches, lcov as a CI artifact | Node 24 job |
| 8. Post-publish | The registry artifact | `verify-published.yml` with a version input: `CONSUMER_PACKAGE=seeded-random-utilities@<version>` runs layers 5 and 6 against npm on Ubuntu, Windows and macOS with Node 20, 22, 24 and 26, plus Bun and Deno (`--minimum-dependency-age=0` for Deno within 24 hours of a publish). `npm audit signatures` checks the provenance | After Mark approves each version |

| Artifact | Node 20, 22, 24, 26 (Ubuntu) | Node 24 (Windows, macOS) | Bun | Deno | Bare engine |
|---|---|---|---|---|---|
| dist/index.mjs | layers 1, 2, 3, 5 | layers 1, 2, 5 | layer 6 | layer 6 | layer 4 grep |
| dist/index.cjs | layers 1, 2, 3, 5 | layers 1, 2, 5 | layer 6 | not applicable | layer 4 vm run |
| dist/index.d.mts and .d.cts | layer 5, layer 4 attw | layer 5 | no | no | no |
| Tarball | layer 4 | no | no | no | no |
| Registry package | layer 8 | layer 8 | layer 8 | layer 8 | no |

Tests import `dist/`, never `src/`, and each suite runs against both builds through a loop over the two module paths (test/helpers/builds.js). The npm scripts name every test file, because plain `node --test` would also pick up the helpers, the fixtures and the capture script.

## Pull requests, issues and forks: disposition

All 12 open pull requests are Dependabot bumps of the lockfile, each for a package that only an old dev tool brings in. The 2.0.0 lockfile has none of those tools, so each closes after the merge with a comment naming the merge commit (D17).

| Pull request | Bump | Brought in by | Open alerts on that package (2026-09-25) |
|---|---|---|---|
| #5 | y18n 4.0.0 to 4.0.1 | jest 24 | high GHSA-c4w7-xm78-47vh |
| #6 | handlebars 4.5.2 to 4.7.7 | jest 24 (istanbul reports) | 11: 3 critical, 6 high, 1 medium, 1 low |
| #7 | lodash 4.17.15 to 4.17.21 | jest 24 | 5: 3 high, 2 medium |
| #8 | hosted-git-info 2.8.5 to 2.8.9 | jest 24 | none open |
| #9 | glob-parent 5.1.0 to 5.1.2 | eslint 6 | none open |
| #10 | path-parse 1.0.6 to 1.0.7 | jest 24 | none open |
| #11 | tmpl 1.0.4 to 1.0.5 | jest 24 | none open |
| #12 | ajv 6.10.2 to 6.12.6 | eslint 6 | medium GHSA-v88g-cgmw-v5xw |
| #13 | terser 4.4.0 to 4.8.1 | rollup-plugin-terser 5 | none open |
| #14 | decode-uri-component 0.2.0 to 0.2.2 | rollup-plugin-sourcemaps, jest 24 | high GHSA-w573-4hg7-7wgq, medium GHSA-vcc3-ghjq-m6fr |
| #15 | qs 6.5.2 to 6.5.3 | jest 24 | high GHSA-hrpp-h998-j3pp, medium GHSA-6rw7-vpxm-498p |
| #16 | json5 2.1.1 to 2.2.3 | jest 24 | high GHSA-9c47-m6qq-7p4h |

- #3 and #4 (closed Dependabot) and #2 (merged acorn bump) need nothing. #1 (the merged Gitter badge) is history: the badge goes in D18.
- There have been no issues, so there is nothing to close. The old tests pin nothing that the golden fixtures do not already cover.
- The fork gitter-badger/seeded-random-utilities carried only #1 and needs nothing.

## Security

- **The leaked token.** `.travis.yml` has held a Codecov repository upload token in plain text since 3f407ba (2019-11-24). Deleting the file does not un-leak it: history, forks and clones keep it. Only revoking it at codecov.io does, and that is Mark's task. Its reach is uploading coverage reports for this repository, a low impact, but it is still a live credential until revoked. Rewriting public history to purge it would achieve nothing once it is revoked, and would break the pull request refs, so the plan does not.
- **Webhook.** The codecov.io webhook (id 160643172) goes in Stage 2, with Mark's OK.
- **Secret scanning and push protection.** On in Stage 2 (question 3). If GitHub then reports the token, close the alert as revoked.
- **Dependabot alerts.** 72 now, 0 after the merge. `npm audit` and `npm audit signatures` run in CI.
- **Workflows.** `permissions` read by default, `id-token` set to `write` only in the publish job, `persist-credentials: false`, actions pinned to SHAs, no `pull_request_target`, actionlint clean. The default workflow permissions for the repository drop to read (question 2).
- **Publishing.** npm 2FA is on for the account (2026-09-25). Trusted publishing is in staged mode, with provenance on every version. No npm token exists anywhere; nothing is published from this machine.
- **The library.** It has no network, filesystem, `eval` or `Function` use. `fromState` reads known fields only, so a parsed JSON state cannot touch prototypes. No loop runs longer than its output or its input array, except the deprecated `generateRandomArrayOfUniqueIntegers`, whose O(maxValue) cost is documented and has a bounded successor.
- **What it is not.** The README says it is not a cryptographic generator: a seed or a few outputs reveal the whole sequence, and unseeded mode is Math.random. For tokens, keys or anything with money on it, use `crypto.getRandomValues`.
- **Private vulnerability reporting.** On in Stage 2; SECURITY.md points at it.

## Verification checklist (what "done" means)

| Claim | Command or place | Expected |
|---|---|---|
| Installs clean | `npm ci` in a fresh clone | No deprecation warnings, 0 vulnerabilities |
| Zero runtime dependencies | `npm ls --omit=dev --all` | Nothing under the package |
| Same sequences as 1.1.4 | `npm test`, CI, verify-published | 322 of 322 golden cases on both builds, every Node line, Bun, Deno and from the registry |
| 1.1.4 CommonJS code still works | `node -e "const S=require('seeded-random-utilities').default; console.log(new S('1234').random())"` | `0.3111365893855691` |
| ESM works | `node --input-type=module -e "import S, {PRNG} from 'seeded-random-utilities'; console.log(new S('1234', PRNG.mulberry32).random())"` | `0.7808577308896929` |
| Dual output is correct | `npx publint`, `npx attw --pack .` | No errors in any mode |
| Portable | the shape test (grep and the bare-engine run) | No Node or DOM references in dist/index.* |
| Every Node line | the CI matrix | All green |
| Published with provenance | `npm view seeded-random-utilities dist.attestations`; `npm audit signatures` in a project that installed it | Present and verified |
| Release exists | `gh release view v2.0.0` | Notes from the changelog |
| No alerts | `gh api "repos/m4bwav/seeded-random-utilities/dependabot/alerts?state=open" --jq length` | `0` |
| Repo tidy | `gh pr list`, `git ls-remote --heads origin`, `gh api repos/m4bwav/seeded-random-utilities/hooks --jq length` | No open pull requests, only `master`, 0 webhooks |
| Token dead, scanning on | Mark's confirmation; `gh api repos/m4bwav/seeded-random-utilities --jq .security_and_analysis` | Revoked; secret scanning and push protection enabled |

## Risks and open points

- **D6 is the one place where the kickoff prompt's two wishes conflict.** The recommendation keeps D1 and adds the bounded method under a new name; Mark rules.
- `PRNG.sfc32` in a type position (`let a: PRNG.sfc32`) worked with the 1.1.4 enum. It needs a type-only namespace next to the const object; if TypeScript 6 rejects that under `erasableSyntaxOnly`, the changelog lists it as a type-level break.
- Binding `random` makes it an own property. A subclass that overrides `random()` still works, because the base constructor binds whatever `this.random` resolves to, but a lint rule like unbound-method will still warn about `rng.random`.
- tsdown is pre-1.0: pin it exactly, and fall back to two `tsc` passes if a bump breaks the build twice. TypeScript 7 waits until xo supports it.
- Integer draws use `Math.floor(random() * n)`, as in 1.1.4 (D1 requires it). The relative bias is at most n / 2^32, under one in a million for n up to 4,294; ranges wider than 2^32 are refused by the new names (D8). The README states both.
- Deno 2.9 skips npm versions younger than 24 hours unless given `--minimum-dependency-age=0`, a known trap already handled in get-title-at-url's verify-published.yml.
- The codecov token stays usable until Mark revokes it; nothing in this plan depends on that.
- The rand-seed version checks ran in the session scratchpad. The capture script and its output are committed, and the note records how the version comparison was done and what it found, so it can be re-run.

## Appendix: Stage 2 commands (run from any directory; all paths absolute)

```bash
R=m4bwav/seeded-random-utilities
M=<full SHA of the squash-merge commit>
gh api "repos/$R/dependabot/alerts?state=open&per_page=100" --jq length   # must print 0 first

# One comment per pull request, from the disposition table (number|package|the tool that brought it in)
while IFS='|' read -r n pkg tool; do
  gh pr close "$n" -R "$R" --delete-branch --comment "Closing: $M, the 2.0.0 rewrite, replaced the lockfile, and $pkg is no longer in the dependency tree. It came in through $tool, which 2.0.0 removed. Dependabot shows 0 open alerts on master."
done <<'EOF'
5|y18n|jest 24
6|handlebars|jest 24
7|lodash|jest 24
8|hosted-git-info|jest 24
9|glob-parent|eslint 6
10|path-parse|jest 24
11|tmpl|jest 24
12|ajv|eslint 6
13|terser|rollup-plugin-terser 5
14|decode-uri-component|rollup-plugin-sourcemaps and jest 24
15|qs|jest 24
16|json5|jest 24
EOF

gh api -X DELETE "repos/$R/hooks/160643172"                 # with Mark's OK (question 1)
gh repo edit "$R" \
  --description "Seeded random numbers, integers, booleans, strings, picks and shuffles: the same seed gives the same sequence everywhere. Zero dependencies, TypeScript, ESM and CommonJS." \
  --homepage "https://www.npmjs.com/package/seeded-random-utilities" \
  --enable-wiki=false --enable-projects=false --delete-branch-on-merge \
  --add-topic random --add-topic seed --add-topic prng --add-topic rng \
  --add-topic deterministic --add-topic shuffle --add-topic typescript --add-topic nodejs
gh api -X PUT "repos/$R/private-vulnerability-reporting"
gh api -X PUT "repos/$R/actions/permissions/workflow" -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false
gh api repos/m4bwav/get-title-at-url/rulesets/24003504   # the template for this repository's ruleset
```

## Next single action

Mark reads the decisions table and answers the three Stage 0 questions. Then Stage 1 starts on branch `v2`.
