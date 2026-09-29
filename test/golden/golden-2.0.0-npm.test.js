/*
The contract of the published 2.0.0 (retrofit plan R2): every case in 2.0.0-npm.json, captured by capture-2.0.0-npm.cjs from seeded-random-utilities 2.0.0 installed from npm, returns and throws the same from both builds, compared exactly after the codec's encoding: the results, the error class and message, and the next random() after the calls (how many numbers they drew). Do not regenerate the file here, and do not loosen a comparison.

The scenario cases are code in the capture; each is written again below under its recorded name, and a test fails when a recorded scenario has no replay. The one engine-worded message (a missing method, "rng[method] is not a function") is V8's; this suite runs on Node only, and the call below keeps the capture's expression so V8 words it the same.
*/
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {describe, test} from 'node:test';
import {builds} from '../helpers/builds.js';

const {encode, decode, capture} = createRequire(import.meta.url)('./codec.cjs');
const golden = JSON.parse(readFileSync(new URL('2.0.0-npm.json', import.meta.url), 'utf8'));

const ALGORITHMS = ['sfc32', 'mulberry32', 'xoshiro128ss', 'mulberry32Reference', 'xoshiro128ssReference'];

function source(numbers) {
  let index = 0;
  return {
    next() {
      const value = numbers[index % numbers.length];
      index++;
      return value;
    },
  };
}

// The capture sorted with the default order, which compares UTF-16 code units; the same, written out.
const byCodeUnit = (a, b) => (a < b ? -1 : (a > b ? 1 : 0));
const byKey = ([a], [b]) => byCodeUnit(a, b);

function describeFunction(value) {
  return typeof value === 'function' ? `function/${value.length}` : typeof value;
}

// Own members of an object, sorted, as name: kind (function/arity or typeof), leaving out the given names.
function members(object, skipped) {
  const names = Object.getOwnPropertyNames(object ?? {}).filter(name => !skipped.includes(name)).toSorted(byCodeUnit);
  return Object.fromEntries(names.map(name => [name, describeFunction(object[name])]));
}

function shapeOf(library) {
  const SeededRandomUtilities = typeof library === 'function' ? library : library.default;
  return {
    exports: Object.keys(library).toSorted(byCodeUnit),
    typeofModule: typeof library,
    className: SeededRandomUtilities?.name,
    statics: members(SeededRandomUtilities, ['length', 'name', 'prototype']),
    prototype: members(SeededRandomUtilities?.prototype, ['constructor']),
    prng: library.PRNG === undefined ? 'none' : Object.fromEntries(Object.entries(library.PRNG).toSorted(byKey)),
    rand: describeFunction(library.Rand),
  };
}

// The scenarios of capture-2.0.0-npm.cjs, by recorded name. Each returns what the capture's function returned.
function scenarios(SeededRandomUtilities, Rand) {
  const states = ALGORITHMS.map(algorithm => {
    const rng = new SeededRandomUtilities('1234', algorithm);
    rng.getRandomString(5);
    return rng.getState();
  });

  const table = new Map();
  for (const [index, state] of states.entries()) {
    table.set(`fromState resumes ${ALGORITHMS[index]} after getRandomString(5)`, () => {
      const resumed = SeededRandomUtilities.fromState(state);
      return [resumed.getState(), resumed.random(), resumed.getRandomInteger(100), resumed.shuffle('abcdef')];
    });
  }

  // The capture's JSON round trip, which is what a saved state goes through.
  // eslint-disable-next-line unicorn/prefer-structured-clone
  table.set('fromState of a JSON round trip', () => SeededRandomUtilities.fromState(JSON.parse(JSON.stringify(states[0]))).random());
  table.set('fromState of sfc32 with four zero words', () => {
    const rng = SeededRandomUtilities.fromState({algorithm: 'sfc32', state: [0, 0, 0, 0]});
    return [rng.random(), rng.random(), rng.random()];
  });
  table.set('getState without a seed', () => new SeededRandomUtilities().getState());
  table.set('getState with a custom source', () => new SeededRandomUtilities(source([0.5])).getState());
  table.set('getState with a Rand', () => new SeededRandomUtilities(new Rand('1234')).getState());
  table.set('getState after a million draws (mulberry32 counter)', () => {
    const rng = new SeededRandomUtilities('1234', 'mulberry32');
    for (let index = 0; index < 1_000_000; index++) {
      rng.random();
    }

    return rng.getState();
  });
  table.set('an unseeded generator gives numbers in [0, 1)', () => {
    const rng = new SeededRandomUtilities();
    return Array.from({length: 100}, () => rng.random()).every(value => value >= 0 && value < 1);
  });
  table.set('an unseeded generator ignores an unknown algorithm', () => typeof new SeededRandomUtilities(undefined, 'nope').random());
  table.set('random is bound to its instance', () => {
    const {random} = new SeededRandomUtilities('1234');
    return [random(), random()];
  });
  table.set('Rand with a seed and each algorithm', () => ALGORITHMS.map(algorithm => {
    const rand = new Rand('1234', algorithm);
    return [rand.next(), rand.next()];
  }));
  table.set('Rand with a number seed equals its string', () => new Rand(42).next() === new Rand('42').next());
  table.set('Rand refuses an object seed', () => new Rand({}).next());
  table.set('Rand refuses an unknown algorithm', () => new Rand('1234', 'nope').next());
  table.set('a Rand as the seed gives the Rand sequence', () => {
    const rng = new SeededRandomUtilities(new Rand('1234', 'mulberry32'));
    return [rng.random(), rng.getRandomInteger(10)];
  });
  table.set('static default is the class', () => SeededRandomUtilities.default === SeededRandomUtilities);
  // The deprecated static the capture called.
  // eslint-disable-next-line new-cap
  table.set('instances from new default()', () => new SeededRandomUtilities.default('1234').random());
  table.set('shuffle with copy mutates the input only when copy is false', () => {
    const rng = new SeededRandomUtilities('1234');
    const kept = [1, 2, 3, 4];
    const mutated = [1, 2, 3, 4];
    const copied = rng.shuffle(kept);
    const inPlace = rng.shuffle(mutated, false);
    return [kept, copied, mutated, inPlace === mutated, copied === kept];
  });
  return table;
}

// The fromState scenarios carry their encoded input in the name.
const FROM_STATE = 'fromState(';
function fromStateScenario(SeededRandomUtilities, name) {
  if (!name.startsWith(FROM_STATE) || !name.endsWith(')')) {
    return undefined;
  }

  const state = decode(JSON.parse(name.slice(FROM_STATE.length, -1)));
  return () => {
    const rng = SeededRandomUtilities.fromState(state);
    return [rng.random(), rng.random()];
  };
}

const label = (index, entry) => entry.method === 'scenario'
  ? `#${index} ${entry.name}`
  : `#${index} ${entry.method}(${JSON.stringify(entry.args).slice(1, -1).slice(0, 50)}) seed ${JSON.stringify(entry.seed).slice(0, 24)} ${JSON.stringify(entry.algorithm)}`;

for (const {name, lib} of builds) {
  const SeededRandomUtilities = lib.default;
  const {Rand} = lib;
  const table = scenarios(SeededRandomUtilities, Rand);

  function create(seed, algorithm) {
    const value = seed !== null && typeof seed === 'object' && '$source' in seed ? source(decode(seed.$source)) : decode(seed);
    return algorithm === null ? new SeededRandomUtilities(value) : new SeededRandomUtilities(value, decode(algorithm));
  }

  // The capture's call, expression for expression (the variable names shape V8's message for a missing method).
  function replay(entry) {
    let rng;
    try {
      rng = create(entry.seed, entry.algorithm);
    } catch (error) {
      const results = [capture(() => {
        throw error;
      })];
      return {results, next: null};
    }

    for (let index = 0; index < entry.skip; index++) {
      rng.random();
    }

    const {method, args} = entry;
    const results = [];
    for (let index = 0; index < entry.calls; index++) {
      results.push(capture(() => rng[method](...decode(args))));
    }

    return {results, next: capture(() => rng.random())};
  }

  describe(`2.0.0 golden cases from npm, edge inputs and error classes (${name} build)`, () => {
    test('the export shape', () => {
      assert.deepEqual(shapeOf(lib), golden.shape);
    });

    for (const [index, entry] of golden.cases.entries()) {
      test(label(index, entry), () => {
        if (entry.method === 'scenario') {
          const run = table.get(entry.name) ?? fromStateScenario(SeededRandomUtilities, entry.name);
          assert.ok(run, `no replay for the recorded scenario "${entry.name}"`);
          assert.deepEqual([capture(run)], entry.results);
          return;
        }

        assert.deepEqual(replay(entry), {results: entry.results, next: entry.next});
      });
    }

    test('every scenario in the replay table is recorded', () => {
      const recorded = new Set(golden.cases.filter(entry => entry.method === 'scenario').map(entry => entry.name));
      const unrecorded = [];
      for (const key of table.keys()) {
        if (!recorded.has(key)) {
          unrecorded.push(key);
        }
      }

      assert.deepEqual(unrecorded, []);
    });

    test('the codec keeps the recorded edge values', () => {
      assert.deepEqual(encode([NaN, -0, Infinity, undefined]), [{$number: 'NaN'}, {$number: '-0'}, {$number: 'Infinity'}, {$undefined: true}]);
    });
  });
}
