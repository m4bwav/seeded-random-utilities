---
title: "rand-seed history and the 1.1.4 golden sequences"
kind: note
status: active
date: 2026-09-25
verified: 2026-09-25
stale_after: 2027-03-25
tags: [determinism, prng, rand-seed, sfc32, mulberry32, xoshiro128, xfnv1a, golden, v2, research]
aliases: [xoshiro128** 1.0, sfc32 counter order, numeric seed bug, empty string seed, golden fixtures, capture-1.1.4]
summary: "read before touching an algorithm, the seed handling or the golden fixtures: what each rand-seed version computes, why 1.1.4's sfc32 and mulberry32 are sound and its xoshiro128ss is the authors' flawed version 1.0, the 1.1.4 quirks, and the checks that proved it"
---

# rand-seed history and the 1.1.4 golden sequences

Research for the v2 plan's determinism decisions (D1 to D3, D7). Everything here was checked on 2026-09-25 by running code, not by reading changelogs alone; the commands are at the end.

## Summary

- seeded-random-utilities 1.1.4 depends on `rand-seed ^0.1.2`. A fresh install resolves 0.1.5 (the repository's lockfile pins 0.1.2). rand-seed 0.1.2 to 1.0.0 run the same algorithm code and give identical streams, so every 1.1.4 install since 2019 has produced the same numbers.
- rand-seed later changed xoshiro128ss twice (1.0.1 and 2.0.0) and sfc32 once (3.0.0). mulberry32 never changed.
- 1.1.4's **sfc32** (the default) is sound. It adds the counter after incrementing it, where PractRand adds it first and then increments. That is the same generator with the counter one higher: rand-seed 3.0.0's PractRand-order sfc32, started with the counter plus one, matches 1.1.4 on every draw tested. Upstream's 3.0.0 change is a different seeding, not a quality fix.
- 1.1.4's **xoshiro128ss** is xoshiro128** version 1.0. It passes the first state word `s[0]` to the scrambler, which the authors' reference now calls a mistake: "Note that version 1.0 had mistakenly s[0] instead of s[1] as state word passed to the scrambler" (prng.di.unimi.it/xoshiro128starstar.c, xoshiro128** 1.1). rand-seed 3.0.0's xoshiro128ss equals the 1.1 reference.
- The seed hash is bryc's xfnv1a: FNV-1a over UTF-16 code units, then a xorshift-and-add finalizer called once per 32-bit state word (4 words for sfc32 and xoshiro128ss, 1 for mulberry32).

## rand-seed versions against 1.1.4

| rand-seed | Published | sfc32 | mulberry32 | xoshiro128ss | What changed |
|---|---|---|---|---|---|
| 0.1.2 | 2019-05-24 | same | same | same | the version in 1.1.4's lockfile |
| 0.1.3, 0.1.4 | 2020-02-02, 2020-03-15 | same | same | same | no source change (source maps diffed) |
| 0.1.5 | 2020-06-18 | same | same | same | a type annotation; what `^0.1.2` installs today |
| 1.0.0 | 2020-09-11 | same | same | same | |
| 1.0.1, 1.0.2 | 2021-09-23, 2022-09-14 | same | same | differs | rotl rewritten as `(r << 7) \| ((r >>> 25) * 9)`, a precedence bug |
| 2.0.0 to 2.1.7 | 2024-07-31 to 2024-08-31 | same | same | differs | xoshiro128** 1.1: `s[1]` scrambled, rotl fixed (issue #8, commit b5fe4f1, "BREAKING" in the 2.0.0 release notes) |
| 3.0.0 | 2025-07-01 | differs | same | differs | sfc32 in PractRand order (issue #19, commit 8b1e80c, "BREAKING"); dual ESM and CommonJS |

"Same" and "differs" for 0.1.2, 0.1.5, 1.0.0, 1.0.2, 2.0.0 and 3.0.0 come from running each version against the 1.1.4 streams (5 seeds, 10,000 draws per algorithm). 0.1.3, 0.1.4 and 1.0.1 were compared by source; 2.1.x follows the 2.0.0 release notes and was not run.

## Where the algorithms come from, and their licences

| Piece | Author | Licence |
|---|---|---|
| sfc32 (Small Fast Counting) | Chris Doty-Humphrey, PractRand | public domain |
| mulberry32 | Tommy Ettinger | public domain |
| xoshiro128** | David Blackman and Sebastiano Vigna | public-domain dedication in the reference C file |
| xfnv1a and the JavaScript ports | bryc, github.com/bryc/code, jshash/PRNGs.md | "License: Public domain." at the top of that page |
| rand-seed (the TypeScript classes 1.1.4 used) | Michael Dzjaparidze | MIT; 0.1.2's LICENSE says Copyright (c) 2018, 0.1.5's says 2020 |

Inlining the ports in v2 therefore needs rand-seed's MIT notice kept with the code: in the source file header and appended to LICENSE, which ships in the tarball (plan D3).

## 1.1.4 quirks, captured from the published package

| Input | What 1.1.4 does | Capture field |
|---|---|---|
| seed `''` | A real seed: the hash of the empty string, deterministic. The kickoff prompt's "treats '' as no seed (Math.random)" is wrong. The constructor's `seed && seed instanceof Rand` check passes `''` on to rand-seed, which treats only null and undefined as unseeded | `emptyStringSeedIsDeterministic: true` |
| a number as seed (JavaScript callers; TypeScript refused it) | Every number gives the same sequence as `''`, because `_xfnv1a(1234)` loops over `str.length`, which a number does not have | `numberSeed1234EqualsEmptyStringSeed`, `…5678…`, `…0…`: all `true` |
| an array as seed | Throws `TypeError: t.charCodeAt is not a function` | `arraySeed` |
| an unknown algorithm name, such as `'SFC32'` | Silently unseeded (Math.random) | `unknownAlgorithmIsDeterministic: false` |
| an explicit `null` algorithm | Silently unseeded: the default parameter only replaces undefined | `nullAlgorithmIsDeterministic: false` |
| null or undefined seed | Unseeded (Math.random), as the README says | `nullSeedIsDeterministic: false` |
| a rand-seed `Rand` instance as seed | Used as the generator; same numbers as the string seed | `randInstanceEqualsStringSeed: true` |

## The golden fixtures

`test/golden/1.1.4.json`: 322 cases, 101,083 bytes, captured from seeded-random-utilities 1.1.4 with rand-seed 0.1.5 on Node 24.18.0. The capture script `test/golden/capture-1.1.4.cjs` explains the format in its header. Every public method is covered with several argument shapes, including the odd inputs 1.1.4 accepted (reversed bounds, non-integer bounds, negative counts, null arrays). The coverage:

- 2 seeds × 3 algorithms with every method;
- 7 seeds × 4 algorithm choices (the default and the three names) for `random()`, recording 32 values and 4 values after 10,000 draws;
- 6 script cases that call several methods in turn on one instance, pinning how many numbers each method draws.

Two runs gave byte-identical files.

The values are the same on every conforming JavaScript engine. Each one is `k / 2^32` or is computed from such values with `+`, `-`, `*`, `/`, `Math.floor`, `Math.ceil` and `Math.imul`, which ECMAScript specifies exactly. `Math.log`, `Math.exp`, `Math.sin` and `Math.cos` are implementation-approximated, which is why a Gaussian built on them would not be bit-identical everywhere (plan D10).

## How it was checked (2026-09-25, Node 24.18.0, npm 11.16.0)

```bash
# scratch project, outside the repository
npm init -y && npm install seeded-random-utilities@1.1.4   # npm ls: rand-seed@0.1.5
node capture-1.1.4.cjs > 1.1.4.json                        # run twice; cmp: identical
# every rand-seed version unpacked with `npm pack rand-seed@<v>`; the TypeScript sources of 0.1.x and 1.0.x
# recovered from sourcesContent in dist/rand-seed.js.map, 3.0.0 read from dist/cjs/index.js
```

A throwaway script then ran a 60-line zero-dependency port of xfnv1a, sfc32, mulberry32 and xoshiro128** (both versions) against the fixtures and the unpacked versions:

- the port reproduced all 1,232 `random()` values in the fixtures, with 0 mismatches;
- rand-seed 0.1.2, 0.1.5 and 1.0.0 matched the 1.1.4 streams for all three algorithms; 1.0.2 and 2.0.0 differ in xoshiro128ss only; 3.0.0 differs in sfc32 and xoshiro128ss; mulberry32 matched in all six;
- PractRand-order sfc32 with the counter plus one equals 1.1.4's sfc32, and rand-seed 3.0.0's xoshiro128ss equals xoshiro128** 1.1, on every one of 5 seeds × 10,000 draws.

Upstream sources: rand-seed releases v2.0.0 and v3.0.0 and issues #8 ("Current Xoshiro128ss implementation is based on an incorrect version 1.0") and #19 ("Incorrect implementation of sfc32") on github.com/michaeldzjap/rand-seed; the reference C code at prng.di.unimi.it.

Related: see also [../plans/2026-09-25-modernization-and-v2-release.md](../plans/2026-09-25-modernization-and-v2-release.md), [../decisions/2026-09-25-v2-shape-keep-the-1-1-4-sequences-zero-deps-deprecated-aliases.md](../decisions/2026-09-25-v2-shape-keep-the-1-1-4-sequences-zero-deps-deprecated-aliases.md).
