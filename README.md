# seeded-random-utilities

[![npm version](https://img.shields.io/npm/v/seeded-random-utilities.svg)](https://www.npmjs.com/package/seeded-random-utilities)
[![CI](https://github.com/m4bwav/seeded-random-utilities/actions/workflows/ci.yml/badge.svg)](https://github.com/m4bwav/seeded-random-utilities/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dm/seeded-random-utilities.svg)](https://www.npmjs.com/package/seeded-random-utilities)

Seeded random numbers, integers, booleans, characters, strings, picks, weighted picks and shuffles. **The same seed gives the same sequence** on every runtime and in every version since 1.0: save games, generated levels, test fixtures and simulations come out the same every time.

- Five small, fast generators: sfc32 (the default), mulberry32 and xoshiro128**, plus reference versions of the last two.
- TypeScript types, ES module and CommonJS builds, no dependencies.
- Node 20 and later, browsers, Bun, Deno and workers: the library uses nothing but plain JavaScript.

## Install

```sh
npm install seeded-random-utilities
```

## Usage

```js
import SeededRandomUtilities from 'seeded-random-utilities';

const rng = new SeededRandomUtilities('level-1');

rng.random();                        // a number in [0, 1)
rng.getRandomInteger(1, 7);          // 1 to 6: a die roll
rng.getRandomFloat(-1, 1);           // a number in [-1, 1)
rng.getRandomBool(0.25);             // true one time in four
rng.selectRandomElement(['a', 'b', 'c']);
rng.selectWeightedRandomElement(['common', 'rare'], [9, 1]);
rng.getUniqueRandomIntegers(3, 10);  // three different integers from 0 to 9
rng.shuffle([1, 2, 3, 4]);           // a shuffled copy
rng.getRandomString(8);              // 8 characters from a pool of 81
```

Run it twice and every line returns the same thing both times. Change the seed and everything changes.

**CommonJS:**

```js
const {SeededRandomUtilities, PRNG} = require('seeded-random-utilities');
// require('seeded-random-utilities').default still works, as it did in 1.x.
```

**Deno:** `import SeededRandomUtilities from 'npm:seeded-random-utilities';`

**Bun:** `bun add seeded-random-utilities`, then import as above.

**Browsers:** through any bundler, or as an ES module from a CDN that serves npm packages. The code is ES2022: Chrome 93, Firefox 92, Safari 15.4 or later.

```html
<script type="module">
  import SeededRandomUtilities from 'https://cdn.jsdelivr.net/npm/seeded-random-utilities@2/+esm';
  console.log(new SeededRandomUtilities('1234').random());
</script>
```

## Seeds

A seed is a string or a finite number: `42` and `'42'` give the same sequence. Without a seed (undefined or null) the numbers come from `Math.random()`, so they are not repeatable.

```js
new SeededRandomUtilities('player-7');   // a string
new SeededRandomUtilities(20260925);     // a number
new SeededRandomUtilities();             // Math.random: different every run
```

**Independent streams.** Give each part of a program its own generator with a seed derived from the main one. Then drawing more numbers in one part never changes another:

```js
const world = 'world-42';
const terrain = new SeededRandomUtilities(`${world}:terrain`);
const loot = new SeededRandomUtilities(`${world}:loot`);
```

**Save and resume.** `getState()` returns plain data. `fromState()` continues from exactly that point, in the same process or another:

```js
const saved = JSON.stringify(rng.getState());
// … later, anywhere …
const resumed = SeededRandomUtilities.fromState(JSON.parse(saved));
```

**Other libraries.** Many libraries accept a `Math.random`-style function. `rng.random` is bound to its instance, so pass it directly:

```js
someLibrary({random: rng.random});
Array.from({length: 5}, rng.random);  // five numbers
```

## Algorithms

Pass the algorithm as the second argument: `new SeededRandomUtilities('seed', PRNG.mulberry32)`, or just the string `'mulberry32'`.

| `PRNG` | Algorithm | Notes |
|---|---|---|
| `sfc32` (default) | sfc32, Chris Doty-Humphrey's Small Fast Counting generator from PractRand | 128-bit state. The recommended choice |
| `mulberry32` | Mulberry32, Tommy Ettinger | 32-bit state, as in 1.x. Its counter is never wrapped, so after about 4.9 million draws its low bits round away and quality slowly drops |
| `mulberry32Reference` | Mulberry32 with the reference 32-bit counter | The same numbers as `mulberry32` for the first 4.9 million draws, correct after |
| `xoshiro128ss` | xoshiro128** version 1.0, David Blackman and Sebastiano Vigna | As in 1.x. Version 1.0 scrambled the wrong state word, which the authors fixed in 1.1 |
| `xoshiro128ssReference` | xoshiro128** 1.1, the authors' reference | The same numbers as rand-seed 2.0 and later give for `xoshiro128ss` |

The older variants stay so that seeds stored with 1.x keep producing the same numbers. For new work, use `sfc32`.

## API

| Method | Returns |
|---|---|
| `random()` | A number in [0, 1). `getRandom()` is the same |
| `getRandomInteger(max)`, `getRandomInteger(min, max)` | An integer in [0, max) or [min, max) |
| `getRandomIntegerInclusive(max)`, `getRandomIntegerInclusive(min, max)` | An integer in [0, max] or [min, max] |
| `getRandomFloat(max)`, `getRandomFloat(min, max)` | A number in [0, max) or [min, max) |
| `getRandomBool(probability = 0.5)` | `true` with the given probability |
| `getRandomChar(pool?)` | One character (code point) from `pool`, by default 81 letters, digits and symbols |
| `getRandomString(length, pool?)` | `length` characters, each drawn as `getRandomChar(pool)` draws it |
| `selectRandomElement(array)` | One element, or `undefined` for an empty array |
| `selectUniqueRandomElements(array, picks)` | `picks` different elements, in their original order |
| `selectWeightedRandomElement(array, weights)` | One element, chosen with probability weight / sum of the weights |
| `getUniqueRandomIntegers(amount, max)`, `getUniqueRandomIntegers(amount, min, max)` | `amount` different integers from [0, max) or [min, max), in random order |
| `shuffle(array, copy = true)` | The elements in random order: a new array, or the same array shuffled in place when `copy` is `false` |
| `shuffle(string)` | The characters of a string in random order |
| `chooseBooleanRandomlyWithProbability(itemCount, picks = 1)` | `true` with probability picks / itemCount |
| `getState()` | The generator's position, for `SeededRandomUtilities.fromState(state)` |

Bad arguments throw `TypeError` or `RangeError` with a message that names the method: an empty or reversed range, a probability outside [0, 1], an empty pool, or more unique integers than the range holds.

Also exported: `PRNG`; `Rand`, rand-seed 0.1's class with the same numbers (`new Rand(seed, prng).next()`); and the types `RandomUtilities`, `Seed`, `RandomSource` and `GeneratorState`.

## Same seed, same sequence

Version 2 returns exactly what 1.1.4 returned for every call 1.1.4 handled, with every algorithm. The test suite checks 322 cases recorded from the published 1.1.4, on Node 20, 22, 24 and 26, Bun and Deno. Every number comes from arithmetic that JavaScript defines exactly, so every engine agrees.

The three exceptions are inputs that 1.1.4 handled badly:

- `shuffle` on a string splits it by character, where 1.1.4 cut emoji and other characters outside the Basic Multilingual Plane in half. Strings without such characters shuffle exactly as before.
- A number used as a seed is hashed as its string. In 1.1.4 every number gave the same sequence as the empty string.
- An unknown algorithm name with a seed throws `TypeError`, where 1.1.4 silently fell back to `Math.random()`.

A few rare call patterns also changed, such as passing methods as array callbacks (`array.map(rng.getRandomBool, rng)`); the [changelog](CHANGELOG.md) lists them.

## Migrating from 1.x

| 1.x | 2.x |
|---|---|
| `getRandomIntegar(max, min)` | `getRandomInteger(min, max)`. The same numbers; note the order |
| `getRandomArbitrary(max, min)` | `getRandomFloat(min, max)`. The same numbers |
| `getRandomIntInclusive(max, min)` | `getRandomIntegerInclusive(min, max)`. The same numbers |
| `generateRandomArrayOfUniqueIntegers(amount, maxValue)` | `getUniqueRandomIntegers(amount, 0, maxValue + 1)`. It takes time and memory in proportion to the amount instead of the range, but draws a different sequence |
| `require('seeded-random-utilities').default` | Still works; `.SeededRandomUtilities` too |
| `PRNG` from rand-seed, a TypeScript enum | `PRNG` from this package: an object and a string union type. `PRNG.sfc32` still works, and so does `'sfc32'` |

The four old methods still work, with 1.1.4's behaviour for every input. They are deprecated, so editors strike them through, and 3.0.0 removes them. Node 18 and older are no longer supported. Import the package root only: deep paths into `dist/` changed. The details are in the [changelog](CHANGELOG.md).

## Limits

- **Not for security.** A seed, or a few outputs, reveal the whole sequence. Use `crypto.getRandomValues()` for passwords, tokens, keys and anything with money on it.
- Integer methods draw one 32-bit number, so a range may hold at most 2^32 integers, all within ±(2^53 - 1); anything else throws. A range of n integers is uniform to within n / 2^32, which is less than one in a million below 4,294 integers.
- `getRandomFloat` computes `random() * (max - min) + min`, as 1.x did, so when the range is tiny next to its bounds, rounding can return `max` itself.
- `getRandomString` and `getUniqueRandomIntegers` return at most 2^24 (16,777,216) characters or integers; more throws `RangeError` rather than exhausting memory.
- `selectRandomElement` and `selectUniqueRandomElements` walk the array as 1.x did, drawing up to one number per element. `selectWeightedRandomElement` draws once.
- The deprecated `generateRandomArrayOfUniqueIntegers` builds and shuffles the whole range, so a large `maxValue` costs time and memory; `getUniqueRandomIntegers` does not.

## Credits

The generators are ported from [rand-seed](https://github.com/michaeldzjap/rand-seed) 0.1.5 (MIT, Michael Dzjaparidze), which this package depended on until 2.0.0. rand-seed took them from [bryc's public-domain JavaScript ports](https://github.com/bryc/code/blob/master/jshash/PRNGs.md) of the algorithms by Chris Doty-Humphrey (sfc32), Tommy Ettinger (mulberry32) and David Blackman and Sebastiano Vigna (xoshiro128**). The range helpers began as the examples on MDN's `Math.random()` page.

## License

MIT © Mark Rogers. [LICENSE](LICENSE) includes rand-seed's notice. Security reports: see [SECURITY.md](SECURITY.md).
