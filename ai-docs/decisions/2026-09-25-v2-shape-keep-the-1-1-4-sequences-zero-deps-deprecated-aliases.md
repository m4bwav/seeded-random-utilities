---
title: "v2 shape: keep the 1.1.4 sequences, zero dependencies, deprecated aliases"
kind: decision
status: active
date: 2026-09-25
verified: 2026-09-25
stale_after: never
tags: [v2, determinism, prng, typescript, esm, cjs, api, deprecation, zero-deps]
summary: "read before changing the v2 design or any seeded behaviour: why 2.0.0 reproduces 1.1.4 bit for bit, inlines rand-seed's algorithms, keeps every 1.1.4 name as a deprecated alias, and puts fixes behind new names"
---

# Decision: v2 reproduces 1.1.4's sequences bit for bit, inlines the generators, and keeps every 1.1.4 name

Date: 2026-09-25. Status: accepted by Mark on 2026-09-25, every recommendation as written. Stage 1 added D2b under D2's rule: 1.1.4's mulberry32 counter is never wrapped and loses precision after about 4.9 million draws, so the stream stays exact under `mulberry32` and the correct algorithm is added as `PRNG.mulberry32Reference`. Each point maps to a row of the plan's decisions table.

## Context

seeded-random-utilities 1.1.4 (2019-11-25) is a class of random helpers over `rand-seed ^0.1.2`. It still installs and passes its 21 jest tests on Node 24, but its toolchain is from 2019 (rollup 1, TypeScript 3.7, jest 24, eslint 6), its package has no `exports`, `engines` or `sideEffects`, CommonJS callers need `.default`, and its README misdescribes several methods. rand-seed has since changed two of its three algorithms (xoshiro128ss in 2.0.0, sfc32 in 3.0.0), so upgrading the dependency would silently change every seeded sequence. The research, with the checks that proved each claim, is [../notes/2026-09-25-rand-seed-history-and-the-1-1-4-golden-sequences.md](../notes/2026-09-25-rand-seed-history-and-the-1-1-4-golden-sequences.md).

## Decision

1. **Same seed, same sequence (D1).** Every 1.1.4 method called with arguments 1.1.4 handled returns exactly what 1.1.4 returned, for every algorithm, on every runtime. The contract is `test/golden/1.1.4.json` (322 cases captured from the published 1.1.4), compared with strict equality against both builds on Node 20, 22, 24 and 26, Bun and Deno. The changelog's first line for 2.0.0 says so.
2. **Fixes go behind new names (D2, D6, D9).** 1.1.4's xoshiro128ss is xoshiro128** version 1.0, which its authors corrected in 1.1: it keeps its name, `PRNG.xoshiro128ss`, and the 1.1 reference is added as `PRNG.xoshiro128ssReference`. sfc32 is not changed, because 1.1.4's sfc32 is the same generator as PractRand's with the counter one higher, not a bug. The O(maxValue) `generateRandomArrayOfUniqueIntegers` keeps its output and gets a bounded successor under a new name. The one exception is shuffling strings, which moves to code points, because 1.1.4's output there is broken UTF-16 for strings with characters outside the Basic Multilingual Plane.
3. **Zero runtime dependencies (D3).** xfnv1a, sfc32, mulberry32 and both xoshiro128** versions are inlined (about 60 lines), with rand-seed's MIT notice in the file header and in LICENSE. A pinned `rand-seed@0.1.5` would work too, but it can never be upgraded without breaking the product, and it would stay in every consumer's tree forever.
4. **Old names keep working (D4, D5).** `PRNG` and a `Rand` class with rand-seed 0.1's API stay exported. `getRandomIntegar`, `getRandomArbitrary` and `getRandomIntInclusive`, which are misspelled or take `(max, min)`, become deprecated aliases (JSDoc's deprecated tag) of `getRandomInteger`, `getRandomFloat` and `getRandomIntegerInclusive`, which take `(min, max)` and give the same numbers for the same state. The new names refuse a reversed range with a RangeError, so correcting only the spelling cannot silently swap the bounds. Deprecated names keep 1.1.4's behaviour for every input for one major version.
5. **Inputs 1.1.4 mishandled are fixed and listed (D7, D8).**
   - Numbers are seeds (`String(n)`, so `42` and `'42'` agree); in 1.1.4 every number gave the `''` sequence.
   - An unknown algorithm name throws where 1.1.4 silently fell back to Math.random.
   - New methods throw TypeError or RangeError on bad arguments.
6. **Everything else follows the playbook defaults**, as get-title-at-url 3.0.0 did: TypeScript built by tsdown into ESM and CommonJS with a declaration file for each, Node 20 and up, no Node or DOM APIs in the library, and node:test against dist. The release is 2.0.0 through staged trusted publishing.

## Reasons

- Reproducibility is what the package is for. It has 72 downloads a month and 3,885 in the last year, with no way to know who stored seeds (save files, generated levels, fixture data). The only safe assumption is that someone did.
- The checks found nothing to fix in sfc32 or mulberry32, so keeping them exact costs nothing. rand-seed 3.0.0's sfc32 change is a counter offset.
- Inlining is the only way to guarantee the numbers for good: upstream has changed them twice and may again.
- New, validated names make correct use easy, and old code keeps running for a full major version, so callers can move when it suits them.

## Alternatives rejected

- Adopt rand-seed 3.0.0's sequences: breaks every stored seed for a counter offset that has no effect on quality.
- Change `generateRandomArrayOfUniqueIntegers` in place to the bounded algorithm, as the kickoff prompt's API list asked: no bounded algorithm can reproduce 1.1.4's output, because that output depends on drawing maxValue + 1 numbers for a full shuffle, and sfc32 cannot jump ahead. It stays open as the plan's alternative to D6 if Mark prefers it.
- Keep rand-seed as a pinned dependency: see point 3.

## Consequences

- Nobody who stored a seed sees a different number after upgrading, unless they shuffled strings containing emoji or passed numbers or unknown algorithm names from JavaScript. The changelog lists those three.
- The library carries two xoshiro128** variants and four deprecated methods until 3.0.0. That is the price of the promise.
- 1.1.4's weaker choices remain available: xoshiro128** 1.0 and the O(maxValue) method. The README recommends sfc32 and the new method for new code.

Related: builds on [../notes/2026-09-25-rand-seed-history-and-the-1-1-4-golden-sequences.md](../notes/2026-09-25-rand-seed-history-and-the-1-1-4-golden-sequences.md); see also [../plans/2026-09-25-modernization-and-v2-release.md](../plans/2026-09-25-modernization-and-v2-release.md).
