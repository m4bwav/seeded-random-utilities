# Changelog

All notable changes to this package. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package follows [Semantic Versioning](https://semver.org/).

## [2.0.0] - Unreleased

**Same seed, same sequence.** Every call that 1.1.4 handled returns exactly the same numbers in 2.0.0, for every algorithm and on every runtime; the tests check 322 cases recorded from the published 1.1.4. There are three exceptions, all inputs that 1.1.4 handled badly: `shuffle` on strings with characters outside the Basic Multilingual Plane (emoji), numbers used as seeds, and unknown algorithm names with a seed. A few rare call patterns also behave differently; they are listed under "Changed (breaking)".

### Changed (breaking)

- Needs Node 20 or later. The package now has an `exports` map, so only the package root and `package.json` can be imported; deep paths into `dist/` changed.
- rand-seed is no longer a dependency. Its generators are part of this package, with the same numbers. `Rand` and `PRNG` are still exported, now from here.
- `PRNG` is an object plus a string union type instead of a TypeScript enum. `PRNG.sfc32` still works, and plain `'sfc32'` now type-checks.
- A number used as a seed is hashed as its string, so `42` and `'42'` give the same sequence. In 1.1.4 every number gave the sequence of the empty string.
- With a seed, an unknown algorithm name throws `TypeError`; 1.1.4 silently used `Math.random()`. Without a seed, or with a generator object as the seed, the algorithm is not used, and is not checked, as in 1.1.4. `null` as the algorithm now means sfc32 (1.1.4: `Math.random()`).
- A seed that is not a string, a finite number, a `String` object or an object with `next()` throws `TypeError`.
- `shuffle` splits a string by character, where 1.1.4 cut emoji and other characters outside the Basic Multilingual Plane into invalid halves. Strings without such characters shuffle exactly as before.
- Rare call patterns:
  - `getRandomBool` and `getRandomChar` now read their first argument (a probability, a pool), which 1.1.4 ignored. Calling them as array callbacks, as in `array.map(rng.getRandomBool, rng)`, passes the elements as that argument; use `() => rng.getRandomBool()` instead.
  - `random` is bound to each instance when it is created, so replacing `SeededRandomUtilities.prototype.random` afterwards no longer affects existing instances.
  - A generator object from another library, such as rand-seed 3's `Rand`, passed as the seed is now used to draw numbers; 1.1.4 hashed it like the empty string.
- Types:
  - `selectRandomElement` returns `T | undefined`: it always returned `undefined` for an empty array.
  - `shuffle` has overloads: a string gives a string, an array gives `T[]`. It no longer returns `T[] | string`.
  - The `RandomUtilities` interface lists the new methods and `skipShuffle`, so a class that implements it must add them.
  - `PRNG` has five names, so a `Record<PRNG, …>` or an exhaustive `switch` over it needs the two new ones.
- Errors are `TypeError` or `RangeError` instead of `Error`, with 1.1.4's messages where it had them.
- The builds use ES2022 (private class fields, `Object.hasOwn`): Chrome 93, Firefox 92, Safari 15.4 or later, or a transpiler.

### Added

- `getRandomInteger`, `getRandomIntegerInclusive` and `getRandomFloat` take `(min, max)`, or `(max)`, and give the same numbers as the 1.1.4 methods. They throw `RangeError` for a reversed range, and the integer methods also for a range that holds no integer (bounds are rounded inwards), more than 2^32 integers, or integers beyond ±(2^53 - 1).
- `SeededRandomUtilities.default`, the class itself, so 1.1.4 code for Node's ES module loader that wrote `new SeededRandomUtilities.default(seed)` keeps working (deprecated).
- `getRandomBool(probability)`. Without an argument it is 1.1.4's `getRandomBool()`.
- `getRandomChar(pool)` and `getRandomString(length, pool)`. The pool is read by character, and the default is 1.1.4's.
- `selectWeightedRandomElement(items, weights)`.
- `getUniqueRandomIntegers(amount, max)` and `getUniqueRandomIntegers(amount, min, max)`, which take time and memory in proportion to the amount (at most 2^24), not the range. `getRandomString` also returns at most 2^24 characters, so a huge length throws instead of exhausting the heap.
- `getState()` and `SeededRandomUtilities.fromState(state)`, to save a generator and resume it exactly.
- `PRNG.xoshiro128ssReference`: xoshiro128** 1.1, the authors' reference. 1.1.4's `xoshiro128ss` is version 1.0, which scrambles the wrong state word.
- `PRNG.mulberry32Reference`: Mulberry32 with the reference 32-bit counter. 1.1.4's `mulberry32` never wraps its counter, which rounds after about 4.9 million draws.
- The constructor accepts any object with `next()` as the source of numbers. `random` is bound, so `rng.random` can be passed where a `Math.random`-style function is expected.
- The named export `SeededRandomUtilities`, alongside the default export (`require('seeded-random-utilities').SeededRandomUtilities` in CommonJS).
- ES module and CommonJS builds, with a declaration file for each. They run in browsers, Bun, Deno and workers.

### Deprecated

These keep 1.1.4's behaviour for every input, and 3.0.0 removes them.

- `getRandomIntegar(max, min)`: use `getRandomInteger(min, max)`.
- `getRandomArbitrary(max, min)`: use `getRandomFloat(min, max)`.
- `getRandomIntInclusive(max, min)`: use `getRandomIntegerInclusive(min, max)`.
- `generateRandomArrayOfUniqueIntegers(amount, maxValue)`: use `getUniqueRandomIntegers(amount, 0, maxValue + 1)`, which draws a different sequence.

### Fixed

- README: `random()` returns a number in [0, 1), not an integer. The CommonJS bundle could never be loaded with a `<script>` tag (use the ES module). Several method descriptions were wrong.
- The npm scripts ran only in POSIX shells.

### Removed

- Travis CI, codecov, SonarCloud, the David and Gitter badges and their configuration. `.travis.yml` held a codecov upload token in plain text.
- rollup, jest and eslint, replaced by tsdown, `node:test` and xo; the `sample/` folder, replaced by the README examples and the consumer tests.

## [1.1.4] - 2019-11-25

The same code as 1.1.3, published again.

## 1.1.0 to 1.1.3 - 2019-11-24

The interface is exported as `RandomUtilities`. Lint and spelling fixes, and README badges.

## [1.0.0] - 2019-11-22

First release: `SeededRandomUtilities` over rand-seed, with sfc32, mulberry32 and xoshiro128**.

[2.0.0]: https://github.com/m4bwav/seeded-random-utilities/compare/171f15c...v2.0.0
[1.1.4]: https://www.npmjs.com/package/seeded-random-utilities/v/1.1.4
[1.0.0]: https://www.npmjs.com/package/seeded-random-utilities/v/1.0.0
