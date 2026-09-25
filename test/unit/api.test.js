import assert from 'node:assert/strict';
import {describe, test} from 'node:test';
import {builds} from '../helpers/builds.js';

// The largest number a 32-bit draw gives: (2^32 - 1) / 2^32.
const HIGHEST = 4_294_967_295 / 4_294_967_296;

const ALGORITHMS = ['sfc32', 'mulberry32', 'xoshiro128ss', 'mulberry32Reference', 'xoshiro128ssReference'];

// A source that returns the given numbers in turn, then repeats the last one.
function fixed(...values) {
  let index = 0;
  return {next: () => values[Math.min(index++, values.length - 1)]};
}

function withMathRandom(value, run) {
  const original = Math.random;
  Math.random = () => value;
  try {
    return run();
  } finally {
    Math.random = original;
  }
}

for (const {name, lib} of builds) {
  const {default: SeededRandomUtilities, SeededRandomUtilities: Named, PRNG, Rand} = lib;
  const draws = (rng, count) => Array.from({length: count}, () => rng.random());

  describe(`exports and compatibility (${name} build)`, () => {
    test('the default export is the named class, and PRNG lists the five algorithms', () => {
      assert.equal(SeededRandomUtilities, Named);
      assert.deepEqual(Object.values(PRNG), ALGORITHMS);
      assert.equal(PRNG.sfc32, 'sfc32');
    });

    test('Rand gives the same numbers as the class, and the class accepts a Rand', () => {
      for (const algorithm of ALGORITHMS) {
        const rand = new Rand('1234', algorithm);
        const expected = draws(new SeededRandomUtilities('1234', algorithm), 5);
        assert.deepEqual(draws({random: () => rand.next()}, 5), expected);
        const fromRand = new SeededRandomUtilities(new Rand('1234', algorithm));
        assert.deepEqual(draws(fromRand, 5), expected);
      }
    });

    test('any object with next() is a source, and the algorithm argument is then ignored, as in 1.1.4', () => {
      const rng = new SeededRandomUtilities(fixed(0.25, 0.5));
      assert.deepEqual(draws(rng, 2), [0.25, 0.5]);
      assert.equal(new SeededRandomUtilities(fixed(0.25), 'nope').random(), 0.25);
    });

    test('random is bound, so it can be passed as a Math.random-style function', () => {
      const rng = new SeededRandomUtilities('bound');
      const {random} = rng;
      const expected = draws(new SeededRandomUtilities('bound'), 4);
      assert.deepEqual([random(), ...Array.from({length: 3}, rng.random)], expected);
    });

    test('a subclass that overrides random() still drives every method', () => {
      class Fixed extends SeededRandomUtilities {
        random() {
          return 0.5;
        }
      }

      const rng = new Fixed('ignored');
      assert.equal(rng.getRandomInteger(10), 5);
      assert.equal(rng.getRandom(), 0.5);
      const {random} = rng;
      assert.equal(random(), 0.5);
    });
  });

  describe(`seeds and algorithm names (${name} build)`, () => {
    test('a number seeds like its string (1.1.4 gave every number the sequence of the empty string)', () => {
      assert.deepEqual(draws(new SeededRandomUtilities(1234), 8), draws(new SeededRandomUtilities('1234'), 8));
      assert.equal(new Rand(0.5, 'mulberry32').next(), new Rand('0.5', 'mulberry32').next());
      assert.notDeepEqual(draws(new SeededRandomUtilities(1234), 8), draws(new SeededRandomUtilities(''), 8));
      assert.deepEqual(draws(new SeededRandomUtilities(-0), 4), draws(new SeededRandomUtilities('0'), 4));
    });

    test('the empty string is a seed, as in 1.1.4', () => {
      assert.deepEqual(draws(new SeededRandomUtilities(''), 8), draws(new SeededRandomUtilities(''), 8));
    });

    test('undefined and null mean Math.random, for the class and for Rand', () => {
      withMathRandom(0.125, () => {
        assert.equal(new SeededRandomUtilities().random(), 0.125);
        assert.equal(new SeededRandomUtilities(null).random(), 0.125);
        assert.equal(new SeededRandomUtilities(undefined, 'mulberry32').random(), 0.125);
        assert.equal(new Rand().next(), 0.125);
        assert.equal(new Rand(null, 'xoshiro128ss').next(), 0.125);
      });
    });

    test('undefined and null algorithms mean sfc32', () => {
      const expected = draws(new SeededRandomUtilities('x', 'sfc32'), 4);
      assert.deepEqual(draws(new SeededRandomUtilities('x'), 4), expected);
      assert.deepEqual(draws(new SeededRandomUtilities('x', null), 4), expected);
      assert.equal(new Rand('x', null).next(), expected[0]);
    });

    test('other seeds and unknown algorithms throw TypeError instead of falling back to Math.random', () => {
      for (const seed of [NaN, Infinity, true, ['1234'], {}, Symbol('seed'), 10n]) {
        assert.throws(() => new SeededRandomUtilities(seed), TypeError);
        assert.throws(() => new Rand(seed), TypeError);
      }

      for (const algorithm of ['SFC32', 'xoshiro128**', '', 0, {}]) {
        assert.throws(() => new SeededRandomUtilities('1234', algorithm), {name: 'TypeError', message: /Unknown algorithm/u});
        assert.throws(() => new Rand('1234', algorithm), TypeError);
        // Without a seed nothing is hashed, so the algorithm is not used or checked, as in 1.1.4.
        withMathRandom(0.5, () => assert.equal(new SeededRandomUtilities(undefined, algorithm).random(), 0.5));
      }
    });
  });

  describe(`integers and floats (${name} build)`, () => {
    test('getRandomInteger: [0, max) or [min, max), bounds rounded inwards', () => {
      assert.equal(new SeededRandomUtilities(fixed(0)).getRandomInteger(10), 0);
      assert.equal(new SeededRandomUtilities(fixed(HIGHEST)).getRandomInteger(10), 9);
      assert.equal(new SeededRandomUtilities(fixed(0)).getRandomInteger(-3, 3), -3);
      assert.equal(new SeededRandomUtilities(fixed(HIGHEST)).getRandomInteger(-3, 3), 2);
      assert.equal(new SeededRandomUtilities(fixed(HIGHEST)).getRandomInteger(1.5, 7.9), 6);
      assert.equal(new SeededRandomUtilities(fixed(HIGHEST)).getRandomInteger(0, 2 ** 32), 4_294_967_295);
    });

    test('getRandomIntegerInclusive: max is included', () => {
      assert.equal(new SeededRandomUtilities(fixed(HIGHEST)).getRandomIntegerInclusive(6), 6);
      assert.equal(new SeededRandomUtilities(fixed(0)).getRandomIntegerInclusive(1, 6), 1);
      assert.equal(new SeededRandomUtilities(fixed(HIGHEST)).getRandomIntegerInclusive(1, 6), 6);
      assert.equal(new SeededRandomUtilities(fixed(0.5)).getRandomIntegerInclusive(4, 4), 4);
    });

    test('integer ranges: empty, reversed, too wide or not numbers throw', () => {
      const rng = new SeededRandomUtilities('errors');
      for (const method of ['getRandomInteger', 'getRandomIntegerInclusive']) {
        assert.throws(() => rng[method](NaN), {name: 'TypeError', message: /finite numbers/u});
        assert.throws(() => rng[method]('10'), TypeError);
        assert.throws(() => rng[method](1, Infinity), TypeError);
        assert.throws(() => rng[method](10, 0), {name: 'RangeError', message: /no integer/u});
        assert.throws(() => rng[method](-(2 ** 32), 2 ** 32), {name: 'RangeError', message: /2\^32/u});
      }

      assert.throws(() => rng.getRandomInteger(5, 5), RangeError);
      assert.throws(() => rng.getRandomInteger(0.2, 0.8), RangeError);
      assert.throws(() => rng.getRandomIntegerInclusive(0.2, 0.8), RangeError);
    });

    test('getRandomFloat: [0, max) or [min, max); min above max, a range wider than a number, or non-numbers throw', () => {
      assert.equal(new SeededRandomUtilities(fixed(0.5)).getRandomFloat(10), 5);
      assert.equal(new SeededRandomUtilities(fixed(0.5)).getRandomFloat(-10, 10), 0);
      assert.equal(new SeededRandomUtilities(fixed(0.5)).getRandomFloat(3, 3), 3);
      const rng = new SeededRandomUtilities('errors');
      assert.throws(() => rng.getRandomFloat(10, 5), RangeError);
      assert.throws(() => rng.getRandomFloat(-Number.MAX_VALUE, Number.MAX_VALUE), RangeError);
      assert.throws(() => rng.getRandomFloat('1'), TypeError);
    });

    test('getRandomBool(probability): random() >= 1 - probability, so 0.5 and no argument agree', () => {
      for (const value of [0, 0.25, 0.5, 0.75, HIGHEST]) {
        const isExpected = value >= 0.5;
        assert.equal(new SeededRandomUtilities(fixed(value)).getRandomBool(), isExpected);
        assert.equal(new SeededRandomUtilities(fixed(value)).getRandomBool(0.5), isExpected);
        assert.equal(new SeededRandomUtilities(fixed(value)).getRandomBool(0), false);
        assert.equal(new SeededRandomUtilities(fixed(value)).getRandomBool(1), true);
      }

      assert.equal(new SeededRandomUtilities(fixed(0.75)).getRandomBool(0.3), true);
      assert.equal(new SeededRandomUtilities(fixed(0.69)).getRandomBool(0.3), false);
      const rng = new SeededRandomUtilities('errors');
      assert.throws(() => rng.getRandomBool('0.5'), TypeError);
      assert.throws(() => rng.getRandomBool(NaN), TypeError);
      assert.throws(() => rng.getRandomBool(-0.1), RangeError);
      assert.throws(() => rng.getRandomBool(1.1), RangeError);
    });

    test('chooseBooleanRandomlyWithProbability: random() * itemCount < picks', () => {
      assert.equal(new SeededRandomUtilities(fixed(0.29)).chooseBooleanRandomlyWithProbability(10, 3), true);
      assert.equal(new SeededRandomUtilities(fixed(0.3)).chooseBooleanRandomlyWithProbability(10, 3), false);
      assert.equal(new SeededRandomUtilities(fixed(0.09)).chooseBooleanRandomlyWithProbability(10), true);
    });
  });

  describe(`characters and strings (${name} build)`, () => {
    test('getRandomChar: 1.1.4\'s 81-character pool by default, any pool by code point', () => {
      assert.equal(new SeededRandomUtilities(fixed(0)).getRandomChar(), 'a');
      assert.equal(new SeededRandomUtilities(fixed(HIGHEST)).getRandomChar(), ']');
      assert.equal(new SeededRandomUtilities(fixed(HIGHEST)).getRandomChar('ab😀'), '😀');
      assert.equal(new SeededRandomUtilities(fixed(0.5)).getRandomChar('xyz'), 'y');
      const rng = new SeededRandomUtilities('errors');
      assert.throws(() => rng.getRandomChar(''), RangeError);
      assert.throws(() => rng.getRandomChar(5), TypeError);
    });

    test('getRandomString: each character drawn as getRandomChar draws it', () => {
      const expected = Array.from({length: 12}, (rng => () => rng.getRandomChar())(new SeededRandomUtilities('ids'))).join('');
      assert.equal(new SeededRandomUtilities('ids').getRandomString(12), expected);
      assert.equal(new SeededRandomUtilities('ids').getRandomString(0), '');
      assert.match(new SeededRandomUtilities('ids').getRandomString(20, '01'), /^[01]{20}$/u);
      assert.equal([...new SeededRandomUtilities('ids').getRandomString(5, '🎲🃏')].length, 5);
      const rng = new SeededRandomUtilities('errors');
      assert.throws(() => rng.getRandomString(-1), RangeError);
      assert.throws(() => rng.getRandomString(1.5), RangeError);
      assert.throws(() => rng.getRandomString(3, ''), RangeError);
      assert.throws(() => rng.getRandomString(3, ['a']), TypeError);
    });
  });

  describe(`picks and shuffles (${name} build)`, () => {
    test('selectRandomElement: undefined for an empty array; a missing array throws 1.1.4\'s message', () => {
      assert.equal(new SeededRandomUtilities('x').selectRandomElement([]), undefined);
      assert.ok(['a', 'b', 'c'].includes(new SeededRandomUtilities('x').selectRandomElement(['a', 'b', 'c'])));
      assert.throws(() => new SeededRandomUtilities('x').selectRandomElement(null), {name: 'TypeError', message: 'Parameter source is not set'});
    });

    test('selectUniqueRandomElements: distinct picks in their original order; all of them when picks exceeds the length', () => {
      const source = Array.from({length: 50}, (_, index) => index);
      const picked = new SeededRandomUtilities('order').selectUniqueRandomElements(source, 10);
      assert.equal(picked.length, 10);
      assert.deepEqual(picked, picked.toSorted((a, b) => a - b));
      assert.deepEqual(new SeededRandomUtilities('order').selectUniqueRandomElements(['a', 'b'], 5), ['a', 'b']);
      assert.throws(() => new SeededRandomUtilities('x').selectUniqueRandomElements(source, -1), {name: 'RangeError', message: 'Parameter picks cannot be negative'});
      assert.throws(() => new SeededRandomUtilities('x').selectUniqueRandomElements(undefined, 1), TypeError);
    });

    test('selectWeightedRandomElement: one draw, probability in proportion to weight, zero weights never chosen', () => {
      const items = ['none', 'a', 'none again', 'b'];
      const weights = [0, 1, 0, 3];
      assert.equal(new SeededRandomUtilities(fixed(0)).selectWeightedRandomElement(items, weights), 'a');
      assert.equal(new SeededRandomUtilities(fixed(0.2499)).selectWeightedRandomElement(items, weights), 'a');
      assert.equal(new SeededRandomUtilities(fixed(0.25)).selectWeightedRandomElement(items, weights), 'b');
      assert.equal(new SeededRandomUtilities(fixed(HIGHEST)).selectWeightedRandomElement(items, weights), 'b');
      const rng = new SeededRandomUtilities('weighted');
      rng.selectWeightedRandomElement(items, weights);
      const reference = new SeededRandomUtilities('weighted');
      reference.random();
      assert.equal(rng.random(), reference.random(), 'one draw per pick');
    });

    test('selectWeightedRandomElement: bad arguments throw', () => {
      const rng = new SeededRandomUtilities('errors');
      assert.throws(() => rng.selectWeightedRandomElement('ab', [1, 1]), TypeError);
      assert.throws(() => rng.selectWeightedRandomElement(['a'], 1), TypeError);
      assert.throws(() => rng.selectWeightedRandomElement(['a', 'b'], [1]), RangeError);
      for (const bad of [-1, NaN, Infinity, '1']) {
        assert.throws(() => rng.selectWeightedRandomElement(['a', 'b'], [1, bad]), RangeError);
      }

      assert.throws(() => rng.selectWeightedRandomElement(['a', 'b'], [0, 0]), {name: 'RangeError', message: /more than 0/u});
      assert.throws(() => rng.selectWeightedRandomElement([], []), RangeError);
      assert.throws(() => rng.selectWeightedRandomElement(['a', 'b'], [Number.MAX_VALUE, Number.MAX_VALUE]), RangeError);
    });

    test('getUniqueRandomIntegers: distinct, in range, one draw each, bounded by the amount', () => {
      const values = new SeededRandomUtilities('unique').getUniqueRandomIntegers(10, 5, 15);
      assert.deepEqual(values.toSorted((a, b) => a - b), [5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
      assert.deepEqual(new SeededRandomUtilities('unique').getUniqueRandomIntegers(0, 0), []);
      const few = new SeededRandomUtilities('unique').getUniqueRandomIntegers(5, 2 ** 32);
      assert.equal(new Set(few).size, 5);
      assert.ok(few.every(value => Number.isSafeInteger(value) && value >= 0 && value < 2 ** 32));
      const rng = new SeededRandomUtilities('unique');
      rng.getUniqueRandomIntegers(7, 100);
      const reference = new SeededRandomUtilities('unique');
      draws(reference, 7);
      assert.equal(rng.random(), reference.random(), 'one draw per integer');
    });

    test('getUniqueRandomIntegers: bad arguments throw', () => {
      const rng = new SeededRandomUtilities('errors');
      assert.throws(() => rng.getUniqueRandomIntegers(11, 10), {name: 'RangeError', message: /holds 10/u});
      assert.throws(() => rng.getUniqueRandomIntegers(1, 5, 5), RangeError);
      assert.throws(() => rng.getUniqueRandomIntegers(1, 10, 0), RangeError);
      assert.throws(() => rng.getUniqueRandomIntegers(-1, 10), RangeError);
      assert.throws(() => rng.getUniqueRandomIntegers(1.5, 10), RangeError);
      assert.throws(() => rng.getUniqueRandomIntegers(1, 2 ** 33), {name: 'RangeError', message: /2\^32/u});
      assert.throws(() => rng.getUniqueRandomIntegers(1, NaN), TypeError);
    });

    test('shuffle: copies by default, shuffles in place with copy false, returns a string for a string', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8];
      const copy = new SeededRandomUtilities('shuffle').shuffle(array);
      assert.deepEqual(array, [1, 2, 3, 4, 5, 6, 7, 8]);
      assert.notEqual(copy, array);
      assert.deepEqual(copy.toSorted((a, b) => a - b), array);
      const inPlace = new SeededRandomUtilities('shuffle').shuffle(array, false);
      assert.equal(inPlace, array);
      assert.deepEqual(inPlace, copy);
      const text = new SeededRandomUtilities('shuffle').shuffle('seeded🎲');
      assert.equal(typeof text, 'string');
      assert.deepEqual([...text].toSorted((a, b) => a.localeCompare(b)), [...'seeded🎲'].toSorted((a, b) => a.localeCompare(b)));
      assert.equal(new SeededRandomUtilities('shuffle').shuffle(null), null);
      assert.equal(new SeededRandomUtilities('shuffle').shuffle(''), '');
    });
  });

  describe(`1.1.4 edge cases and limits, from the review of pull request #17 (${name} build)`, () => {
    test('shuffle copies array-likes with slice, as 1.1.4 did', () => {
      const shuffled = new SeededRandomUtilities('like').shuffle({
        length: 3, 0: 'x', 1: 'y', 2: 'z',
      });
      assert.ok(Array.isArray(shuffled));
      assert.deepEqual(shuffled.toSorted((a, b) => a.localeCompare(b)), ['x', 'y', 'z']);
      for (const notArrayLike of [new Set([1, 2, 3]), 5, {}]) {
        const rng = new SeededRandomUtilities('like');
        assert.deepEqual(rng.shuffle(notArrayLike), []);
        assert.equal(rng.random(), new SeededRandomUtilities('like').random(), 'no draws');
      }
    });

    test('selectUniqueRandomElements stops at a fractional length, as 1.1.4 did', () => {
      const picked = new SeededRandomUtilities('like').selectUniqueRandomElements({
        length: 2.5, 0: 'a', 1: 'b', 2: 'c',
      }, 3);
      assert.deepEqual(picked, ['a', 'b']);
    });

    test('chooseBooleanRandomlyWithProbability draws from the generator itself, so a subclass\'s random() does not change it', () => {
      class Fixed extends SeededRandomUtilities {
        random() {
          return 0.5;
        }
      }

      const reference = new SeededRandomUtilities('1234');
      const expected = Array.from({length: 8}, () => reference.chooseBooleanRandomlyWithProbability(10, 3));
      const rng = new Fixed('1234');
      assert.deepEqual(Array.from({length: 8}, () => rng.chooseBooleanRandomlyWithProbability(10, 3)), expected);
    });

    test('a String object seeds like its string, as in 1.1.4', () => {
      // eslint-disable-next-line no-new-wrappers, unicorn/new-for-builtins
      const wrapped = new String('abc');
      assert.deepEqual(draws(new SeededRandomUtilities(wrapped), 4), draws(new SeededRandomUtilities('abc'), 4));
    });

    test('the static default is the class, for 1.1.4 code that wrote new SeededRandomUtilities.default(seed)', () => {
      assert.equal(SeededRandomUtilities.default, SeededRandomUtilities);
      // eslint-disable-next-line new-cap -- the property name 1.1.4 code used
      assert.equal(new SeededRandomUtilities.default('1234').random(), 0.3111365893855691);
    });

    test('PRNG is frozen, so no code can change what a name means', () => {
      assert.ok(Object.isFrozen(PRNG));
      assert.throws(() => {
        PRNG.sfc32 = 'xoshiro128ss';
      }, TypeError);
    });

    test('integer ranges must lie within the safe integers', () => {
      const rng = new SeededRandomUtilities('big');
      assert.throws(() => rng.getRandomInteger(2 ** 53, (2 ** 53) + 4), {name: 'RangeError', message: /2\^53/u});
      assert.throws(() => rng.getRandomIntegerInclusive(-(2 ** 53), -(2 ** 53) + 2), RangeError);
      assert.throws(() => rng.getUniqueRandomIntegers(4, 2 ** 53, (2 ** 53) + 4), RangeError);
      assert.equal(new SeededRandomUtilities(fixed(HIGHEST)).getRandomInteger((2 ** 53) - 11, (2 ** 53) - 1), (2 ** 53) - 2);
    });

    test('getRandomString and getUniqueRandomIntegers refuse more than 2^24 results instead of exhausting the heap', () => {
      const rng = new SeededRandomUtilities('big');
      assert.throws(() => rng.getRandomString((2 ** 24) + 1), RangeError);
      assert.throws(() => rng.getUniqueRandomIntegers((2 ** 24) + 1, 2 ** 32), RangeError);
    });

    test('fromState refuses sparse arrays and a mulberry32 counter no generator can reach', () => {
      // eslint-disable-next-line no-sparse-arrays
      assert.throws(() => SeededRandomUtilities.fromState({algorithm: 'sfc32', state: [1, , 3, 4]}), TypeError);
      assert.throws(() => SeededRandomUtilities.fromState({algorithm: 'mulberry32', state: [2 ** 84]}), TypeError);
    });
  });

  describe(`state export and import (${name} build)`, () => {
    for (const algorithm of ALGORITHMS) {
      test(`${algorithm}: fromState(getState()) continues the sequence exactly, through JSON`, () => {
        const rng = new SeededRandomUtilities('saved game', algorithm);
        draws(rng, 1000);
        // Through JSON on purpose: a saved state is text.
        // eslint-disable-next-line unicorn/prefer-structured-clone
        const state = JSON.parse(JSON.stringify(rng.getState()));
        assert.equal(state.algorithm, algorithm);
        const resumed = SeededRandomUtilities.fromState(state);
        assert.deepEqual(draws(resumed, 1000), draws(rng, 1000));
        assert.deepEqual(resumed.getState(), rng.getState());
      });
    }

    test('getState throws for Math.random and for an outside source', () => {
      assert.throws(() => new SeededRandomUtilities().getState(), TypeError);
      assert.throws(() => new SeededRandomUtilities(fixed(0.5)).getState(), TypeError);
    });

    test('fromState refuses anything getState did not return', () => {
      const bad = [
        undefined,
        null,
        5,
        {},
        {algorithm: 'nope', state: [1, 2, 3, 4]},
        {algorithm: 'sfc32', state: [1, 2, 3]},
        {algorithm: 'sfc32', state: 'abcd'},
        {algorithm: 'sfc32', state: [1, 2, 3, 2 ** 32]},
        {algorithm: 'sfc32', state: [1, 2, 3, -1]},
        {algorithm: 'sfc32', state: [1, 2, 3, 0.5]},
        {algorithm: 'mulberry32', state: [-1]},
        {algorithm: 'mulberry32Reference', state: [2 ** 32]},
        {algorithm: 'xoshiro128ss', state: [0, 0, 0, 0]},
        {algorithm: 'xoshiro128ssReference', state: [0, 0, 0, 0]},
      ];
      for (const state of bad) {
        assert.throws(() => SeededRandomUtilities.fromState(state), TypeError, JSON.stringify(state));
      }

      assert.equal(SeededRandomUtilities.fromState({algorithm: 'mulberry32', state: [2 ** 60]}).getState().state[0], 2 ** 60);
    });
  });
}
