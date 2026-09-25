import {
  generatorFromSeed,
  PRNG,
  toAlgorithm,
  unseeded,
  type Generator,
} from './generators.ts';
import type {RandomSource, Seed} from './random-utilities.ts';

const describe = (value: unknown): string => typeof value === 'string' ? JSON.stringify(value) : String(value);

/**
The algorithm for a constructor argument: sfc32 for undefined or null, otherwise a `PRNG` value.

@throws {TypeError} For any other value. 1.1.4 silently fell back to Math.random there.
*/
export function parseAlgorithm(prng: unknown): PRNG {
  if (prng === undefined || prng === null) {
    return PRNG.sfc32;
  }

  const algorithm = toAlgorithm(prng);
  if (algorithm === undefined) {
    throw new TypeError(`Unknown algorithm ${describe(prng)}; use one of ${Object.values(PRNG).join(', ')}`);
  }

  return algorithm;
}

/**
The string to hash for a seed, or undefined for no seed (Math.random). The empty string is a seed, as in 1.1.4.

@throws {TypeError} For anything but a string, a finite number, undefined or null. 1.1.4 gave every number the sequence of `''`.
*/
export function parseSeed(seed: unknown): string | undefined {
  if (seed === undefined || seed === null) {
    return undefined;
  }

  if (typeof seed === 'string') {
    return seed;
  }

  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return String(seed);
  }

  throw new TypeError(`A seed must be a string or a finite number, not ${describe(seed)}`);
}

/**
The generator for a seed and an algorithm, or undefined when there is no seed.
*/
export function seededGenerator(seed: unknown, prng: unknown): Generator | undefined {
  const algorithm = parseAlgorithm(prng);
  const text = parseSeed(seed);
  return text === undefined ? undefined : generatorFromSeed(algorithm, text);
}

/**
The `Rand` class of rand-seed 0.1, which 1.1.4 re-exported, without the dependency: the same constructor and the same numbers.

@example
```
import SeededRandomUtilities, {PRNG, Rand} from 'seeded-random-utilities';

const rng = new SeededRandomUtilities(new Rand('1234', PRNG.mulberry32));
```
*/
export class Rand implements RandomSource {
  readonly #source: RandomSource;

  /**
  A generator for the seed and algorithm, as rand-seed 0.1 made it.

  @param seed - A string or a finite number. Without one (undefined, or null from JavaScript), `next()` is Math.random.
  @param prng - The algorithm; sfc32 when omitted.
  */
  constructor(seed?: Seed, prng?: PRNG) {
    this.#source = seededGenerator(seed, prng) ?? unseeded;
  }

  /**
  The next number of the sequence, in [0, 1).
  */
  next(): number {
    return this.#source.next();
  }
}
