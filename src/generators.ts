/*!
 * seeded-random-utilities: the generators and the seed hash.
 *
 * sfc32, mulberry32, xoshiro128** version 1.0 and the xfnv1a seed hash are ported from
 * rand-seed 0.1.5 (https://github.com/michaeldzjap/rand-seed) with their arithmetic
 * unchanged, so every sequence matches seeded-random-utilities 1.1.4. rand-seed took them
 * from bryc's public-domain JavaScript ports (https://github.com/bryc/code, jshash/PRNGs.md).
 * The algorithms are by Chris Doty-Humphrey (sfc32, from PractRand), Tommy Ettinger
 * (mulberry32) and David Blackman and Sebastiano Vigna (xoshiro128**), all in the public
 * domain. rand-seed's licence:
 *
 * MIT License
 *
 * Copyright (c) 2020 Michael Dzjaparidze
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
The generator algorithms. The values are plain strings, so `'sfc32'` works wherever `PRNG.sfc32` does. Frozen, so no code can change what a name means.
*/
export const PRNG = Object.freeze({
  /**
  Sfc32 (Chris Doty-Humphrey's Small Fast Counting generator, from PractRand): 128-bit state. The default, and the recommended choice. As in 1.1.4.
  */
  sfc32: 'sfc32',
  /**
  Mulberry32 (Tommy Ettinger): 32-bit state, as in 1.1.4. Its counter is a JavaScript number that is never wrapped, so after about 4.9 million draws its low bits round away; use `mulberry32Reference` or `sfc32` for long streams.
  */
  mulberry32: 'mulberry32',
  /**
  Xoshiro128** version 1.0, as in 1.1.4: it scrambles the first state word, which the authors corrected in version 1.1 (`xoshiro128ssReference`). Kept so stored seeds reproduce.
  */
  xoshiro128ss: 'xoshiro128ss',
  /**
  Mulberry32 with the wrapping 32-bit counter of Tommy Ettinger's reference code. The same numbers as `mulberry32` for the first 4.9 million draws. New in 2.0.0.
  */
  mulberry32Reference: 'mulberry32Reference',
  /**
  Xoshiro128** 1.1, the authors' reference algorithm (the same numbers as rand-seed 2.0.0 and later give for `xoshiro128ss`). New in 2.0.0.
  */
  xoshiro128ssReference: 'xoshiro128ssReference',
} as const);

/**
The name of a generator algorithm: one of the values of `PRNG`.
*/
// eslint-disable-next-line @typescript-eslint/no-redeclare, @typescript-eslint/naming-convention -- one name for the value and the type, as 1.1.4's enum had
export type PRNG = (typeof PRNG)[keyof typeof PRNG];

/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-redeclare, @typescript-eslint/naming-convention -- a type-only namespace, erased at build time and merged with the const above, whose members are named like the values */
/**
Lets code written against 1.1.4's enum keep using `PRNG.sfc32` and the rest as types.
*/
export declare namespace PRNG {
  type sfc32 = 'sfc32';
  type mulberry32 = 'mulberry32';
  type xoshiro128ss = 'xoshiro128ss';
  type mulberry32Reference = 'mulberry32Reference';
  type xoshiro128ssReference = 'xoshiro128ssReference';
}
/* eslint-enable @typescript-eslint/no-namespace, @typescript-eslint/no-redeclare, @typescript-eslint/naming-convention */

/**
A source of numbers in [0, 1) that can report its position as plain numbers.
*/
export type Generator = {
  next(): number;
  state(): number[];
};

const TWO_TO_THE_32 = 4_294_967_296;

/**
How many 32-bit words of state each algorithm has.
*/
const STATE_WORDS: Readonly<Record<PRNG, number>> = {
  sfc32: 4,
  mulberry32: 1,
  xoshiro128ss: 4,
  mulberry32Reference: 1,
  xoshiro128ssReference: 4,
};

/**
Bryc's xfnv1a: FNV-1a over the UTF-16 code units of the seed, then a xorshift-and-add finalizer that yields one 32-bit word per call. The words seed the generator.
*/
export function seedWords(seed: string, count: number): number[] {
  let h = 2_166_136_261 >>> 0;
  for (let index = 0; index < seed.length; index++) {
    // Code units, not code points: the hash 1.1.4 used.
    // eslint-disable-next-line unicorn/prefer-code-point
    h = Math.imul(h ^ seed.charCodeAt(index), 16_777_619);
  }

  const words: number[] = [];
  for (let index = 0; index < count; index++) {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    words.push((h += h << 5) >>> 0);
  }

  return words;
}

class Sfc32 implements Generator {
  #a: number;
  #b: number;
  #c: number;
  #d: number;

  constructor(words: readonly number[]) {
    const [a = 0, b = 0, c = 0, d = 0] = words;
    this.#a = a;
    this.#b = b;
    this.#c = c;
    this.#d = d;
  }

  // The counter is incremented before it is added, as in bryc's port: the same generator as PractRand's with the counter one higher.
  next(): number {
    this.#a >>>= 0;
    this.#b >>>= 0;
    this.#c >>>= 0;
    this.#d >>>= 0;
    let t = (this.#a + this.#b) | 0;
    this.#a = this.#b ^ (this.#b >>> 9);
    this.#b = (this.#c + (this.#c << 3)) | 0;
    this.#c = (this.#c << 21) | (this.#c >>> 11);
    this.#d = (this.#d + 1) | 0;
    t = (t + this.#d) | 0;
    this.#c = (this.#c + t) | 0;
    return (t >>> 0) / TWO_TO_THE_32;
  }

  state(): number[] {
    return [this.#a >>> 0, this.#b >>> 0, this.#c >>> 0, this.#d >>> 0];
  }
}

class Mulberry32 implements Generator {
  #a: number;
  readonly #wraps: boolean;

  constructor(words: readonly number[], wraps: boolean) {
    const [a = 0] = words;
    this.#a = a;
    this.#wraps = wraps;
  }

  next(): number {
    // 1.1.4 adds to a JavaScript number without wrapping it; past 2^53 the sum rounds. The reference wraps at 2^32, as the C code's uint32_t does.
    let t = this.#wraps ? (this.#a = (this.#a + 0x6D_2B_79_F5) | 0) : (this.#a += 0x6D_2B_79_F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / TWO_TO_THE_32;
  }

  state(): number[] {
    return [this.#wraps ? this.#a >>> 0 : this.#a];
  }
}

class Xoshiro128StarStar implements Generator {
  #a: number;
  #b: number;
  #c: number;
  #d: number;
  readonly #reference: boolean;

  constructor(words: readonly number[], reference: boolean) {
    const [a = 0, b = 0, c = 0, d = 0] = words;
    this.#a = a;
    this.#b = b;
    this.#c = c;
    this.#d = d;
    this.#reference = reference;
  }

  next(): number {
    const t = this.#b << 9;
    // Version 1.0 (1.1.4) scrambles the first state word; version 1.1 scrambles the second.
    let r = (this.#reference ? this.#b : this.#a) * 5;
    r = ((r << 7) | (r >>> 25)) * 9;
    this.#c ^= this.#a;
    this.#d ^= this.#b;
    this.#b ^= this.#c;
    this.#a ^= this.#d;
    this.#c ^= t;
    this.#d = (this.#d << 11) | (this.#d >>> 21);
    return (r >>> 0) / TWO_TO_THE_32;
  }

  state(): number[] {
    return [this.#a >>> 0, this.#b >>> 0, this.#c >>> 0, this.#d >>> 0];
  }
}

/**
A generator of the given algorithm at the given position (state words, as `Generator.state()` returns them).
*/
export function createGenerator(algorithm: PRNG, words: readonly number[]): Generator {
  switch (algorithm) {
    case 'sfc32': {
      return new Sfc32(words);
    }

    case 'mulberry32':
    case 'mulberry32Reference': {
      return new Mulberry32(words, algorithm === 'mulberry32Reference');
    }

    case 'xoshiro128ss':
    case 'xoshiro128ssReference': {
      return new Xoshiro128StarStar(words, algorithm === 'xoshiro128ssReference');
    }
  }
}

/**
A generator seeded from a string, as 1.1.4 seeded it.
*/
export function generatorFromSeed(algorithm: PRNG, seed: string): Generator {
  return createGenerator(algorithm, seedWords(seed, STATE_WORDS[algorithm]));
}

const isWord = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) < TWO_TO_THE_32;

/**
Whether `words` is a state the algorithm can resume from: the right number of unsigned 32-bit integers (1.1.4's mulberry32 counter may be any non-negative integer), and never all zero for xoshiro128**, which would then return 0 for ever.
*/
export function isValidState(algorithm: PRNG, words: readonly unknown[]): words is number[] {
  if (words.length !== STATE_WORDS[algorithm]) {
    return false;
  }

  // A for-of loop, not every(): every() skips the holes of a sparse array, for-of reads them as undefined.
  for (const word of words) {
    if (!(algorithm === 'mulberry32' ? isLegacyMulberryCounter(word) : isWord(word))) {
      return false;
    }
  }

  const isXoshiro = algorithm === 'xoshiro128ss' || algorithm === 'xoshiro128ssReference';
  return !isXoshiro || words.some(word => word !== 0);
}

// 1.1.4's mulberry32 counter passes 2^53 after about 4.9 million draws, and that state must round-trip too, so not isSafeInteger.
// From 2^84 on, adding the increment no longer changes it, so no generator can have got there.
// eslint-disable-next-line unicorn/prefer-number-is-safe-integer
const isLegacyMulberryCounter = (value: unknown): boolean => Number.isInteger(value) && (value as number) >= 0 && (value as number) < 2 ** 84;

/**
The name as a `PRNG` value, or undefined when it is not one.
*/
export function toAlgorithm(name: unknown): PRNG | undefined {
  return typeof name === 'string' && Object.hasOwn(STATE_WORDS, name) ? name as PRNG : undefined;
}

/**
The unseeded source: Math.random, as 1.1.4 used when no seed was given.
*/
export const unseeded = {
  next: (): number => Math.random(),
};
