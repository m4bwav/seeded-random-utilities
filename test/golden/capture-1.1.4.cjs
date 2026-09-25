'use strict';
// Records what seeded-random-utilities 1.1.4 returns, so 2.0.0 can prove it returns the same.
//
// Run it in a scratch project, never inside this repository:
//   npm init -y && npm install seeded-random-utilities@1.1.4
//   node capture-1.1.4.cjs > 1.1.4.json
// A fresh install of 1.1.4 resolves rand-seed ^0.1.2 to 0.1.5; 0.1.2 to 0.1.5 share the
// same algorithm code, so the file is the same whichever of them was installed.
//
// Every case runs on a new instance: `new SeededRandomUtilities(seed, algorithm)`, then
// `skip` calls to random(), then `calls` calls of `method(...args)`, each with a fresh
// deep copy of `args` (shuffle with copy=false mutates its input). The "script" cases
// run several methods on one instance, which pins how many numbers each method draws.
// JSON cannot hold undefined or a thrown error, so results use {"$undefined": true} and
// {"$throws": "message"}; algorithm null means the constructor's default argument.

const pkg = require('seeded-random-utilities');
const packageVersion = require('seeded-random-utilities/package.json').version;
const randSeedVersion = require('rand-seed/package.json').version;

const SeededRandomUtilities = pkg.default;
const {PRNG, Rand} = pkg;

const algorithms = [PRNG.sfc32, PRNG.mulberry32, PRNG.xoshiro128ss];
const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
const twenty = Array.from({length: 20}, (_, index) => index);

const encode = value => (value === undefined ? {$undefined: true} : value);
const copy = value => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

function create(seed, algorithm) {
	return new SeededRandomUtilities(seed, algorithm === null ? undefined : algorithm);
}

function call(rng, method, args) {
	try {
		return encode(rng[method](...args.map(copy)));
	} catch (error) {
		return {$throws: error.message};
	}
}

function runCase(seed, algorithm, method, args, calls, skip = 0) {
	const rng = create(seed, algorithm);
	for (let index = 0; index < skip; index++) {
		rng.random();
	}

	const results = [];
	for (let index = 0; index < calls; index++) {
		results.push(call(rng, method, args));
	}

	return {seed, algorithm, method, args, skip, calls, results};
}

function runScript(seed, algorithm, steps) {
	const rng = create(seed, algorithm);
	const results = steps.map(([method, args]) => call(rng, method, args));
	return {seed, algorithm, method: 'script', steps, results};
}

// Every public method, several argument shapes, including the odd inputs 1.1.4 accepted.
const methodCases = [
	['random', [], 64],
	['getRandom', [], 8],
	['getRandomIntegar', [10], 32],
	['getRandomIntegar', [10, 5], 16],
	['getRandomIntegar', [100, -100], 16],
	['getRandomIntegar', [7.9, 1.5], 8],
	['getRandomIntegar', [0, 10], 8],
	['getRandomIntegar', [5, 5], 4],
	['getRandomArbitrary', [10], 16],
	['getRandomArbitrary', [10, 5], 16],
	['getRandomArbitrary', [0, 10], 8],
	['getRandomIntInclusive', [10], 32],
	['getRandomIntInclusive', [6, 1], 32],
	['getRandomIntInclusive', [10, 5], 16],
	['getRandomIntInclusive', [0, 10], 8],
	['getRandomBool', [], 64],
	['getRandomChar', [], 64],
	['selectRandomElement', [letters], 16],
	['selectRandomElement', [[]], 2],
	['selectRandomElement', [null], 1],
	['selectUniqueRandomElements', [twenty, 5], 8],
	['selectUniqueRandomElements', [letters, 1], 8],
	['selectUniqueRandomElements', [twenty, 0], 2],
	['selectUniqueRandomElements', [twenty, 20], 2],
	['selectUniqueRandomElements', [twenty, 25], 2],
	['selectUniqueRandomElements', [twenty, -1], 1],
	['shuffle', [twenty], 4],
	['shuffle', [twenty, false], 4],
	['shuffle', ['hello world'], 4],
	['shuffle', ['a😀b'], 2],
	['shuffle', [''], 1],
	['shuffle', [[]], 1],
	['shuffle', [null], 1],
	['chooseBooleanRandomlyWithProbability', [10, 3], 32],
	['chooseBooleanRandomlyWithProbability', [10], 32],
	['chooseBooleanRandomlyWithProbability', [4, 4], 4],
	['chooseBooleanRandomlyWithProbability', [3, 0], 4],
	['generateRandomArrayOfUniqueIntegers', [3, 9], 8],
	['generateRandomArrayOfUniqueIntegers', [10, 3], 2],
	['generateRandomArrayOfUniqueIntegers', [5, 100], 4],
	['generateRandomArrayOfUniqueIntegers', [5, 100, true], 4],
	['generateRandomArrayOfUniqueIntegers', [0, 5], 2],
	['generateRandomArrayOfUniqueIntegers', [1, 0], 2],
	['generateRandomArrayOfUniqueIntegers', [-1, 3], 1],
];

const script = [
	['random', []],
	['getRandomIntegar', [10]],
	['getRandomBool', []],
	['getRandomChar', []],
	['selectRandomElement', [letters]],
	['shuffle', [[1, 2, 3, 4, 5]]],
	['selectUniqueRandomElements', [letters, 3]],
	['chooseBooleanRandomlyWithProbability', [5, 2]],
	['generateRandomArrayOfUniqueIntegers', [3, 9]],
	['getRandomArbitrary', [2, 1]],
	['getRandomIntInclusive', [6, 1]],
	['shuffle', ['seeded']],
	['random', []],
];

const fullSeeds = ['1234', 'seeded-random-utilities'];
const streamSeeds = ['', 'a', 'The quick brown fox jumps over the lazy dog', '😀🎲 ünïcödé', 'x'.repeat(1000)];

const cases = [];
for (const seed of fullSeeds) {
	cases.push(runCase(seed, null, 'random', [], 16));
	for (const algorithm of algorithms) {
		for (const [method, args, calls] of methodCases) {
			cases.push(runCase(seed, algorithm, method, args, calls));
		}

		cases.push(runCase(seed, algorithm, 'random', [], 4, 10_000), runScript(seed, algorithm, script));
	}
}

for (const seed of [...fullSeeds, ...streamSeeds]) {
	for (const algorithm of [null, ...algorithms]) {
		if (fullSeeds.includes(seed) && algorithm !== null) {
			continue;
		}

		cases.push(runCase(seed, algorithm, 'random', [], 32), runCase(seed, algorithm, 'random', [], 4, 10_000));
	}
}

// Behaviour that 2.0.0 changes on purpose; recorded as evidence, not asserted as golden values.
// These call the constructor exactly as given (an explicit null is not the default argument).
function stream(seed, algorithm) {
	try {
		const rng = new SeededRandomUtilities(seed, algorithm);
		return Array.from({length: 8}, () => rng.random());
	} catch (error) {
		return {$throws: error.message};
	}
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const emptySeed = stream('', PRNG.sfc32);
const quirks = {
	emptyStringSeedIsDeterministic: same(stream('', PRNG.sfc32), stream('', PRNG.sfc32)),
	numberSeed1234EqualsEmptyStringSeed: same(stream(1234, PRNG.sfc32), emptySeed),
	numberSeed5678EqualsEmptyStringSeed: same(stream(5678, PRNG.sfc32), emptySeed),
	numberSeed0EqualsEmptyStringSeed: same(stream(0, PRNG.sfc32), emptySeed),
	nullSeedIsDeterministic: same(stream(null, PRNG.sfc32), stream(null, PRNG.sfc32)),
	undefinedSeedIsDeterministic: same(stream(undefined, PRNG.sfc32), stream(undefined, PRNG.sfc32)),
	unknownAlgorithmIsDeterministic: same(stream('1234', 'SFC32'), stream('1234', 'SFC32')),
	nullAlgorithmIsDeterministic: same(stream('1234', null), stream('1234', null)),
	arraySeed: stream(['1234'], PRNG.sfc32),
	randInstanceEqualsStringSeed: same(stream(new Rand('1234', PRNG.mulberry32)), stream('1234', PRNG.mulberry32)),
};

const header = {
	package: `seeded-random-utilities@${packageVersion}`,
	randSeed: randSeedVersion,
	node: process.version,
	captured: new Date().toISOString().slice(0, 10),
	note: 'Golden outputs of 1.1.4; see test/golden/capture-1.1.4.cjs for the format.',
	quirks,
};

// One case per line keeps the file diffable.
const lines = cases.map(entry => JSON.stringify(entry));
process.stdout.write(`${JSON.stringify(header, null, '\t').slice(0, -2)},\n\t"cases": [\n\t\t${lines.join(',\n\t\t')}\n\t]\n}\n`);
