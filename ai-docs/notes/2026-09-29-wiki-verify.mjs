// wiki-verify for seeded-random-utilities@2.0.1 (2026-09-29; the 2.0.0 run is 2026-09-28-wiki-verify.mjs): runs every example on the wiki against the
// PUBLISHED package, never the working tree. The repository keeps this file as
// ai-docs/notes/2026-09-29-wiki-verify.mjs, and its output (seeded, so identical on every run)
// as 2026-09-29-wiki-verify.out.txt, so the next release can run it again and diff.
//
// Run it from a scratch folder outside the repository:
//   npm init -y
//   npm install seeded-random-utilities@2.0.1 typescript@6
//   node wiki-verify.mjs > wiki-verify.out.txt
//
// Optional environment, each adding a section:
//   V114=<folder with seeded-random-utilities@1.1.4 installed>, V113=<folder with @1.1.3>, V100=<folder with @1.0.0>
//       the old versions, for Versions and upgrading and the API reference's "since" column
//   GOLDEN=<the clone's test/golden folder>
//       replays capture-1.1.4.cjs against 1.1.4 today and against 2.0.0, and
//       capture-2.0.0.cjs against 2.0.0, and compares each with the golden files
//   RT=<folder with the npm packages deno and bun installed>
//       runs the Home example in Deno and Bun too
//
// Every case prints "## <label>" and then exactly what the code on the page prints with
// console.log. The package makes no requests; nothing here touches the network.

import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import util from 'node:util';

const PACKAGE = 'seeded-random-utilities';
const VERSION = '2.0.1';
const require = createRequire(import.meta.url);
const here = process.cwd();
const {V114, V113, V100, GOLDEN, RT} = process.env;

function show(label, value) {
	console.log(`## ${label}`);
	console.log(typeof value === 'string' ? value : util.inspect(value));
	console.log();
}

// Runs a page's example and prints what its console.log calls printed, line for line.
function example(label, fn) {
	const lines = [];
	const original = console.log;
	console.log = (...args) => lines.push(util.format(...args));
	try {
		fn();
	} catch (error) {
		lines.push(`${error.name}: ${error.message}`);
	} finally {
		console.log = original;
	}

	show(label, lines.join('\n'));
}

// The exception a call throws, as a page shows it.
function throws(fn) {
	try {
		return `returned ${util.inspect(fn())}`;
	} catch (error) {
		return `${error.name}: ${error.message}`;
	}
}

function node(args, cwd = here, runtime = process.execPath) {
	const p = spawnSync(runtime, args, {cwd, encoding: 'utf8', shell: runtime.endsWith('.cmd')});
	return `${p.stdout}${p.stderr ? `--- stderr\n${p.stderr}` : ''}`.trimEnd();
}

// ----- the installed package -----
const pkgDir = path.join(here, 'node_modules', PACKAGE);
const pkg = JSON.parse(readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
if (pkg.version !== VERSION) {
	throw new Error(`installed ${pkg.version}, expected ${VERSION}`);
}

show('installed', `${PACKAGE}@${pkg.version} on Node ${process.version}`);
const esm = await import(PACKAGE);
const cjs = require(PACKAGE);
const SeededRandomUtilities = esm.default;
const {PRNG, Rand} = esm;
show('esm exports', Object.keys(esm).sort());
show('cjs exports', Object.keys(cjs).sort());
show('cjs default, named export and static default are one class', cjs.default === cjs.SeededRandomUtilities && cjs.default.default === cjs.default);
show('esm and cjs classes are the same object', esm.default === cjs.default);
show('PRNG', PRNG);
show('PRNG is frozen', Object.isFrozen(PRNG));
show('instance methods (2.0.0)', Object.getOwnPropertyNames(SeededRandomUtilities.prototype).filter(n => n !== 'constructor').sort());
show('static members (2.0.0)', Object.getOwnPropertyNames(SeededRandomUtilities).filter(n => !['length', 'name', 'prototype'].includes(n)).sort());

// ----- Home -----
const homeCode = `import SeededRandomUtilities from 'seeded-random-utilities';

const rng = new SeededRandomUtilities('level-1');

console.log(rng.getRandomInteger(1, 7));
console.log(rng.selectRandomElement(['sword', 'shield', 'potion']));
console.log(rng.shuffle([1, 2, 3, 4, 5]));
console.log(rng.getRandomString(8));
`;
writeFileSync('home.mjs', homeCode);
writeFileSync('home.cjs', homeCode.replace(
	"import SeededRandomUtilities from 'seeded-random-utilities';",
	"const {SeededRandomUtilities} = require('seeded-random-utilities');"));
writeFileSync('home-deno.mjs', homeCode.replace("from 'seeded-random-utilities'", `from 'npm:seeded-random-utilities@${VERSION}'`));
show('home: node home.mjs', node(['home.mjs']));
show('home: node home.mjs, second run', node(['home.mjs']));
show('home: node home.cjs', node(['home.cjs']));
if (RT) {
	const bin = name => path.join(RT, 'node_modules', '.bin', process.platform === 'win32' ? `${name}.cmd` : name);
	show('home: deno version', node(['--version'], here, bin('deno')).split('\n')[0]);
	show('home: deno run home-deno.mjs', node(['run', 'home-deno.mjs'], here, bin('deno')));
	show('home: bun version', node(['--version'], here, bin('bun')));
	show('home: bun home.mjs', node(['home.mjs'], here, bin('bun')));
	show('home: bun home.cjs', node(['home.cjs'], here, bin('bun')));
}

// ----- Getting started: types -----
mkdirSync('types', {recursive: true});
writeFileSync('types/ok.mts', `import SeededRandomUtilities, {PRNG, type GeneratorState, type Seed} from 'seeded-random-utilities';

const seed: Seed = 42;
const rng = new SeededRandomUtilities(seed, PRNG.mulberry32);
const other = new SeededRandomUtilities('x', 'xoshiro128ssReference');
const item: string | undefined = rng.selectRandomElement(['a', 'b']);
const text: string = rng.shuffle('abc');
const list: number[] = rng.shuffle([1, 2, 3]);
const state: GeneratorState = other.getState();
console.log(item, text, list, state.algorithm);
`);
writeFileSync('types/wrong.mts', `import SeededRandomUtilities from 'seeded-random-utilities';

const rng = new SeededRandomUtilities('x', 'SFC32');
const item: string = rng.selectRandomElement(['a', 'b']);
`);
writeFileSync('types/ok.cts', `import SeededRandomUtilities = require('seeded-random-utilities');

const rng = new SeededRandomUtilities.SeededRandomUtilities('x', SeededRandomUtilities.PRNG.sfc32);
console.log(rng.getRandomInteger(10));
`);
const tsc = path.join(here, 'node_modules', 'typescript', 'bin', 'tsc');
const tscArgs = ['--noEmit', '--strict', '--module', 'nodenext', '--moduleResolution', 'nodenext', '--target', 'es2022', '--lib', 'es2022,dom'];
show('types: tsc version', node([tsc, '--version']));
show('types: tsc ok.mts ok.cts (nodenext, strict)', node([tsc, ...tscArgs, 'types/ok.mts', 'types/ok.cts']) || '(no output: it compiles)');
show('types: tsc wrong.mts', node([tsc, ...tscArgs, 'types/wrong.mts']));

// ----- API reference: one call of each member, in this order, on one generator -----
example('api: every method on seed api', () => {
	const rng = new SeededRandomUtilities('api');
	console.log(rng.random());
	console.log(rng.getRandom());
	console.log(rng.getRandomInteger(10));
	console.log(rng.getRandomInteger(1, 7));
	console.log(rng.getRandomIntegerInclusive(1, 6));
	console.log(rng.getRandomFloat(-1, 1));
	console.log(rng.getRandomBool());
	console.log(rng.getRandomBool(0.9));
	console.log(rng.getRandomChar());
	console.log(rng.getRandomChar('ACGT'));
	console.log(rng.getRandomString(12));
	console.log(rng.getRandomString(6, '0123456789abcdef'));
	console.log(rng.selectRandomElement(['red', 'green', 'blue']));
	console.log(rng.selectUniqueRandomElements(['a', 'b', 'c', 'd', 'e', 'f'], 3));
	console.log(rng.selectWeightedRandomElement(['common', 'uncommon', 'rare'], [70, 25, 5]));
	console.log(rng.getUniqueRandomIntegers(5, 1, 50));
	console.log(rng.shuffle(['a', 'b', 'c', 'd']));
	console.log(rng.shuffle('hello'));
	console.log(rng.chooseBooleanRandomlyWithProbability(4, 1));
	console.log(rng.getState());
});
example('api: shuffle in place', () => {
	const rng = new SeededRandomUtilities('api');
	const deck = [1, 2, 3, 4, 5];
	const same = rng.shuffle(deck, false);
	console.log(same === deck, deck);
});
example('api: Rand', () => {
	const rand = new Rand('1234', PRNG.mulberry32);
	const rng = new SeededRandomUtilities('1234', PRNG.mulberry32);
	console.log(rand.next(), rng.random());
});
example('api: fromState', () => {
	const rng = new SeededRandomUtilities('save-me');
	rng.random();
	const saved = JSON.stringify(rng.getState());
	console.log(saved);
	const next = rng.random();
	const resumed = SeededRandomUtilities.fromState(JSON.parse(saved));
	console.log(resumed.random() === next);
});
example('api: a random source object', () => {
	let n = 0;
	const steps = {next: () => (n++ % 4) / 4};
	const rng = new SeededRandomUtilities(steps);
	console.log(rng.random(), rng.random(), rng.getRandomInteger(1, 5), rng.getRandomBool());
});
example('api: rng.random is bound', () => {
	const rng = new SeededRandomUtilities('bound');
	const {random} = rng;
	console.log(Array.from({length: 3}, random));
});
example('api: deprecated names and their replacements', () => {
	const a = new SeededRandomUtilities('old');
	const b = new SeededRandomUtilities('old');
	console.log(a.getRandomIntegar(10, 1), b.getRandomInteger(1, 10));
	console.log(a.getRandomArbitrary(10, 1), b.getRandomFloat(1, 10));
	console.log(a.getRandomIntInclusive(6, 1), b.getRandomIntegerInclusive(1, 6));
	console.log(a.generateRandomArrayOfUniqueIntegers(3, 9), b.getUniqueRandomIntegers(3, 0, 10));
});

// ----- Same seed, same sequence (the reproducibility page) -----
example('repro: first three numbers per algorithm, seed 1234', () => {
	for (const algorithm of Object.values(PRNG)) {
		const rng = new SeededRandomUtilities('1234', algorithm);
		console.log(algorithm.padEnd(22), [rng.random(), rng.random(), rng.random()].join(' '));
	}
});
example('repro: seeds', () => {
	const first = seed => new SeededRandomUtilities(seed).random();
	console.log(first(42) === first('42'));
	console.log(first('') === first(''));
	console.log(first('') === first(' '));
	console.log(first(undefined) === first(undefined));
	console.log(first(new String('abc')) === first('abc'));
	console.log(first(0.1 + 0.2) === first('0.30000000000000004'));
});
example('repro: the default algorithm is sfc32, also for null', () => {
	const first = algorithm => new SeededRandomUtilities('1234', algorithm).random();
	console.log(first(undefined) === first('sfc32'), first(null) === first('sfc32'));
});
example('repro: esm and cjs builds agree', () => {
	const a = new esm.default('same');
	const b = new cjs.SeededRandomUtilities('same');
	console.log(Array.from({length: 1000}, () => a.random() === b.random()).every(Boolean));
});
example('repro: draws per call', () => {
	let draws = 0;
	const counted = new Rand('count');
	const source = {next() {
		draws++;
		return counted.next();
	}};
	const rng = new SeededRandomUtilities(source);
	const count = (label, fn) => {
		draws = 0;
		fn();
		console.log(label.padEnd(44), draws);
	};

	const ten = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
	count('random()', () => rng.random());
	count('getRandomInteger(1, 7)', () => rng.getRandomInteger(1, 7));
	count('getRandomFloat(0, 1)', () => rng.getRandomFloat(0, 1));
	count('getRandomBool()', () => rng.getRandomBool());
	count('getRandomChar()', () => rng.getRandomChar());
	count('getRandomString(8)', () => rng.getRandomString(8));
	count('selectWeightedRandomElement(3 items)', () => rng.selectWeightedRandomElement(['x', 'y', 'z'], [1, 1, 1]));
	count('getUniqueRandomIntegers(3, 1000)', () => rng.getUniqueRandomIntegers(3, 1000));
	count('shuffle(10 items)', () => rng.shuffle(ten));
	count('shuffle("hello")', () => rng.shuffle('hello'));
	for (let i = 0; i < 3; i++) {
		count(`selectRandomElement(10 items), call ${i + 1}`, () => rng.selectRandomElement(ten));
	}

	count('selectUniqueRandomElements(10 items, 3)', () => rng.selectUniqueRandomElements(ten, 3));
	count('chooseBooleanRandomlyWithProbability(4)', () => rng.chooseBooleanRandomlyWithProbability(4));
	count('generateRandomArrayOfUniqueIntegers(3, 9)', () => rng.generateRandomArrayOfUniqueIntegers(3, 9));
});
example('repro: adding a call shifts every later number', () => {
	const a = new SeededRandomUtilities('shift');
	const b = new SeededRandomUtilities('shift');
	b.getRandomBool();
	console.log(a.getRandomInteger(100), a.getRandomInteger(100));
	console.log(b.getRandomInteger(100), b.getRandomInteger(100));
});
example('repro: independent streams', () => {
	const world = 'world-42';
	const terrain = new SeededRandomUtilities(`${world}:terrain`);
	const loot = new SeededRandomUtilities(`${world}:loot`);
	const first = terrain.getRandomInteger(100);
	loot.getRandomInteger(100);
	loot.getRandomInteger(100);
	const again = new SeededRandomUtilities(`${world}:terrain`);
	console.log(first === again.getRandomInteger(100));
});
example('repro: mulberry32 and mulberry32Reference part ways', () => {
	const a = new SeededRandomUtilities('1234', 'mulberry32');
	const b = new SeededRandomUtilities('1234', 'mulberry32Reference');
	let draw = 0;
	while (a.random() === b.random() && draw < 10_000_000) {
		draw++;
	}

	console.log(`first different draw: ${draw + 1}`);
});
example('repro: xoshiro128ss and xoshiro128ssReference', () => {
	const a = new SeededRandomUtilities('1234', 'xoshiro128ss');
	const b = new SeededRandomUtilities('1234', 'xoshiro128ssReference');
	console.log(a.random(), b.random());
});
example('repro: unseeded', () => {
	const rng = new SeededRandomUtilities();
	console.log(throws(() => rng.getState()));
});

// ----- Errors and edge cases -----
example('errors: weights that overflow to Infinity', () => {
	const rng = new SeededRandomUtilities('errors');
	console.log(throws(() => rng.selectWeightedRandomElement(['a', 'b'], [Number.MAX_VALUE, Number.MAX_VALUE])));
});

example('errors: every message', () => {
	const rng = new SeededRandomUtilities('errors');
	const cases = [
		['new SeededRandomUtilities(\'x\', \'SFC32\')', () => new SeededRandomUtilities('x', 'SFC32')],
		['new SeededRandomUtilities([\'x\'])', () => new SeededRandomUtilities(['x'])],
		['new SeededRandomUtilities(NaN)', () => new SeededRandomUtilities(Number.NaN)],
		['new SeededRandomUtilities({})', () => new SeededRandomUtilities({})],
		['new Rand(\'x\', \'nope\')', () => new Rand('x', 'nope')],
		['getRandomInteger(5, 1)', () => rng.getRandomInteger(5, 1)],
		['getRandomInteger(1.2, 1.8)', () => rng.getRandomInteger(1.2, 1.8)],
		['getRandomInteger(0)', () => rng.getRandomInteger(0)],
		['getRandomInteger(1, Infinity)', () => rng.getRandomInteger(1, Infinity)],
		['getRandomInteger(0, 2 ** 33)', () => rng.getRandomInteger(0, 2 ** 33)],
		['getRandomInteger(2 ** 53, 2 ** 53 + 10)', () => rng.getRandomInteger(2 ** 53, (2 ** 53) + 10)],
		['getRandomIntegerInclusive(3, 2)', () => rng.getRandomIntegerInclusive(3, 2)],
		['getRandomFloat(1, 0)', () => rng.getRandomFloat(1, 0)],
		['getRandomFloat(-Number.MAX_VALUE, Number.MAX_VALUE)', () => rng.getRandomFloat(-Number.MAX_VALUE, Number.MAX_VALUE)],
		['getRandomFloat(\'1\')', () => rng.getRandomFloat('1')],
		['getRandomBool(2)', () => rng.getRandomBool(2)],
		['getRandomBool(\'0.5\')', () => rng.getRandomBool('0.5')],
		['getRandomChar(\'\')', () => rng.getRandomChar('')],
		['getRandomChar(42)', () => rng.getRandomChar(42)],
		['getRandomString(-1)', () => rng.getRandomString(-1)],
		['getRandomString(2 ** 25)', () => rng.getRandomString(2 ** 25)],
		['selectRandomElement(null)', () => rng.selectRandomElement(null)],
		['selectUniqueRandomElements([1], -1)', () => rng.selectUniqueRandomElements([1], -1)],
		['selectWeightedRandomElement([\'a\'], [1, 2])', () => rng.selectWeightedRandomElement(['a'], [1, 2])],
		['selectWeightedRandomElement([\'a\', \'b\'], [0, 0])', () => rng.selectWeightedRandomElement(['a', 'b'], [0, 0])],
		['selectWeightedRandomElement([\'a\'], [-1])', () => rng.selectWeightedRandomElement(['a'], [-1])],
		['selectWeightedRandomElement(\'ab\', [1, 1])', () => rng.selectWeightedRandomElement('ab', [1, 1])],
		['getUniqueRandomIntegers(11, 10)', () => rng.getUniqueRandomIntegers(11, 10)],
		['getUniqueRandomIntegers(1.5, 10)', () => rng.getUniqueRandomIntegers(1.5, 10)],
		['generateRandomArrayOfUniqueIntegers(-1, 3)', () => rng.generateRandomArrayOfUniqueIntegers(-1, 3)],
		['SeededRandomUtilities.fromState({})', () => SeededRandomUtilities.fromState({})],
		['SeededRandomUtilities.fromState({algorithm: \'sfc32\', state: [0, 0, 0, 0]})', () => SeededRandomUtilities.fromState({algorithm: 'sfc32', state: [0, 0, 0, 0]})],
		['new SeededRandomUtilities(new Rand(\'x\')).getState()', () => new SeededRandomUtilities(new Rand('x')).getState()],
	];
	for (const [call, fn] of cases) {
		console.log(`${call}\n  ${throws(fn)}`);
	}
});
example('edge: odd inputs that do not throw', () => {
	const rng = new SeededRandomUtilities('edge');
	const cases = [
		['selectRandomElement([])', () => rng.selectRandomElement([])],
		['selectUniqueRandomElements([1, 2, 3], 5)', () => rng.selectUniqueRandomElements([1, 2, 3], 5)],
		['selectUniqueRandomElements([1, 2, 3], 0)', () => rng.selectUniqueRandomElements([1, 2, 3], 0)],
		['selectWeightedRandomElement([\'a\', \'b\', \'c\'], [0, 1, 0])', () => rng.selectWeightedRandomElement(['a', 'b', 'c'], [0, 1, 0])],
		['getRandomInteger(1.5, 4.5)', () => rng.getRandomInteger(1.5, 4.5)],
		['getRandomInteger(-3, -1)', () => rng.getRandomInteger(-3, -1)],
		['getRandomIntegerInclusive(7, 7)', () => rng.getRandomIntegerInclusive(7, 7)],
		['getRandomFloat(5, 5)', () => rng.getRandomFloat(5, 5)],
		['getRandomBool(0)', () => rng.getRandomBool(0)],
		['getRandomBool(1)', () => rng.getRandomBool(1)],
		['getRandomString(0)', () => rng.getRandomString(0)],
		['getRandomString(4, \'🎲🃏\')', () => rng.getRandomString(4, '🎲🃏')],
		['getUniqueRandomIntegers(0, 10)', () => rng.getUniqueRandomIntegers(0, 10)],
		['getUniqueRandomIntegers(3, 3)', () => rng.getUniqueRandomIntegers(3, 3)],
		['shuffle(\'\')', () => rng.shuffle('')],
		['shuffle(null)', () => rng.shuffle(null)],
		['shuffle([])', () => rng.shuffle([])],
		['shuffle(\'a😀b\')', () => rng.shuffle('a😀b')],
		['chooseBooleanRandomlyWithProbability(3, 0)', () => rng.chooseBooleanRandomlyWithProbability(3, 0)],
		['chooseBooleanRandomlyWithProbability(4, 4)', () => rng.chooseBooleanRandomlyWithProbability(4, 4)],
		['getRandomIntegar(0, 10) (deprecated, reversed bounds)', () => rng.getRandomIntegar(0, 10)],
		['getRandomIntegar(5, 5) (deprecated, empty range)', () => rng.getRandomIntegar(5, 5)],
		['generateRandomArrayOfUniqueIntegers(10, 3)', () => rng.generateRandomArrayOfUniqueIntegers(10, 3)],
		['generateRandomArrayOfUniqueIntegers(3, 9, true)', () => rng.generateRandomArrayOfUniqueIntegers(3, 9, true)],
		['new SeededRandomUtilities(undefined, \'nope\').random() < 1', () => new SeededRandomUtilities(undefined, 'nope').random() < 1],
	];
	for (const [call, fn] of cases) {
		console.log(`${call}\n  ${throws(fn)}`);
	}
});
example('edge: getRandomFloat can return max on a tiny range', () => {
	const rng = new SeededRandomUtilities('tiny');
	const max = 1 + Number.EPSILON;
	const hits = Array.from({length: 100}, () => rng.getRandomFloat(1, max)).filter(x => x === max).length;
	console.log(`${hits} of 100 draws returned max`);
});

// ----- Recipes -----
example('recipes: dice', () => {
	const rng = new SeededRandomUtilities('dice');
	const roll = (count, sides) => Array.from({length: count}, () => rng.getRandomIntegerInclusive(1, sides));
	const rolls = roll(3, 6);
	console.log(rolls, rolls.reduce((a, b) => a + b, 0));
	console.log(roll(1, 20));
});
example('recipes: loot table', () => {
	const rng = new SeededRandomUtilities('chest-17');
	const table = [
		{item: 'gold', weight: 60},
		{item: 'potion', weight: 30},
		{item: 'ring', weight: 9},
		{item: 'dragon egg', weight: 1},
	];
	const drop = () => rng.selectWeightedRandomElement(table, table.map(row => row.weight)).item;
	console.log(Array.from({length: 8}, drop));
});
example('recipes: deal cards', () => {
	const rng = new SeededRandomUtilities('game-8812');
	const suits = ['♠', '♥', '♦', '♣'];
	const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
	const deck = rng.shuffle(suits.flatMap(suit => ranks.map(rank => rank + suit)));
	console.log(deck.slice(0, 5).join(' '), '|', deck.slice(5, 10).join(' '));
});
example('recipes: save and resume', () => {
	const rng = new SeededRandomUtilities('campaign-3');
	rng.getRandomInteger(100);
	const save = JSON.stringify({level: 4, rng: rng.getState()});
	const expected = [rng.getRandomInteger(100), rng.getRandomInteger(100)];
	const loaded = JSON.parse(save);
	const resumed = SeededRandomUtilities.fromState(loaded.rng);
	console.log(save);
	console.log([resumed.getRandomInteger(100), resumed.getRandomInteger(100)], expected);
});
example('recipes: daily seed', () => {
	const daily = date => new SeededRandomUtilities(`daily:${date.toISOString().slice(0, 10)}`);
	const today = new Date('2026-09-28T09:00:00Z');
	const later = new Date('2026-09-28T23:00:00Z');
	console.log(daily(today).getRandomInteger(1000), daily(later).getRandomInteger(1000));
});
example('recipes: sample without replacement', () => {
	const rng = new SeededRandomUtilities('survey');
	const people = ['Ada', 'Ben', 'Cy', 'Dee', 'Eve', 'Fay', 'Gus', 'Hal'];
	console.log(rng.selectUniqueRandomElements(people, 3));
	console.log(rng.getUniqueRandomIntegers(3, 1_000_000_000));
});
example('recipes: a seeded Math.random for another function', () => {
	const rng = new SeededRandomUtilities('jitter');
	const jitter = (value, random = Math.random) => value + ((random() - 0.5) * 0.1);
	console.log(jitter(1, rng.random), jitter(1, rng.random));
});
example('recipes: log the seed in a test', () => {
	const seed = 'run-2026-09-28';
	const rng = new SeededRandomUtilities(seed);
	const input = rng.getUniqueRandomIntegers(5, 100);
	console.log(`seed ${seed}:`, input);
});
example('recipes: random ids that are not secret', () => {
	const rng = new SeededRandomUtilities('fixtures');
	console.log(Array.from({length: 3}, () => rng.getRandomString(6, 'abcdefghijklmnopqrstuvwxyz0123456789')));
});

// ----- FAQ -----
example('faq: a Date as the seed', () => {
	const when = new Date('2026-09-28T12:00:00Z');
	try {
		new SeededRandomUtilities(when);
	} catch (error) {
		console.log(error.name);
	}

	console.log(new SeededRandomUtilities(when.toISOString()).getRandomInteger(100));
	console.log(new SeededRandomUtilities(when.getTime()).getRandomInteger(100));
});
example('faq: instanceof across the two builds', () => {
	const fromImport = new esm.SeededRandomUtilities('x');
	console.log(fromImport instanceof cjs.SeededRandomUtilities, fromImport instanceof esm.SeededRandomUtilities);
	console.log(cjs.SeededRandomUtilities.fromState(fromImport.getState()).random() === fromImport.random());
});

// ----- Old versions: Versions and upgrading, and the API reference's "since" column -----
function oldPackage(folder) {
	const oldRequire = createRequire(path.join(folder, 'package.json'));
	return {
		mod: oldRequire(PACKAGE),
		version: JSON.parse(readFileSync(path.join(folder, 'node_modules', PACKAGE, 'package.json'), 'utf8')).version,
		randSeed: JSON.parse(readFileSync(path.join(folder, 'node_modules', 'rand-seed', 'package.json'), 'utf8')).version,
	};
}

for (const [name, folder] of [['1.0.0', V100], ['1.1.3', V113], ['1.1.4', V114]]) {
	if (!folder) {
		continue;
	}

	const old = oldPackage(folder);
	const Old = old.mod.default;
	show(`v${name}: installed`, `${PACKAGE}@${old.version} with rand-seed ${old.randSeed}`);
	show(`v${name}: require() exports`, Object.keys(old.mod).sort());
	show(`v${name}: instance methods`, Object.getOwnPropertyNames(Old.prototype).filter(n => n !== 'constructor').sort());
	show(`v${name}: PRNG`, old.mod.PRNG);
}

if (V114) {
	const Old = oldPackage(V114).mod.default;
	example('v1.1.4 and 2.0.0: the same calls', () => {
		const a = new Old('level-1');
		const b = new SeededRandomUtilities('level-1');
		console.log(a.getRandomIntegar(7, 1), b.getRandomInteger(1, 7));
		console.log(a.getRandomArbitrary(1, -1), b.getRandomFloat(-1, 1));
		console.log(a.getRandomIntInclusive(6, 1), b.getRandomIntegerInclusive(1, 6));
		console.log(a.getRandomBool(), b.getRandomBool());
		console.log(a.getRandomChar(), b.getRandomChar());
		console.log(a.shuffle([1, 2, 3, 4, 5]), b.shuffle([1, 2, 3, 4, 5]));
		console.log(a.generateRandomArrayOfUniqueIntegers(3, 9), b.generateRandomArrayOfUniqueIntegers(3, 9));
	});
	example('v1.1.4 and 2.0.0: number seeds', () => {
		const first = (Cls, seed) => new Cls(seed).random();
		console.log(first(Old, 42), first(Old, 7), first(Old, ''));
		console.log(first(SeededRandomUtilities, 42), first(SeededRandomUtilities, '42'));
	});
	example('v1.1.4 and 2.0.0: an unknown algorithm name', () => {
		const old = new Old('1234', 'SFC32');
		console.log(old.random() === new Old('1234', 'SFC32').random());
		console.log(throws(() => new SeededRandomUtilities('1234', 'SFC32')));
	});
	example('v1.1.4 and 2.0.0: shuffling a string with an emoji', () => {
		const oldResult = new Old('1234').shuffle('a😀b');
		const newResult = new SeededRandomUtilities('1234').shuffle('a😀b');
		console.log(JSON.stringify(oldResult), [...oldResult].length, oldResult.isWellFormed());
		console.log(JSON.stringify(newResult), [...newResult].length, newResult.isWellFormed());
	});
	example('v1.1.4 and 2.0.0: getRandomBool as an array callback', () => {
		const a = new Old('cb');
		const b = new SeededRandomUtilities('cb');
		console.log([0.1, 0.9].map(a.getRandomBool, a));
		console.log(throws(() => ['x', 'y'].map(b.getRandomBool, b)));
		console.log([0.1, 0.9].map(() => b.getRandomBool()));
	});
	example('v1.1.4 and 2.0.0: import from an ES module', () => {
		const out = node(['--input-type=module', '-e', "import S from 'seeded-random-utilities'; console.log(typeof S, typeof S.default);"], V114);
		console.log(out);
	});
}

// 1.0.0 to 1.1.3 shuffle with Math.random: the same seed does not give the same shuffle. 1.1.4 fixed it.
for (const [name, folder] of [['1.0.0', V100], ['1.1.3', V113], ['1.1.4', V114]]) {
	if (!folder) {
		continue;
	}

	const Old = oldPackage(folder).mod.default;
	example(`v${name}: the same seed, the same shuffle?`, () => {
		const deck = Array.from({length: 20}, (_, i) => i);
		const runs = Array.from({length: 5}, () => JSON.stringify(new Old('deck').shuffle(deck)));
		console.log(new Set(runs).size === 1);
		console.log(JSON.stringify(new Old('deck').generateRandomArrayOfUniqueIntegers(20, 30)) === JSON.stringify(new Old('deck').generateRandomArrayOfUniqueIntegers(20, 30)));
	});
	show(`v${name}: types exported from index.d.ts`, readFileSync(path.join(folder, 'node_modules', PACKAGE, 'dist', 'index.d.ts'), 'utf8').match(/export \{ \w+ \}/g).join(', '));
}

// ----- the golden captures, replayed today -----
if (GOLDEN && V114) {
	const withoutRunInfo = file => {
		const data = JSON.parse(readFileSync(file, 'utf8'));
		return {cases: data.cases, quirks: data.quirks};
	};

	const compare = (label, got, want) => {
		const differing = got.cases.map((c, i) => JSON.stringify(c) === JSON.stringify(want.cases[i]) ? null : i).filter(i => i !== null);
		const lines = [`${got.cases.length} cases, ${got.cases.length - differing.length} identical to the golden file`];
		for (const i of differing) {
			const c = want.cases[i];
			lines.push(`differs: ${c.method}(${JSON.stringify(c.args ?? c.steps).slice(0, 60)}) seed ${JSON.stringify(c.seed).slice(0, 20)} ${c.algorithm}`);
		}

		if (got.quirks || want.quirks) {
			for (const key of Object.keys(want.quirks ?? {})) {
				if (JSON.stringify(got.quirks?.[key]) !== JSON.stringify(want.quirks[key])) {
					lines.push(`quirk ${key}: golden ${JSON.stringify(want.quirks[key])}, now ${JSON.stringify(got.quirks?.[key])}`);
				}
			}
		}

		show(label, lines.join('\n'));
	};

	copyFileSync(path.join(GOLDEN, 'capture-1.1.4.cjs'), path.join(V114, 'capture-1.1.4.cjs'));
	writeFileSync(path.join(V114, 'today-1.1.4.json'), node(['capture-1.1.4.cjs'], V114));
	compare('golden: 1.1.4 today against test/golden/1.1.4.json', withoutRunInfo(path.join(V114, 'today-1.1.4.json')), withoutRunInfo(path.join(GOLDEN, '1.1.4.json')));
	// The same capture script against 2.0.0: only the line reading rand-seed's version changes.
	const script = readFileSync(path.join(GOLDEN, 'capture-1.1.4.cjs'), 'utf8').replace("require('rand-seed/package.json').version", "'none'");
	writeFileSync('capture-1.1.4-on-2.0.0.cjs', script);
	writeFileSync('today-2.0.0-as-1.1.4.json', node(['capture-1.1.4-on-2.0.0.cjs']));
	compare('golden: 2.0.0 today against test/golden/1.1.4.json', withoutRunInfo('today-2.0.0-as-1.1.4.json'), withoutRunInfo(path.join(GOLDEN, '1.1.4.json')));
	copyFileSync(path.join(GOLDEN, 'capture-2.0.0.cjs'), 'capture-2.0.0.cjs');
	// It takes the build to load; here the published CommonJS build. The golden file is only compared, never rewritten.
	writeFileSync('today-2.0.0.json', node(['capture-2.0.0.cjs', path.join(pkgDir, 'dist', 'index.cjs')]));
	compare('golden: 2.0.0 today against test/golden/2.0.0.json', withoutRunInfo('today-2.0.0.json'), withoutRunInfo(path.join(GOLDEN, '2.0.0.json')));
}

show('done', existsSync('home.mjs') ? 'ok' : 'missing files');
