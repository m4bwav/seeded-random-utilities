// A consumer written in CommonJS: require() of the installed package, used the way 1.1.4 code used it.
'use strict';

const assert = require('node:assert/strict');
const library = require('seeded-random-utilities');
// The way 1.1.4 code required it.
const SeededRandomUtilities = require('seeded-random-utilities').default;

assert.equal(typeof library, 'object');
assert.equal(typeof library.SeededRandomUtilities, 'function');
assert.equal(library.default, library.SeededRandomUtilities, 'default and SeededRandomUtilities are the same class');
assert.match(require.resolve('seeded-random-utilities'), /[/\\]dist[/\\]index\.cjs$/u, 'require resolves to the CommonJS build');

// 1.1.4 code, unchanged, gets 1.1.4's numbers.
const rng = new SeededRandomUtilities('1234');
assert.equal(rng.random(), 0.3111365893855691);
assert.deepEqual(new SeededRandomUtilities('1234').generateRandomArrayOfUniqueIntegers(3, 9), [9, 0, 3]);
assert.deepEqual(
  new SeededRandomUtilities('1234').shuffle(Array.from({length: 20}, (_, index) => index)),
  [8, 11, 16, 9, 15, 3, 2, 1, 14, 17, 5, 13, 0, 19, 12, 7, 4, 10, 18, 6],
);
assert.equal(new SeededRandomUtilities('1234', library.PRNG.xoshiro128ss).random(), 0.028131370898336172);
assert.equal(new SeededRandomUtilities(new library.Rand('1234', 'mulberry32')).random(), 0.7808577308896929);

console.log('cjs-node ok');
