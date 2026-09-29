'use strict';
// Records what the PUBLISHED seeded-random-utilities 2.0.0 returns and throws, from npm, so every later 2.x version (and the
// wiki's upgrade page for 3.0.0) can prove what it kept. It adds what 1.1.4.json and 2.0.0.json do not hold: every public
// method with edge and odd inputs (NaN, -0, Infinity, wrong types, wrapper objects, Sets, array-likes, lone surrogates),
// the error class of every throw, the constructor's seed and algorithm handling, Rand, getState and fromState, custom
// random sources, and the export shape. Written from scripts/golden-capture-npm.template.cjs (package-modernize) during
// the 2026-09-29 retrofit; the older captures stay as they are.
//
// Run it in a scratch project, never inside this repository:
//   npm init -y && npm install seeded-random-utilities@2.0.0
//   copy this file and test/golden/codec.cjs into it
//   node capture-2.0.0-npm.cjs > 2.0.0-npm.json
// The file is written in ASCII: every character outside printable ASCII is a JSON escape, so a lone surrogate cannot be
// replaced on the way to disk.
//
// Replaying it against another version: copy it and codec.cjs into a scratch project with that version installed and run
// it unchanged. It loads the package by name only; a method or export that version lacks is recorded as the error it throws.
//
// Every case runs on a new instance: `new SeededRandomUtilities(seed, algorithm)` (algorithm null means the argument is
// left out), then `skip` calls to random(), then `calls` calls of `method(...args)` with arguments decoded fresh for each
// call, then one more random() recorded as `next`, which pins how many numbers the calls drew. A seed written
// {"$source": [numbers]} is an object whose next() returns those numbers in turn. Error messages the engine words (reading
// a property of a non-object) are V8's; they hold on every Node line from 20 and are listed in the header.

const fs = require('node:fs');
const path = require('node:path');
const {encode, decode, capture} = require('./codec.cjs');

const library = require('seeded-random-utilities');

// The package's own package.json, found from its entry point because the exports map may hide it.
function manifestPath() {
  try {
    return require.resolve('seeded-random-utilities/package.json');
  } catch {
    let dir = path.dirname(require.resolve('seeded-random-utilities'));
    while (!fs.existsSync(path.join(dir, 'package.json')) || JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).name !== 'seeded-random-utilities') {
      dir = path.dirname(dir);
    }

    return path.join(dir, 'package.json');
  }
}

const manifest = JSON.parse(fs.readFileSync(manifestPath(), 'utf8'));

// A runtime dependency's installed version, or 'none' when the installed version of the package does not have it.
const dependency = name => {
  try {
    return require(`${name}/package.json`).version;
  } catch {
    return 'none';
  }
};

const SeededRandomUtilities = typeof library === 'function' ? library : library.default;
const {Rand} = library;

const ALGORITHMS = ['sfc32', 'mulberry32', 'xoshiro128ss', 'mulberry32Reference', 'xoshiro128ssReference'];
const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
const twenty = Array.from({length: 20}, (_, index) => index);
// Characters outside printable ASCII are built from their code points, so no escape sequence passes through an editor.
const cp = (...points) => String.fromCodePoint(...points);
const grin = cp(0x1_F6_00);
const die = cp(0x1_F3_B2);
const highSurrogate = String.fromCharCode(0xD8_3D);
const lowSurrogate = String.fromCharCode(0xDE_00);
const arrayLike = {length: 3, 0: 'a', 1: 'b', 2: 'c'};

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

function seedValue(seed) {
  if (seed !== null && typeof seed === 'object' && '$source' in seed) {
    return source(decode(seed.$source));
  }

  return decode(seed);
}

// The instance for a case; algorithm null leaves the second argument out, as a caller who never names one does.
function create(seed, algorithm) {
  const value = seedValue(seed);
  return algorithm === null ? new SeededRandomUtilities(value) : new SeededRandomUtilities(value, decode(algorithm));
}

function runCase(seed, algorithm, method, args, calls = 1, skip = 0) {
  const encodedSeed = seed !== null && typeof seed === 'object' && '$source' in seed ? {$source: encode(seed.$source)} : encode(seed);
  const encodedAlgorithm = algorithm === null ? null : encode(algorithm);
  const encodedArgs = encode(args);
  const entry = {seed: encodedSeed, algorithm: encodedAlgorithm, method, args: encodedArgs, skip, calls};
  let rng;
  try {
    rng = create(encodedSeed, encodedAlgorithm);
  } catch (error) {
    return {...entry, results: [capture(() => {
      throw error;
    })], next: null};
  }

  for (let index = 0; index < skip; index++) {
    rng.random();
  }

  const results = [];
  for (let index = 0; index < calls; index++) {
    results.push(capture(() => rng[method](...decode(encodedArgs))));
  }

  return {...entry, results, next: capture(() => rng.random())};
}

// Normal calls on every algorithm and two seeds: the sequences later 2.x versions must keep.
const everyAlgorithm = [
  ['random', [], 8],
  ['getRandomInteger', [1, 7], 8],
  ['getRandomIntegerInclusive', [6], 8],
  ['getRandomFloat', [-1, 1], 4],
  ['getRandomBool', [], 8],
  ['getRandomChar', [], 8],
  ['getRandomString', [6], 2],
  ['selectRandomElement', [letters], 4],
  ['selectUniqueRandomElements', [letters, 3], 2],
  ['selectWeightedRandomElement', [['a', 'b', 'c'], [1, 2, 7]], 8],
  ['getUniqueRandomIntegers', [4, 10], 2],
  ['shuffle', [twenty], 2],
  ['shuffle', [`a${grin}b${die}c`], 2],
  ['chooseBooleanRandomlyWithProbability', [10, 3], 8],
  ['getRandomIntegar', [10], 4],
  ['getRandomArbitrary', [10, 5], 4],
  ['getRandomIntInclusive', [6, 1], 4],
  ['generateRandomArrayOfUniqueIntegers', [3, 9], 2],
  ['getState', [], 1],
];

// Edge and odd inputs, on sfc32 with the seed '1234': argument checks do not depend on the algorithm.
const oddInputs = [
  ['random', [], 2],
  ['random', [5, 'ignored'], 2],
  ['getRandom', [], 2],

  ['getRandomInteger', [10], 4],
  ['getRandomInteger', [7, 1], 1],
  ['getRandomInteger', [5, 5], 1],
  ['getRandomInteger', [5, 6], 4],
  ['getRandomInteger', [0.5, 1.5], 2],
  ['getRandomInteger', [1.2, 1.8], 1],
  ['getRandomInteger', [-10, -5], 4],
  ['getRandomInteger', [-0], 1],
  ['getRandomInteger', [0], 1],
  ['getRandomInteger', [1], 2],
  ['getRandomInteger', [Number.NaN], 1],
  ['getRandomInteger', [1, Number.NaN], 1],
  ['getRandomInteger', [Number.POSITIVE_INFINITY], 1],
  ['getRandomInteger', [Number.NEGATIVE_INFINITY, 0], 1],
  ['getRandomInteger', ['5'], 1],
  ['getRandomInteger', ['1', '7'], 1],
  ['getRandomInteger', [new Number(5)], 1],
  ['getRandomInteger', [true], 1],
  ['getRandomInteger', [null], 1],
  ['getRandomInteger', [undefined], 1],
  ['getRandomInteger', [], 1],
  ['getRandomInteger', [2 ** 32], 2],
  ['getRandomInteger', [0, 2 ** 32 + 1], 1],
  ['getRandomInteger', [-(2 ** 53 - 1), -(2 ** 53 - 1) + 10], 2],
  ['getRandomInteger', [2 ** 53, 2 ** 53 + 4], 1],
  ['getRandomInteger', [1e300], 1],

  ['getRandomIntegerInclusive', [10], 4],
  ['getRandomIntegerInclusive', [6, 1], 1],
  ['getRandomIntegerInclusive', [5, 5], 2],
  ['getRandomIntegerInclusive', [1.2, 1.8], 1],
  ['getRandomIntegerInclusive', [0.5, 1.5], 2],
  ['getRandomIntegerInclusive', [-0], 2],
  ['getRandomIntegerInclusive', [Number.NaN], 1],
  ['getRandomIntegerInclusive', ['6'], 1],
  ['getRandomIntegerInclusive', [], 1],
  ['getRandomIntegerInclusive', [0, 2 ** 32 - 1], 2],
  ['getRandomIntegerInclusive', [0, 2 ** 32], 1],

  ['getRandomFloat', [10], 2],
  ['getRandomFloat', [5, 5], 2],
  ['getRandomFloat', [5, 4], 1],
  ['getRandomFloat', [1, 1 + Number.EPSILON], 4],
  ['getRandomFloat', [-0, 0], 2],
  ['getRandomFloat', [0], 2],
  ['getRandomFloat', [Number.NaN], 1],
  ['getRandomFloat', [0, Number.POSITIVE_INFINITY], 1],
  ['getRandomFloat', [-Number.MAX_VALUE, Number.MAX_VALUE], 2],
  ['getRandomFloat', ['3'], 1],
  ['getRandomFloat', [undefined], 1],
  ['getRandomFloat', [], 1],

  ['getRandomBool', [], 4],
  ['getRandomBool', [0], 4],
  ['getRandomBool', [1], 4],
  ['getRandomBool', [-0], 2],
  ['getRandomBool', [0.3], 4],
  ['getRandomBool', [-0.1], 1],
  ['getRandomBool', [1.1], 1],
  ['getRandomBool', [Number.NaN], 1],
  ['getRandomBool', [Number.POSITIVE_INFINITY], 1],
  ['getRandomBool', ['0.5'], 1],
  ['getRandomBool', [null], 1],
  ['getRandomBool', [undefined], 2],
  ['getRandomBool', [new Number(0.5)], 1],
  ['getRandomBool', [true], 1],

  ['getRandomChar', [], 4],
  ['getRandomChar', ['ab'], 4],
  ['getRandomChar', [''], 1],
  ['getRandomChar', [grin], 2],
  ['getRandomChar', [`a${grin}`], 4],
  ['getRandomChar', [`a${highSurrogate}`], 4],
  ['getRandomChar', [5], 1],
  ['getRandomChar', [null], 1],
  ['getRandomChar', [undefined], 2],
  ['getRandomChar', [new String('xy')], 2],
  ['getRandomChar', [['a', 'b']], 1],

  ['getRandomString', [0], 1],
  ['getRandomString', [8], 2],
  ['getRandomString', [8, '01'], 2],
  ['getRandomString', [4, `${grin}${die}`], 2],
  ['getRandomString', [3, ''], 1],
  ['getRandomString', [4, null], 1],
  ['getRandomString', [4, undefined], 1],
  ['getRandomString', [4, 5], 1],
  ['getRandomString', [-1], 1],
  ['getRandomString', [1.5], 1],
  ['getRandomString', [Number.NaN], 1],
  ['getRandomString', ['4'], 1],
  ['getRandomString', [null], 1],
  ['getRandomString', [], 1],
  ['getRandomString', [2 ** 24 + 1], 1],

  ['selectRandomElement', [letters], 4],
  ['selectRandomElement', [[]], 1],
  ['selectRandomElement', [[undefined]], 1],
  ['selectRandomElement', ['abc'], 2],
  ['selectRandomElement', [''], 1],
  ['selectRandomElement', [new Set([1, 2])], 1],
  ['selectRandomElement', [arrayLike], 2],
  ['selectRandomElement', [null], 1],
  ['selectRandomElement', [undefined], 1],
  ['selectRandomElement', [5], 1],

  ['selectUniqueRandomElements', [twenty, 5], 2],
  ['selectUniqueRandomElements', [twenty, 0], 1],
  ['selectUniqueRandomElements', [twenty, 20], 1],
  ['selectUniqueRandomElements', [twenty, 25], 1],
  ['selectUniqueRandomElements', [twenty, -1], 1],
  ['selectUniqueRandomElements', [twenty, 1.5], 1],
  ['selectUniqueRandomElements', [twenty, Number.NaN], 1],
  ['selectUniqueRandomElements', [twenty, Number.POSITIVE_INFINITY], 1],
  ['selectUniqueRandomElements', [twenty], 1],
  ['selectUniqueRandomElements', [twenty, '2'], 1],
  ['selectUniqueRandomElements', ['abcdef', 2], 1],
  ['selectUniqueRandomElements', [arrayLike, 2], 1],
  ['selectUniqueRandomElements', [new Set([1, 2, 3]), 2], 1],
  ['selectUniqueRandomElements', [null, 1], 1],

  ['selectWeightedRandomElement', [['a', 'b', 'c'], [1, 2, 7]], 4],
  ['selectWeightedRandomElement', [['a'], [0]], 1],
  ['selectWeightedRandomElement', [['a', 'b'], [0, 1]], 4],
  ['selectWeightedRandomElement', [['a', 'b'], [1]], 1],
  ['selectWeightedRandomElement', [['a'], [-1]], 1],
  ['selectWeightedRandomElement', [['a'], [-0]], 1],
  ['selectWeightedRandomElement', [['a'], [Number.NaN]], 1],
  ['selectWeightedRandomElement', [['a'], [Number.POSITIVE_INFINITY]], 1],
  ['selectWeightedRandomElement', [['a', 'b'], [Number.MAX_VALUE, Number.MAX_VALUE]], 2],
  ['selectWeightedRandomElement', [['a', 'b'], ['1', '2']], 1],
  ['selectWeightedRandomElement', [[], []], 1],
  ['selectWeightedRandomElement', ['ab', [1, 1]], 1],
  ['selectWeightedRandomElement', [['a', 'b'], new Set([1, 1])], 1],
  ['selectWeightedRandomElement', [null, null], 1],
  ['selectWeightedRandomElement', [['a', 'b']], 1],

  ['getUniqueRandomIntegers', [5, 100], 2],
  ['getUniqueRandomIntegers', [3, 10, 20], 2],
  ['getUniqueRandomIntegers', [0, 5], 1],
  ['getUniqueRandomIntegers', [5, 5], 1],
  ['getUniqueRandomIntegers', [6, 5], 1],
  ['getUniqueRandomIntegers', [3, 10, 5], 1],
  ['getUniqueRandomIntegers', [-1, 5], 1],
  ['getUniqueRandomIntegers', [1.5, 5], 1],
  ['getUniqueRandomIntegers', [Number.NaN, 5], 1],
  ['getUniqueRandomIntegers', [3, Number.NaN], 1],
  ['getUniqueRandomIntegers', [3, '10'], 1],
  ['getUniqueRandomIntegers', [3], 1],
  ['getUniqueRandomIntegers', [1, 0, 0], 1],
  ['getUniqueRandomIntegers', [2, 0, 2 ** 40], 1],
  ['getUniqueRandomIntegers', [2 ** 24 + 1, 2 ** 30], 1],

  ['shuffle', [twenty], 2],
  ['shuffle', [twenty, false], 2],
  ['shuffle', [[1, 2, 3], 0], 1],
  ['shuffle', ['hello world'], 2],
  ['shuffle', ['hello', false], 1],
  ['shuffle', [`a${grin}b${die}c`], 2],
  ['shuffle', [`a${highSurrogate}b${lowSurrogate}c`], 2],
  ['shuffle', [''], 1],
  ['shuffle', [[]], 1],
  ['shuffle', [[undefined, null, Number.NaN, -0]], 1],
  ['shuffle', [new String('abc')], 1],
  ['shuffle', [new Set([1, 2, 3])], 1],
  ['shuffle', [arrayLike], 1],
  ['shuffle', [null], 1],
  ['shuffle', [undefined], 1],
  ['shuffle', [5], 1],

  ['chooseBooleanRandomlyWithProbability', [10, 3], 4],
  ['chooseBooleanRandomlyWithProbability', [10], 4],
  ['chooseBooleanRandomlyWithProbability', [0, 1], 1],
  ['chooseBooleanRandomlyWithProbability', [-1, 1], 1],
  ['chooseBooleanRandomlyWithProbability', [Number.NaN, 1], 1],
  ['chooseBooleanRandomlyWithProbability', [4, 4], 1],
  ['chooseBooleanRandomlyWithProbability', ['10', 3], 1],

  ['getRandomIntegar', [10], 2],
  ['getRandomIntegar', [10, 5], 2],
  ['getRandomIntegar', [0, 10], 2],
  ['getRandomIntegar', [5, 5], 1],
  ['getRandomIntegar', [7.9, 1.5], 2],
  ['getRandomIntegar', [Number.NaN], 1],
  ['getRandomIntegar', [Number.POSITIVE_INFINITY], 1],
  ['getRandomIntegar', ['5'], 1],
  ['getRandomIntegar', [], 1],
  ['getRandomArbitrary', [10], 2],
  ['getRandomArbitrary', [2, 1], 2],
  ['getRandomArbitrary', [0, 10], 2],
  ['getRandomArbitrary', [Number.NaN], 1],
  ['getRandomArbitrary', [], 1],
  ['getRandomIntInclusive', [10], 2],
  ['getRandomIntInclusive', [6, 1], 2],
  ['getRandomIntInclusive', [0, 10], 2],
  ['getRandomIntInclusive', [Number.NaN], 1],
  ['generateRandomArrayOfUniqueIntegers', [3, 9], 2],
  ['generateRandomArrayOfUniqueIntegers', [10, 3], 1],
  ['generateRandomArrayOfUniqueIntegers', [5, 100, true], 1],
  ['generateRandomArrayOfUniqueIntegers', [0, 5], 1],
  ['generateRandomArrayOfUniqueIntegers', [-1, 3], 1],
  ['generateRandomArrayOfUniqueIntegers', [1.5, 3], 1],
  ['generateRandomArrayOfUniqueIntegers', [3, Number.NaN], 1],
  ['generateRandomArrayOfUniqueIntegers', [3, -1], 1],

  ['getState', [], 1],
  ['getState', ['ignored'], 1],
  ['nonexistentMethod', [], 1],
];

// Seeds and algorithms the constructor takes or refuses; each case draws four numbers. Date seeds are left out: their
// message would print the capture machine's time zone.
const constructorCases = [
  ['', null], ['a', null], ['1234', null], ['1234', 'sfc32'], ['1234', 'mulberry32'], ['1234', 'xoshiro128ss'],
  ['1234', 'mulberry32Reference'], ['1234', 'xoshiro128ssReference'], ['1234', 'SFC32'], ['1234', 'nope'], ['1234', ''],
  ['1234', 1], ['1234', undefined], ['1234', {}], ['1234', new String('sfc32')],
  [42, null], ['42', null], [0, null], [-0, null], [1.5, null], [-1, null], [1e21, null], [Number.MAX_VALUE, null],
  [Number.NaN, null], [Number.POSITIVE_INFINITY, null], [Number.NEGATIVE_INFINITY, null],
  [new String('1234'), null], [new Number(42), null], [true, null], [false, null], [{}, null], [[], null], [['x'], null],
  [{next: 5}, null], [10n, null], [`${grin}${die} unicode`, null], [`lone ${highSurrogate}`, null], ['x'.repeat(1000), null],
  [{$source: [0, 0.25, 0.5, 0.75, 0.999_999_999_999_999_9]}, null], [{$source: [0.5]}, 'nope'], [{$source: [1]}, null],
  [{$source: [-0.5]}, null], [{$source: [Number.NaN]}, null], [{$source: [2]}, null],
];

// The same methods fed by a hand-made source: how each maps a number to an answer, independent of the algorithms.
const sourceCases = [
  ['random', [], 5], ['getRandomInteger', [0, 10], 5], ['getRandomIntegerInclusive', [1, 6], 5], ['getRandomFloat', [-1, 1], 5],
  ['getRandomBool', [], 5], ['getRandomBool', [0.25], 5], ['getRandomChar', ['abcd'], 5], ['getRandomString', [5, 'xyz'], 1],
  ['selectRandomElement', [letters], 5], ['selectWeightedRandomElement', [['a', 'b', 'c'], [1, 2, 7]], 5],
  ['getUniqueRandomIntegers', [3, 10], 1], ['shuffle', [[1, 2, 3, 4, 5]], 1], ['chooseBooleanRandomlyWithProbability', [4, 1], 5],
  ['getState', [], 1],
];

const cases = [];
for (const seed of ['1234', 'seeded-random-utilities']) {
  for (const algorithm of ALGORITHMS) {
    for (const [method, args, calls] of everyAlgorithm) {
      cases.push(runCase(seed, algorithm, method, args, calls));
    }

    cases.push(runCase(seed, algorithm, 'random', [], 4, 10_000), runCase(seed, algorithm, 'getState', [], 1, 10_000));
  }
}

for (const [method, args, calls] of oddInputs) {
  cases.push(runCase('1234', 'sfc32', method, args, calls));
}

for (const [seed, algorithm] of constructorCases) {
  cases.push(runCase(seed, algorithm === null ? null : algorithm, 'random', [], 4));
}

for (const [method, args, calls] of sourceCases) {
  cases.push(runCase({$source: [0, 0.25, 0.5, 0.75, 0.999_999_999_999_999_9]}, null, method, args, calls));
}

// Stateful paths that a single method call cannot show: each returns what it observed, encoded.
function scenario(name, run) {
  return {method: 'scenario', name, results: [capture(run)]};
}

const states = ALGORITHMS.map(algorithm => {
  const rng = new SeededRandomUtilities('1234', algorithm);
  rng.getRandomString(5);
  return rng.getState();
});

cases.push(
  ...states.map((state, index) => scenario(`fromState resumes ${ALGORITHMS[index]} after getRandomString(5)`, () => {
    const resumed = SeededRandomUtilities.fromState(state);
    return [resumed.getState(), resumed.random(), resumed.getRandomInteger(100), resumed.shuffle('abcdef')];
  })),
  scenario('fromState of a JSON round trip', () => SeededRandomUtilities.fromState(JSON.parse(JSON.stringify(states[0]))).random()),
  scenario('fromState of sfc32 with four zero words', () => {
    const rng = SeededRandomUtilities.fromState({algorithm: 'sfc32', state: [0, 0, 0, 0]});
    return [rng.random(), rng.random(), rng.random()];
  }),
  ...[
    undefined, null, {}, 5, 'sfc32', {algorithm: 'sfc32'}, {algorithm: 'sfc32', state: [1, 2, 3]}, {algorithm: 'sfc32', state: [1, 2, 3, 4, 5]},
    {algorithm: 'nope', state: [1, 2, 3, 4]}, {algorithm: 'sfc32', state: [1, 2, 3, 1.5]}, {algorithm: 'sfc32', state: [1, 2, 3, -1]},
    {algorithm: 'sfc32', state: [1, 2, 3, 2 ** 32]}, {algorithm: 'sfc32', state: [1, 2, 3, Number.NaN]}, {algorithm: 'sfc32', state: ['1', 2, 3, 4]},
    {algorithm: 'mulberry32', state: [1]}, {algorithm: 'mulberry32', state: [2 ** 53]}, {algorithm: 'mulberry32Reference', state: [2 ** 32]},
    {algorithm: 'xoshiro128ss', state: [0, 0, 0, 0]}, {algorithm: 'xoshiro128ssReference', state: [0, 0, 0, 0]},
  ].map(state => scenario(`fromState(${JSON.stringify(encode(state))})`, () => {
    const rng = SeededRandomUtilities.fromState(state);
    return [rng.random(), rng.random()];
  })),
  scenario('getState without a seed', () => new SeededRandomUtilities().getState()),
  scenario('getState with a custom source', () => new SeededRandomUtilities(source([0.5])).getState()),
  scenario('getState with a Rand', () => new SeededRandomUtilities(new Rand('1234')).getState()),
  scenario('getState after a million draws (mulberry32 counter)', () => {
    const rng = new SeededRandomUtilities('1234', 'mulberry32');
    for (let index = 0; index < 1_000_000; index++) {
      rng.random();
    }

    return rng.getState();
  }),
  scenario('an unseeded generator gives numbers in [0, 1)', () => {
    const rng = new SeededRandomUtilities();
    return Array.from({length: 100}, () => rng.random()).every(value => value >= 0 && value < 1);
  }),
  scenario('an unseeded generator ignores an unknown algorithm', () => typeof new SeededRandomUtilities(undefined, 'nope').random()),
  scenario('random is bound to its instance', () => {
    const {random} = new SeededRandomUtilities('1234');
    return [random(), random()];
  }),
  scenario('Rand with a seed and each algorithm', () => ALGORITHMS.map(algorithm => {
    const rand = new Rand('1234', algorithm);
    return [rand.next(), rand.next()];
  })),
  scenario('Rand with a number seed equals its string', () => new Rand(42).next() === new Rand('42').next()),
  scenario('Rand refuses an object seed', () => new Rand({}).next()),
  scenario('Rand refuses an unknown algorithm', () => new Rand('1234', 'nope').next()),
  scenario('a Rand as the seed gives the Rand sequence', () => {
    const rng = new SeededRandomUtilities(new Rand('1234', 'mulberry32'));
    return [rng.random(), rng.getRandomInteger(10)];
  }),
  scenario('static default is the class', () => SeededRandomUtilities.default === SeededRandomUtilities),
  scenario('instances from new default()', () => new SeededRandomUtilities.default('1234').random()),
  scenario('shuffle with copy mutates the input only when copy is false', () => {
    const rng = new SeededRandomUtilities('1234');
    const kept = [1, 2, 3, 4];
    const mutated = [1, 2, 3, 4];
    const copied = rng.shuffle(kept);
    const inPlace = rng.shuffle(mutated, false);
    return [kept, copied, mutated, inPlace === mutated, copied === kept];
  }),
);

// The shape callers depend on: export names, the class's static and prototype members with their arities, PRNG.
function describeFunction(value) {
  return typeof value === 'function' ? `function/${value.length}` : typeof value;
}

const shape = {
  exports: Object.keys(library).toSorted(),
  typeofModule: typeof library,
  className: SeededRandomUtilities?.name,
  statics: Object.fromEntries(Object.getOwnPropertyNames(SeededRandomUtilities ?? {}).filter(name => !['length', 'name', 'prototype'].includes(name)).toSorted().map(name => [name, describeFunction(SeededRandomUtilities[name])])),
  prototype: Object.fromEntries(Object.getOwnPropertyNames(SeededRandomUtilities?.prototype ?? {}).filter(name => name !== 'constructor').toSorted().map(name => [name, describeFunction(SeededRandomUtilities.prototype[name])])),
  prng: library.PRNG === undefined ? 'none' : Object.fromEntries(Object.entries(library.PRNG).toSorted()),
  rand: describeFunction(Rand),
};

// Messages the engine words rather than the library (V8 on Node): the golden suite compares them on Node only.
const engineWorded = [...new Set(cases.flatMap(entry => entry.results.concat(entry.next ?? []))
  .filter(result => result && typeof result === 'object' && typeof result.$throws === 'string')
  .map(result => result.$throws)
  .filter(message => /is not a function|is not iterable|Cannot read properties|Cannot convert|Invalid array length/v.test(message)))].toSorted();

const header = {
  package: `seeded-random-utilities@${manifest.version}`,
  dependencies: {'rand-seed': dependency('rand-seed')},
  node: process.version,
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  captured: new Date().toISOString().slice(0, 10),
  note: 'Golden outputs of the published 2.0.0 from npm, with edge inputs and error classes; see test/golden/capture-2.0.0-npm.cjs and codec.cjs for the format.',
  shape,
  engineWorded,
};

// One case per line keeps the file diffable. Every character outside printable ASCII becomes a JSON escape.
const tab = String.fromCharCode(9);
const newline = String.fromCharCode(10);
const backslash = String.fromCharCode(92);
const headerText = JSON.stringify(header, undefined, tab).slice(0, -2);
const lines = cases.map(entry => JSON.stringify(entry));
const text = `${headerText},${newline}${tab}"cases": [${newline}${tab}${tab}${lines.join(`,${newline}${tab}${tab}`)}${newline}${tab}]${newline}}${newline}`;
let ascii = '';
for (const character of text) {
  for (let index = 0; index < character.length; index++) {
    const code = character.charCodeAt(index);
    ascii += code === 9 || code === 10 || (code >= 32 && code <= 126) ? character[index] : `${backslash}u${code.toString(16).padStart(4, '0')}`;
  }
}

process.stdout.write(ascii);
