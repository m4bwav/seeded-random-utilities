/*
The generators against implementations that share no code with them: BigInt versions written from the authors' reference C code, and rand-seed 3.0.0's streams (rand-seed-3.0.0.json, captured by capture-rand-seed-3.0.0.cjs from the npm package).
*/
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describe, test} from 'node:test';
import {builds} from '../helpers/builds.js';

const randSeed3 = JSON.parse(readFileSync(new URL('../golden/rand-seed-3.0.0.json', import.meta.url), 'utf8'));

const u32 = value => BigInt.asUintN(32, value);
const rotl = (value, bits) => u32((value << BigInt(bits)) | (value >> BigInt(32 - bits)));
const toUnit = value => Number(value) / 2 ** 32;

// PractRand's sfc32::raw32: tmp = a + b + counter++.
function sfc32Reference(words) {
  let [a, b, c, counter] = words.map(BigInt);
  return () => {
    const temporary = u32(a + b + counter);
    counter = u32(counter + 1n);
    a = b ^ (b >> 9n);
    b = u32(c + (c << 3n));
    c = u32(rotl(c, 21) + temporary);
    return toUnit(temporary);
  };
}

// Tommy Ettinger's mulberry32, with C's uint32_t arithmetic.
function mulberry32Reference([word]) {
  let x = BigInt(word);
  return () => {
    x = u32(x + 0x6D_2B_79_F5n);
    let z = x;
    z = u32((z ^ (z >> 15n)) * (z | 1n));
    z ^= u32(z + u32((z ^ (z >> 7n)) * (z | 61n)));
    return toUnit(u32(z ^ (z >> 14n)));
  };
}

// Prng.di.unimi.it/xoshiro128starstar.c: version 1.1 scrambles s[1]; version 1.0 scrambled s[0].
function xoshiro128StarStarReference(words, scrambled) {
  const s = words.map(BigInt);
  return () => {
    const result = u32(rotl(u32(s[scrambled] * 5n), 7) * 9n);
    const t = u32(s[1] << 9n);
    s[2] ^= s[0];
    s[3] ^= s[1];
    s[1] ^= s[2];
    s[0] ^= s[3];
    s[2] ^= t;
    s[3] = rotl(s[3], 11);
    return toUnit(result);
  };
}

const ORACLES = {
  // 1.1.4's sfc32 adds the counter after incrementing it: PractRand's generator with the counter one higher.
  sfc32: ([a, b, c, d]) => sfc32Reference([a, b, c, (d + 1) % 2 ** 32]),
  // The same as the reference until the unwrapped counter passes 2^53, far beyond these draws.
  mulberry32: mulberry32Reference,
  mulberry32Reference,
  xoshiro128ss: words => xoshiro128StarStarReference(words, 0),
  xoshiro128ssReference: words => xoshiro128StarStarReference(words, 1),
};

const SEEDS = ['1234', '', 'seeded-random-utilities', '😀🎲 ünïcödé'];

for (const {name, lib} of builds) {
  const {default: SeededRandomUtilities} = lib;

  describe(`generators (${name} build)`, () => {
    for (const [algorithm, oracle] of Object.entries(ORACLES)) {
      test(`${algorithm} matches its reference algorithm for 2000 draws from each seed`, () => {
        for (const seed of SEEDS) {
          const rng = new SeededRandomUtilities(seed, algorithm);
          const expected = oracle(rng.getState().state);
          for (let draw = 0; draw < 2000; draw++) {
            assert.equal(rng.random(), expected(), `${algorithm}, seed ${JSON.stringify(seed)}, draw ${draw}`);
          }
        }
      });
    }

    test('xoshiro128ssReference and mulberry32 give rand-seed 3.0.0\'s numbers', () => {
      const ours = {xoshiro128ss: 'xoshiro128ssReference', mulberry32: 'mulberry32'};
      for (const {seed, algorithm, results} of randSeed3.cases) {
        const rng = new SeededRandomUtilities(seed, ours[algorithm]);
        assert.deepEqual(Array.from({length: results.length}, () => rng.random()), results, `${algorithm}, seed ${JSON.stringify(seed)}`);
      }
    });

    test('mulberry32 keeps 1.1.4\'s unwrapped counter: it departs from the reference once the counter passes 2^53', () => {
      const increment = 0x6D_2B_79_F5;
      const counter = 2 ** 53 - increment;
      const legacy = SeededRandomUtilities.fromState({algorithm: 'mulberry32', state: [counter]});
      const reference = SeededRandomUtilities.fromState({algorithm: 'mulberry32Reference', state: [counter % 2 ** 32]});
      assert.equal(legacy.random(), reference.random(), 'the counter reaches exactly 2^53');
      assert.notEqual(legacy.random(), reference.random(), 'past 2^53 an odd increment rounds');
    });

    test('mulberry32Reference wraps its counter at 2^32, as the C code does', () => {
      const rng = SeededRandomUtilities.fromState({algorithm: 'mulberry32Reference', state: [2 ** 32 - 1]});
      const expected = mulberry32Reference([2 ** 32 - 1]);
      for (let draw = 0; draw < 100; draw++) {
        assert.equal(rng.random(), expected());
      }

      assert.ok(rng.getState().state[0] < 2 ** 32);
    });
  });
}
