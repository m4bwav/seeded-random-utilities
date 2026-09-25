/*
Nothing is badly skewed. The seeds are fixed, so these checks are deterministic: they cannot flake, and a failure means the numbers changed.
The chi-square limits are the 0.1 percent critical values, far above what a fair generator gives.
*/
import assert from 'node:assert/strict';
import {describe, test} from 'node:test';
import {builds} from '../helpers/builds.js';

const ALGORITHMS = ['sfc32', 'mulberry32', 'xoshiro128ss', 'mulberry32Reference', 'xoshiro128ssReference'];
const DRAWS = 100_000;

// Chi-square critical values at p = 0.001, by degrees of freedom.
const CRITICAL = {4: 18.47, 9: 27.88};

function chiSquare(counts, expected) {
  return counts.reduce((sum, count) => sum + (((count - expected) ** 2) / expected), 0);
}

for (const {name, lib} of builds) {
  const {default: SeededRandomUtilities} = lib;

  describe(`distribution (${name} build)`, () => {
    for (const algorithm of ALGORITHMS) {
      test(`${algorithm}: getRandomInteger(0, 10) fills ten buckets evenly`, () => {
        const rng = new SeededRandomUtilities('distribution', algorithm);
        const counts = Array.from({length: 10}, () => 0);
        for (let draw = 0; draw < DRAWS; draw++) {
          counts[rng.getRandomInteger(0, 10)]++;
        }

        assert.ok(chiSquare(counts, DRAWS / 10) < CRITICAL[9], counts.join(' '));
      });
    }

    test('getRandomBool(0.3) is true about 30 percent of the time', () => {
      const rng = new SeededRandomUtilities('bool');
      let hits = 0;
      for (let draw = 0; draw < DRAWS; draw++) {
        hits += rng.getRandomBool(0.3) ? 1 : 0;
      }

      assert.ok(Math.abs((hits / DRAWS) - 0.3) < 0.01, String(hits));
    });

    test('selectWeightedRandomElement follows the weights', () => {
      const rng = new SeededRandomUtilities('weights');
      const counts = {
        a: 0, b: 0, c: 0, never: 0,
      };
      for (let draw = 0; draw < DRAWS; draw++) {
        counts[rng.selectWeightedRandomElement(['a', 'b', 'never', 'c'], [1, 2, 0, 7])]++;
      }

      assert.equal(counts.never, 0);
      for (const [key, share] of [['a', 0.1], ['b', 0.2], ['c', 0.7]]) {
        assert.ok(Math.abs((counts[key] / DRAWS) - share) < 0.01, `${key}: ${counts[key]}`);
      }
    });

    test('getUniqueRandomIntegers(3, 10) picks every value equally often', () => {
      const rng = new SeededRandomUtilities('unique');
      const counts = Array.from({length: 10}, () => 0);
      const rounds = DRAWS / 3;
      for (let round = 0; round < rounds; round++) {
        for (const value of rng.getUniqueRandomIntegers(3, 10)) {
          counts[value]++;
        }
      }

      assert.ok(chiSquare(counts, (rounds * 3) / 10) < CRITICAL[9], counts.join(' '));
    });

    test('shuffle puts every element first equally often', () => {
      const rng = new SeededRandomUtilities('shuffle');
      const counts = Array.from({length: 5}, () => 0);
      const rounds = DRAWS / 5;
      for (let round = 0; round < rounds; round++) {
        counts[rng.shuffle([0, 1, 2, 3, 4])[0]]++;
      }

      assert.ok(chiSquare(counts, rounds / 5) < CRITICAL[4], counts.join(' '));
    });
  });
}
