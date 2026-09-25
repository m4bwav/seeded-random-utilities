'use strict';
// Records what the methods new in 2.0.0 return, so that later 2.x versions keep returning it (the review of pull request #17
// found that the unit tests check their properties, not their sequences).
//
// It was run once, on 2026-09-25, against the 2.0.0 build before the release: node test/golden/capture-2.0.0.cjs dist/index.cjs > test/golden/2.0.0.json
// Never run it again after 2.0.0 is published; the file is then the contract, like 1.1.4.json. Same encoding as capture-1.1.4.cjs.

const path = require('node:path');

const {default: SeededRandomUtilities} = require(path.resolve(process.argv[2]));

const algorithms = ['sfc32', 'mulberry32', 'xoshiro128ss', 'mulberry32Reference', 'xoshiro128ssReference'];

const encode = value => (value === undefined ? {$undefined: true} : value);
const copy = value => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

function call(rng, method, args) {
	try {
		return encode(rng[method](...args.map(copy)));
	} catch (error) {
		return {$throws: error.message};
	}
}

function runCase(seed, algorithm, method, args, calls, skip = 0) {
	const rng = new SeededRandomUtilities(seed, algorithm);
	for (let index = 0; index < skip; index++) {
		rng.random();
	}

	const results = [];
	for (let index = 0; index < calls; index++) {
		results.push(call(rng, method, args));
	}

	return {seed, algorithm, method, args, skip, calls, results};
}

const methodCases = [
	['random', [], 16],
	['getRandomInteger', [1, 7], 16],
	['getRandomInteger', [100], 8],
	['getRandomIntegerInclusive', [1, 6], 16],
	['getRandomFloat', [-1, 1], 8],
	['getRandomBool', [0.3], 16],
	['getRandomChar', ['ab😀🎲'], 8],
	['getRandomString', [12], 2],
	['getRandomString', [8, '01🎲'], 2],
	['selectWeightedRandomElement', [['a', 'b', 'c'], [1, 2, 7]], 16],
	['getUniqueRandomIntegers', [5, 100], 4],
	['getUniqueRandomIntegers', [3, 10, 20], 4],
	['shuffle', ['a😀b🎲c'], 4],
	['getState', [], 1, 10],
];

const script = [
	['getRandomInteger', [1, 7]],
	['getRandomBool', [0.5]],
	['getRandomString', [4]],
	['selectWeightedRandomElement', [['x', 'y'], [3, 1]]],
	['getUniqueRandomIntegers', [3, 50]],
	['shuffle', [[1, 2, 3, 4]]],
	['getRandomFloat', [10]],
	['getState', []],
];

const cases = [];
for (const seed of ['1234', 'seeded-random-utilities']) {
	for (const algorithm of algorithms) {
		for (const [method, args, calls, skip] of methodCases) {
			cases.push(runCase(seed, algorithm, method, args, calls, skip));
		}

		const rng = new SeededRandomUtilities(seed, algorithm);
		cases.push({seed, algorithm, method: 'script', steps: script, results: script.map(([method, args]) => call(rng, method, args))});
	}
}

const header = {
	package: 'seeded-random-utilities@2.0.0 (the build before its release)',
	node: process.version,
	captured: new Date().toISOString().slice(0, 10),
	note: 'Sequences of the methods new in 2.0.0; see test/golden/capture-2.0.0.cjs.',
};
const lines = cases.map(entry => JSON.stringify(entry));
process.stdout.write(`${JSON.stringify(header, null, '\t').slice(0, -2)},\n\t"cases": [\n\t\t${lines.join(',\n\t\t')}\n\t]\n}\n`);
