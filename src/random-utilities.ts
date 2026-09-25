import type {PRNG} from './generators.ts';

/**
A seed: a string, or a finite number, which is hashed as `String(number)`, so `42` and `'42'` give the same sequence.
*/
export type Seed = string | number;

/**
Anything whose `next()` returns numbers in [0, 1): `Rand`, rand-seed's `Rand` of any version, or a generator of your own.
*/
export type RandomSource = {
  next(): number;
};

/**
Where a seeded generator is in its sequence. Plain data, safe to `JSON.stringify` and store; `SeededRandomUtilities.fromState()` resumes from it.
*/
export type GeneratorState = {
  readonly algorithm: PRNG;
  readonly state: readonly number[];
};

/**
Every instance method of `SeededRandomUtilities`, which documents them.
*/
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- an interface, as in 1.1.4, so code that augments it keeps compiling
export interface RandomUtilities {
  random(): number;
  getRandom(): number;
  getRandomInteger(max: number): number;
  getRandomInteger(min: number, max: number): number;
  getRandomIntegerInclusive(max: number): number;
  getRandomIntegerInclusive(min: number, max: number): number;
  getRandomFloat(max: number): number;
  getRandomFloat(min: number, max: number): number;
  getRandomBool(probability?: number): boolean;
  getRandomChar(pool?: string): string;
  getRandomString(length: number, pool?: string): string;
  selectRandomElement<T>(source: readonly T[]): T | undefined;
  selectUniqueRandomElements<T>(source: readonly T[], picks: number): T[];
  selectWeightedRandomElement<T>(source: readonly T[], weights: readonly number[]): T;
  getUniqueRandomIntegers(amount: number, max: number): number[];
  getUniqueRandomIntegers(amount: number, min: number, max: number): number[];
  shuffle(text: string, copy?: boolean): string;
  shuffle<T>(array: readonly T[]): T[];
  shuffle<T>(array: T[], copy?: boolean): T[];
  chooseBooleanRandomlyWithProbability(itemCount: number, picks?: number): boolean;
  getState(): GeneratorState;
  /**
  @deprecated Use `getRandomInteger(min, max)`: the same numbers, with the arguments in (min, max) order.
  */
  getRandomIntegar(max: number, min?: number): number;
  /**
  @deprecated Use `getRandomFloat(min, max)`: the same numbers, with the arguments in (min, max) order.
  */
  getRandomArbitrary(max: number, min?: number): number;
  /**
  @deprecated Use `getRandomIntegerInclusive(min, max)`: the same numbers, with the arguments in (min, max) order.
  */
  getRandomIntInclusive(max: number, min?: number): number;
  /**
  @deprecated Use `getUniqueRandomIntegers(amount, 0, maxValue + 1)`, which takes time and memory in proportion to the amount, not the range (a different sequence).
  */
  generateRandomArrayOfUniqueIntegers(amount: number, maxValue: number, skipShuffle?: boolean): number[];
}
