/*
Edge behaviour of the published 2.0.0 that the golden recordings do not reach. The independent review of the 2026-09-29 retrofit planted each of these changes in a copy of dist/ and every other suite still passed. Expected values are 2.0.0's answers, read from the npm package; they are pinned here rather than added to a recording, which never changes.
*/
import assert from 'node:assert/strict';
import {describe, test} from 'node:test';
import {builds} from '../helpers/builds.js';

for (const {name, lib} of builds) {
  const {default: SeededRandomUtilities} = lib;

  describe(`2.0.0 edge behaviour outside the recordings (${name} build)`, () => {
    test('an algorithm name that is an Object.prototype key is refused', () => {
      for (const algorithm of ['toString', 'constructor', 'hasOwnProperty', '__proto__']) {
        assert.throws(() => new SeededRandomUtilities('1234', algorithm), {name: 'TypeError', message: `Unknown algorithm "${algorithm}"; use one of sfc32, mulberry32, xoshiro128ss, mulberry32Reference, xoshiro128ssReference`});
      }
    });

    test('getRandomBool refuses a probability just above 1', () => {
      assert.throws(() => new SeededRandomUtilities('1234').getRandomBool(1.000001), {name: 'RangeError', message: 'getRandomBool: probability must be from 0 to 1, not 1.000001'});
    });

    test('getRandomString accepts the largest length, 2^24', () => {
      assert.equal(new SeededRandomUtilities('1234').getRandomString(2 ** 24, 'a').length, 2 ** 24);
    });

    test('fromState accepts a mulberry32 counter far beyond 2^53, as 1.1.4 kept it', () => {
      const rng = SeededRandomUtilities.fromState({algorithm: 'mulberry32', state: [2 ** 70]});
      assert.equal(rng.random(), 0.0032371049746870995);
      assert.deepEqual(rng.getState(), {algorithm: 'mulberry32', state: [1.180591620719243e21]});
    });

    test('getUniqueRandomIntegers of amount 0 returns [] even for an empty range far from 0', () => {
      assert.deepEqual(new SeededRandomUtilities('1234').getUniqueRandomIntegers(0, 2 ** 60, 2 ** 60), []);
    });

    test('shuffle returns a falsy argument unchanged, as 1.1.4 did', () => {
      const rng = new SeededRandomUtilities('1234');
      assert.equal(rng.shuffle(0), 0);
      assert.equal(rng.random(), new SeededRandomUtilities('1234').random(), 'and draws nothing');
    });
  });
}
