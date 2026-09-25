/*
Compile-time checks on the published declaration files. The runner copies this file into each TypeScript fixture as index.ts, so it is checked under that fixture's module and resolution settings (ESM and CommonJS under nodenext, bundler, node10).
*/
import SeededRandomUtilities, {
  PRNG,
  Rand,
  SeededRandomUtilities as Named,
  type GeneratorState,
  type RandomSource,
  type RandomUtilities,
  type Seed,
} from 'seeded-random-utilities';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

const rng = new SeededRandomUtilities('seed');

export type Checks = [
  // The default export is the named export.
  Expect<Equal<typeof SeededRandomUtilities, typeof Named>>,
  Expect<Equal<PRNG, 'sfc32' | 'mulberry32' | 'xoshiro128ss' | 'mulberry32Reference' | 'xoshiro128ssReference'>>,
  // PRNG members still work as types, as with 1.1.4's enum.
  Expect<Equal<PRNG.sfc32, 'sfc32'>>,
  Expect<Equal<PRNG.xoshiro128ss, 'xoshiro128ss'>>,
  Expect<Equal<Seed, string | number>>,
  Expect<Equal<ReturnType<typeof rng.getState>, GeneratorState>>,
  Expect<Equal<ReturnType<typeof rng.selectRandomElement<string>>, string | undefined>>,
];

// Shuffle: a string gives a string, an array gives T[], and readonly arrays are accepted when copying.
const shuffledText: string = rng.shuffle('abc');
const shuffledNumbers: number[] = rng.shuffle([1, 2, 3]);
const inPlace: string[] = rng.shuffle(['a', 'b'], false);
const readonlyInput: readonly number[] = [1, 2];
const fromReadonly: number[] = rng.shuffle(readonlyInput);

// Algorithms: members of PRNG and plain strings; anything else is a type error.
const byMember = new SeededRandomUtilities(42, PRNG.xoshiro128ssReference);
const byString = new SeededRandomUtilities('seed', 'mulberry32Reference');
// @ts-expect-error -- not an algorithm name
const wrongAlgorithm = new SeededRandomUtilities('seed', 'SFC32');

// Seeds: a string, a number, any RandomSource, or none.
const source: RandomSource = new Rand('seed', PRNG.sfc32);
const fromSource = new SeededRandomUtilities(source);
const unseeded = new SeededRandomUtilities();

// The new names, and the deprecated 1.1.4 names, which still compile.
const numbers: number[] = [
  rng.getRandomInteger(10),
  rng.getRandomInteger(1, 7),
  rng.getRandomIntegerInclusive(6),
  rng.getRandomIntegerInclusive(1, 6),
  rng.getRandomFloat(1),
  rng.getRandomFloat(-1, 1),
  rng.getRandomIntegar(10, 5),
  rng.getRandomArbitrary(10),
  rng.getRandomIntInclusive(6, 1),
  ...rng.getUniqueRandomIntegers(3, 10),
  ...rng.getUniqueRandomIntegers(3, 5, 15),
  ...rng.generateRandomArrayOfUniqueIntegers(3, 9),
];
const text: string = rng.getRandomChar() + rng.getRandomChar('xyz') + rng.getRandomString(8) + rng.getRandomString(8, '01');
const flags: boolean[] = [rng.getRandomBool(), rng.getRandomBool(0.3), rng.chooseBooleanRandomlyWithProbability(10, 3)];
const weighted: string = rng.selectWeightedRandomElement(['a', 'b'], [1, 3]);
const picks: string[] = rng.selectUniqueRandomElements(['a', 'b', 'c'], 2);

// 1.1.4 code that forwarded an optional flag, wrote SeededRandomUtilities.default for Node's ES module loader, or augmented the interface still compiles.
function forwardCopy<T>(array: T[], copy?: boolean): T[] {
  return rng.shuffle(array, copy);
}

// eslint-disable-next-line new-cap -- the property name 1.1.4 code used
const viaDefault: SeededRandomUtilities = new SeededRandomUtilities.default('seed');

declare module 'seeded-random-utilities' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- augmentation needs an interface
  interface RandomUtilities {
    augmentedByConsumer?: true;
  }
}

// State round trip, the interface, and random as a plain function value.
const resumed: SeededRandomUtilities = SeededRandomUtilities.fromState(rng.getState());
const asInterface: RandomUtilities = rng;
const randomFunction: () => number = rng.random;

export {
  shuffledText,
  shuffledNumbers,
  inPlace,
  fromReadonly,
  byMember,
  byString,
  wrongAlgorithm,
  fromSource,
  unseeded,
  numbers,
  text,
  flags,
  weighted,
  picks,
  resumed,
  asInterface,
  randomFunction,
  forwardCopy,
  viaDefault,
};
