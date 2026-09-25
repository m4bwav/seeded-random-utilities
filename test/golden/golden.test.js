/*
The contract of 2.0.0 (plan decision D1): every case recorded from the published 1.1.4 in 1.1.4.json returns the same values from both builds, compared exactly. The file was captured by capture-1.1.4.cjs from the npm package, never from this repository: do not regenerate it here, and do not loosen a comparison.

The one deliberate difference (D9): 2.0.0 shuffles strings by code point, where 1.1.4 split characters outside the Basic Multilingual Plane into lone surrogates.
*/
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describe, test} from 'node:test';
import {builds} from '../helpers/builds.js';

const golden = JSON.parse(readFileSync(new URL('1.1.4.json', import.meta.url), 'utf8'));
// The methods new in 2.0.0, captured from the 2.0.0 build before its release (capture-2.0.0.cjs): later 2.x versions must keep these too.
const golden2 = JSON.parse(readFileSync(new URL('2.0.0.json', import.meta.url), 'utf8'));

const RENAMED = {
  getRandomIntegar: 'getRandomInteger',
  getRandomArbitrary: 'getRandomFloat',
  getRandomIntInclusive: 'getRandomIntegerInclusive',
};

const isAstralTextShuffle = entry => entry.method === 'shuffle' && typeof entry.args[0] === 'string' && /[\u{10000}-\u{10FFFF}]/u.test(entry.args[0]);
const sortedCharacters = text => [...text].toSorted((a, b) => a.localeCompare(b));

// The capture's encoding: JSON has no undefined and no thrown error.
function call(rng, method, arguments_) {
  try {
    const value = rng[method](...arguments_.map(argument => structuredClone(argument)));
    return value === undefined ? {$undefined: true} : value;
  } catch (error) {
    return {$throws: error.message};
  }
}

// Through JSON, as the capture wrote them, so both sides are compared in the same form (a deep clone would keep what JSON drops).
// eslint-disable-next-line unicorn/prefer-structured-clone
const normalize = values => JSON.parse(JSON.stringify(values));

function label(index, entry) {
  const seed = JSON.stringify(entry.seed).slice(0, 24);
  const arguments_ = entry.args ? ` args ${JSON.stringify(entry.args).slice(0, 40)}` : '';
  const skip = entry.skip ? ` after ${entry.skip}` : '';
  return `#${index} ${entry.method} ${entry.algorithm ?? 'default'} seed ${seed}${arguments_}${skip}`;
}

function runScript(rng, entry) {
  const results = entry.steps.map(([method, arguments_]) => call(rng, method, arguments_));
  assert.deepEqual(normalize(results), entry.results);
}

// D9: every result is a permutation of the characters, and the shuffle draws one number per code point.
function runAstralTextShuffle(rng, entry, create) {
  const characters = [...entry.args[0]];
  for (let draw = 0; draw < entry.calls; draw++) {
    const shuffled = rng.shuffle(entry.args[0]);
    assert.ok(shuffled.isWellFormed(), 'no lone surrogates');
    assert.deepEqual(sortedCharacters(shuffled), sortedCharacters(entry.args[0]));
  }

  const reference = create(entry);
  for (let draw = 0; draw < entry.calls * characters.length; draw++) {
    reference.random();
  }

  assert.equal(rng.random(), reference.random());
}

function runCalls(rng, entry) {
  for (let draw = 0; draw < entry.skip; draw++) {
    rng.random();
  }

  const results = Array.from({length: entry.calls}, () => call(rng, entry.method, entry.args));
  assert.deepEqual(normalize(results), entry.results);
}

const renamedCases = golden.cases
  .map((entry, index) => ({entry, index, renamed: RENAMED[entry.method]}))
  .filter(({renamed}) => renamed !== undefined);

for (const {name, lib} of builds) {
  const {default: SeededRandomUtilities} = lib;
  const create = entry => new SeededRandomUtilities(entry.seed, entry.algorithm ?? undefined);

  describe(`1.1.4 golden cases (${name} build)`, () => {
    for (const [index, entry] of golden.cases.entries()) {
      test(label(index, entry), () => {
        const rng = create(entry);
        if (entry.method === 'script') {
          runScript(rng, entry);
        } else if (isAstralTextShuffle(entry)) {
          runAstralTextShuffle(rng, entry, create);
        } else {
          runCalls(rng, entry);
        }
      });
    }
  });

  describe(`2.0.0 golden cases, the methods new in 2.0.0 (${name} build)`, () => {
    for (const [index, entry] of golden2.cases.entries()) {
      test(label(index, entry), () => {
        const rng = create(entry);
        if (entry.method === 'script') {
          runScript(rng, entry);
        } else {
          runCalls(rng, entry);
        }
      });
    }
  });

  describe(`the (min, max) names give 1.1.4's numbers (${name} build)`, () => {
    for (const {entry, index, renamed} of renamedCases) {
      const [max, min = 0] = entry.args;
      test(`#${index} ${renamed}(${min}, ${max}) ${entry.algorithm} seed ${JSON.stringify(entry.seed)}`, () => {
        const isInclusive = renamed === 'getRandomIntegerInclusive';
        const isEmpty = renamed === 'getRandomFloat'
          ? min > max
          : Math.floor(max) - Math.ceil(min) + (isInclusive ? 1 : 0) < 1;
        const rng = create(entry);
        if (isEmpty) {
          assert.throws(() => rng[renamed](min, max), RangeError, 'an empty or reversed range throws instead of returning 1.1.4\'s odd numbers');
          return;
        }

        const results = Array.from({length: entry.calls}, () => rng[renamed](min, max));
        assert.deepEqual(normalize(results), entry.results);
      });
    }
  });
}
