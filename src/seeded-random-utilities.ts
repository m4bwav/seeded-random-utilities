import {
  createGenerator,
  isValidState,
  toAlgorithm,
  unseeded,
  type Generator,
  type PRNG,
} from './generators.ts';
import {parseAlgorithm, seededGenerator} from './rand.ts';
import type {
  GeneratorState,
  RandomSource,
  RandomUtilities,
  Seed,
} from './random-utilities.ts';

// The character pool of 1.1.4's getRandomChar: 81 characters.
const DEFAULT_POOL: readonly string[] = [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789~!@#$%^&()*_+-={}[]'];

// One draw is a 32-bit number, so it can reach at most 2^32 different integers.
const MAX_SPAN = 4_294_967_296;

// Array.isArray would narrow a readonly T[] to any[].
const isArray = (value: unknown): boolean => Array.isArray(value);

const isRandomSource = (value: unknown): value is RandomSource => typeof value === 'object' && value !== null && typeof (value as RandomSource).next === 'function';

// `(max)` means [0, max); `(min, max)` means [min, max).
function toRange(method: string, first: number, second: number | undefined): [min: number, max: number] {
  const [min, max] = second === undefined ? [0, first] : [first, second];
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new TypeError(`${method}: min and max must be finite numbers`);
  }

  return [min, max];
}

// The first integer and the number of integers in the range, computed as 1.1.4 computed them (Math.ceil of min, Math.floor of max).
function toIntegerRange(method: string, first: number, second: number | undefined, inclusive: boolean): {start: number; span: number} {
  const [min, max] = toRange(method, first, second);
  const start = Math.ceil(min);
  const span = Math.floor(max) - start + (inclusive ? 1 : 0);
  if (span < 1) {
    throw new RangeError(`${method}: the range from ${min} to ${max} holds no integer`);
  }

  if (span > MAX_SPAN) {
    throw new RangeError(`${method}: the range holds ${span} integers, more than the 2^32 that one draw can reach`);
  }

  return {start, span};
}

function toCharacters(method: string, pool: string | undefined): readonly string[] {
  if (pool === undefined) {
    return DEFAULT_POOL;
  }

  if (typeof pool !== 'string') {
    throw new TypeError(`${method}: pool must be a string`);
  }

  // Code points, so a pool may hold emoji and other characters outside the Basic Multilingual Plane.
  const characters = [...pool];
  if (characters.length === 0) {
    throw new RangeError(`${method}: pool must not be empty`);
  }

  return characters;
}

/**
Seedable random helpers: numbers, integers, booleans, characters, strings, picks and shuffles. The same seed and algorithm give the same numbers on every runtime, and the same numbers as version 1.1.4.

Not for security: a seed, or a few outputs, reveal the whole sequence. Use `crypto.getRandomValues()` for tokens, keys and anything with money on it.

@example
```
import SeededRandomUtilities from 'seeded-random-utilities';

const rng = new SeededRandomUtilities('level-1');
rng.getRandomInteger(1, 7); // a die roll: the same one for this seed, every time
rng.shuffle(['a', 'b', 'c']);
```
*/
export class SeededRandomUtilities implements RandomUtilities {
  /**
  A generator that continues exactly where `getState()` was called, even in another process or on another machine.

  @throws {TypeError} When `state` is not something `getState()` returned.
  */
  static fromState(state: GeneratorState): SeededRandomUtilities {
    const algorithm = toAlgorithm((state as Partial<GeneratorState> | undefined)?.algorithm);
    const words: unknown = (state as Partial<GeneratorState> | undefined)?.state;
    if (algorithm === undefined || !Array.isArray(words) || !isValidState(algorithm, words)) {
      throw new TypeError('fromState: expected an object that getState() returned');
    }

    const rng = new SeededRandomUtilities(undefined, algorithm);
    rng.#generator = createGenerator(algorithm, words);
    rng.#source = rng.#generator;
    return rng;
  }

  #source: RandomSource;
  #generator: Generator | undefined;
  readonly #algorithm: PRNG;

  /**
  A generator for the seed and algorithm, drawing numbers exactly as 1.1.4 did.

  @param seed - A string or a finite number (`42` and `'42'` give the same sequence), or any object whose `next()` returns numbers in [0, 1), such as `Rand`. Without a seed (undefined, or null from JavaScript) the numbers come from Math.random, as in 1.1.4.
  @param prng - The algorithm, one of `PRNG`: sfc32 when omitted.
  @throws {TypeError} For a seed of any other type, or an unknown algorithm.
  */
  constructor(seed?: Seed | RandomSource, prng?: PRNG) {
    this.#algorithm = parseAlgorithm(prng);
    if (isRandomSource(seed)) {
      this.#source = seed;
    } else {
      this.#generator = seededGenerator(seed, this.#algorithm);
      this.#source = this.#generator ?? unseeded;
    }

    // Bound, so `rng.random` can be passed to anything that takes a Math.random-style function.
    this.random = this.random.bind(this);
  }

  /**
  The next number of the sequence, in [0, 1). Bound to its instance: pass `rng.random` wherever a Math.random-style function is accepted.
  */
  random(): number {
    return this.#source.next();
  }

  /**
  The same as `random()`.
  */
  getRandom(): number {
    return this.random();
  }

  /**
  An integer in [0, max), or in [min, max) with two arguments. Non-integer bounds are rounded inwards. The same numbers as 1.1.4's `getRandomIntegar(max, min)`.

  @throws {TypeError} When a bound is not a finite number.
  @throws {RangeError} When the range holds no integer, or more than 2^32.
  */
  getRandomInteger(max: number): number;
  getRandomInteger(min: number, max: number): number;
  getRandomInteger(first: number, second?: number): number {
    const {start, span} = toIntegerRange('getRandomInteger', first, second, false);
    return Math.floor(this.random() * span) + start;
  }

  /**
  An integer in [0, max], or in [min, max] with two arguments. The same numbers as 1.1.4's `getRandomIntInclusive(max, min)`.

  @throws {TypeError} When a bound is not a finite number.
  @throws {RangeError} When the range holds no integer, or more than 2^32.
  */
  getRandomIntegerInclusive(max: number): number;
  getRandomIntegerInclusive(min: number, max: number): number;
  getRandomIntegerInclusive(first: number, second?: number): number {
    const {start, span} = toIntegerRange('getRandomIntegerInclusive', first, second, true);
    return Math.floor(this.random() * span) + start;
  }

  /**
  A number in [0, max), or in [min, max) with two arguments. The same numbers as 1.1.4's `getRandomArbitrary(max, min)`.

  @throws {TypeError} When a bound is not a finite number.
  @throws {RangeError} When min is above max, or the range is too wide for a number.
  */
  getRandomFloat(max: number): number;
  getRandomFloat(min: number, max: number): number;
  getRandomFloat(first: number, second?: number): number {
    const [min, max] = toRange('getRandomFloat', first, second);
    const width = max - min;
    if (!(width >= 0 && width < Infinity)) {
      throw new RangeError(`getRandomFloat: cannot draw from ${min} to ${max}`);
    }

    return (this.random() * width) + min;
  }

  /**
  True with the given probability (0.5 by default). Computed as `random() >= 1 - probability`, so the call without an argument is 1.1.4's.

  @throws {TypeError} When probability is not a number.
  @throws {RangeError} When probability is outside [0, 1].
  */
  getRandomBool(probability?: number): boolean {
    if (probability === undefined) {
      return this.random() >= 0.5;
    }

    if (typeof probability !== 'number' || Number.isNaN(probability)) {
      throw new TypeError('getRandomBool: probability must be a number');
    }

    if (probability < 0 || probability > 1) {
      throw new RangeError(`getRandomBool: probability must be from 0 to 1, not ${probability}`);
    }

    return this.random() >= 1 - probability;
  }

  /**
  One character from `pool`, which is read by code point. The default pool is 1.1.4's 81 letters, digits and symbols, and gives 1.1.4's characters.

  @throws {TypeError} When pool is not a string.
  @throws {RangeError} When pool is empty.
  */
  getRandomChar(pool?: string): string {
    const characters = toCharacters('getRandomChar', pool);
    return characters[Math.floor(this.random() * characters.length)]!;
  }

  /**
  A string of `length` characters, each drawn from `pool` as `getRandomChar(pool)` draws it.

  @throws {RangeError} When length is not a whole number of 0 or more, or pool is empty.
  @throws {TypeError} When pool is not a string.
  */
  getRandomString(length: number, pool?: string): string {
    if (!Number.isSafeInteger(length) || length < 0) {
      throw new RangeError('getRandomString: length must be a whole number of 0 or more');
    }

    const characters = toCharacters('getRandomString', pool);
    let text = '';
    for (let index = 0; index < length; index++) {
      text += characters[Math.floor(this.random() * characters.length)]!;
    }

    return text;
  }

  /**
  One element of `source`, or undefined for an empty array. It walks the array as 1.1.4 did, drawing up to one number per element; `selectWeightedRandomElement` draws once.

  @throws {TypeError} When source is missing.
  */
  selectRandomElement<T>(source: readonly T[]): T | undefined {
    // 1.1.4 threw for any falsy value, which JavaScript callers can pass.
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!source) {
      throw new TypeError('Parameter source is not set');
    }

    return this.selectUniqueRandomElements(source, 1)[0];
  }

  /**
  `picks` different elements of `source`, in their original order (all of them when picks is larger than the array).

  @throws {TypeError} When source is missing.
  @throws {RangeError} When picks is negative.
  */
  selectUniqueRandomElements<T>(source: readonly T[], picks: number): T[] {
    // 1.1.4 threw for any falsy value, which JavaScript callers can pass.
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!source) {
      throw new TypeError('Parameter source is not set');
    }

    if (picks < 0) {
      throw new RangeError('Parameter picks cannot be negative');
    }

    const {length} = source;
    const result: T[] = [];
    let remainingPicks = picks;
    for (let index = 0; index < length; index++) {
      if (remainingPicks === 0) {
        break;
      }

      // Selection sampling (Knuth's Algorithm S): take each element with probability picks left / elements left.
      if (!this.chooseBooleanRandomlyWithProbability(length - index, remainingPicks)) {
        continue;
      }

      result.push(source[index]!);
      remainingPicks--;
    }

    return result;
  }

  /**
  One element of `source`, chosen with probability weight / sum of the weights, with one draw. Elements with weight 0 are never chosen.

  @throws {TypeError} When source or weights is not an array.
  @throws {RangeError} When the lengths differ, a weight is negative or not finite, or the weights add up to 0.
  */
  selectWeightedRandomElement<T>(source: readonly T[], weights: readonly number[]): T {
    if (!isArray(source) || !isArray(weights)) {
      throw new TypeError('selectWeightedRandomElement: source and weights must be arrays');
    }

    if (source.length !== weights.length) {
      throw new RangeError('selectWeightedRandomElement: source and weights must have the same length');
    }

    let total = 0;
    for (const weight of weights) {
      if (typeof weight !== 'number' || !(weight >= 0 && weight < Infinity)) {
        throw new RangeError('selectWeightedRandomElement: every weight must be a finite number of 0 or more');
      }

      total += weight;
    }

    if (!(total > 0 && total < Infinity)) {
      throw new RangeError('selectWeightedRandomElement: the weights must add up to more than 0');
    }

    const target = this.random() * total;
    let chosen = 0;
    let cumulative = 0;
    for (const [index, weight] of weights.entries()) {
      if (!(weight > 0)) {
        continue;
      }

      chosen = index;
      cumulative += weight;
      // The running sum ends at the total, which is above the target, so a positive weight always stops the loop.
      if (target < cumulative) {
        break;
      }
    }

    return source[chosen]!;
  }

  /**
  `amount` different integers from [0, max), or from [min, max) with three arguments, in random order. Takes time and memory in proportion to the amount, whatever the size of the range.

  @throws {TypeError} When a bound is not a finite number.
  @throws {RangeError} When amount is not a whole number of 0 or more, is larger than the number of integers in the range, or the range holds more than 2^32 integers.
  */
  getUniqueRandomIntegers(amount: number, max: number): number[];
  getUniqueRandomIntegers(amount: number, min: number, max: number): number[];
  getUniqueRandomIntegers(amount: number, first: number, second?: number): number[] {
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new RangeError('getUniqueRandomIntegers: amount must be a whole number of 0 or more');
    }

    const [min, max] = toRange('getUniqueRandomIntegers', first, second);
    const start = Math.ceil(min);
    const span = Math.max(Math.floor(max) - start, 0);
    if (span > MAX_SPAN) {
      throw new RangeError(`getUniqueRandomIntegers: the range holds ${span} integers, more than the 2^32 that one draw can reach`);
    }

    if (amount > span) {
      throw new RangeError(`getUniqueRandomIntegers: cannot pick ${amount} different integers from a range that holds ${span}`);
    }

    // A Fisher-Yates shuffle of the range that stores only the positions it has moved.
    const moved = new Map<number, number>();
    const result: number[] = [];
    for (let index = 0; index < amount; index++) {
      const pick = index + Math.floor(this.random() * (span - index));
      result.push((moved.get(pick) ?? pick) + start);
      moved.set(pick, moved.get(index) ?? index);
    }

    return result;
  }

  /**
  The elements in random order (Fisher-Yates). An array is copied unless `copy` is false, which shuffles it in place. A string is shuffled by code point and returned as a new string. A missing value is returned as it is.
  */
  shuffle(text: string, copy?: boolean): string;
  shuffle<T>(array: readonly T[]): T[];
  shuffle<T>(array: T[], copy: boolean): T[];
  shuffle<T>(array: readonly T[] | string, copy = true): T[] | string {
    // 1.1.4 returned any falsy value, such as null or an empty string, as it was.
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!array) {
      return array;
    }

    const isText = typeof array === 'string';
    // A string splits into code points; an array is copied, or shuffled in place when copy is false.
    const result: unknown[] = isText || copy ? [...array as Iterable<unknown>] : array as unknown[];
    let {length} = result;
    while (length > 0) {
      const random = Math.floor(this.random() * length);
      length -= 1;
      const temporary = result[length];
      result[length] = result[random];
      result[random] = temporary;
    }

    return isText ? result.join('') : result as T[];
  }

  /**
  True with probability picks / itemCount: `random() * itemCount < picks`.
  */
  chooseBooleanRandomlyWithProbability(itemCount: number, picks = 1): boolean {
    return this.random() * itemCount < picks;
  }

  /**
  Where this generator is in its sequence, as plain data for `SeededRandomUtilities.fromState()`.

  @throws {TypeError} When the instance has no seed (it uses Math.random) or draws from an object passed to the constructor.
  */
  getState(): GeneratorState {
    if (this.#generator === undefined) {
      throw new TypeError('getState: only a generator created from a seed or a state has a state to export');
    }

    return {algorithm: this.#algorithm, state: this.#generator.state()};
  }

  /**
  An integer in [min, max): 1.1.4's name and argument order, with its behaviour for every input.

  @deprecated Use `getRandomInteger(min, max)`: the same numbers, with the arguments in (min, max) order. Removed in 3.0.0.
  */
  getRandomIntegar(max: number, min = 0): number {
    const minCeil = Math.ceil(min);
    const maxFloor = Math.floor(max);
    return Math.floor(this.random() * (maxFloor - minCeil)) + minCeil;
  }

  /**
  A number in [min, max): 1.1.4's name and argument order, with its behaviour for every input.

  @deprecated Use `getRandomFloat(min, max)`: the same numbers, with the arguments in (min, max) order. Removed in 3.0.0.
  */
  getRandomArbitrary(max: number, min = 0): number {
    return (this.random() * (max - min)) + min;
  }

  /**
  An integer in [min, max]: 1.1.4's name and argument order, with its behaviour for every input.

  @deprecated Use `getRandomIntegerInclusive(min, max)`: the same numbers, with the arguments in (min, max) order. Removed in 3.0.0.
  */
  getRandomIntInclusive(max: number, min = 0): number {
    const minCeil = Math.ceil(min);
    const maxFloor = Math.floor(max);
    return Math.floor(this.random() * (maxFloor - minCeil + 1)) + minCeil;
  }

  /**
  Up to `amount` different integers from [0, maxValue] (maxValue included), as 1.1.4 drew them: it shuffles the whole range, so it takes time and memory in proportion to maxValue.

  @deprecated Use `getUniqueRandomIntegers(amount, 0, maxValue + 1)`, which takes time and memory in proportion to the amount (a different sequence). Removed in 3.0.0.
  */
  generateRandomArrayOfUniqueIntegers(amount: number, maxValue: number, skipShuffle = false): number[] {
    if (amount < 0) {
      throw new RangeError('Parameter amount cannot be negative');
    }

    const uniqueConsecutiveNumbers: number[] = [];
    for (let index = 0; index <= maxValue; index++) {
      uniqueConsecutiveNumbers.push(index);
    }

    if (!skipShuffle) {
      this.shuffle(uniqueConsecutiveNumbers, false);
    }

    return this.selectUniqueRandomElements(uniqueConsecutiveNumbers, amount);
  }
}
