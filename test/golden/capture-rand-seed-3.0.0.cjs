'use strict';
// Records rand-seed 3.0.0's xoshiro128ss and mulberry32 streams: an outside implementation to check PRNG.xoshiro128ssReference
// (rand-seed 2.0.0 and later implement xoshiro128** 1.1) and PRNG.mulberry32 against. Its sfc32 is not recorded: 3.0.0 changed it.
//
// Run it in a scratch project, never inside this repository:
//   npm init -y && npm install rand-seed@3.0.0
//   node capture-rand-seed-3.0.0.cjs > rand-seed-3.0.0.json

const {readFileSync} = require('node:fs');
const path = require('node:path');

const {default: Rand} = require('rand-seed');
// Its exports map hides package.json from require().
const {version} = JSON.parse(readFileSync(path.join(process.cwd(), 'node_modules', 'rand-seed', 'package.json'), 'utf8'));

const seeds = ['1234', '', 'seeded-random-utilities', '😀🎲 ünïcödé'];
const cases = [];
for (const seed of seeds) {
	for (const algorithm of ['xoshiro128ss', 'mulberry32']) {
		const rand = new Rand(seed, algorithm);
		cases.push({seed, algorithm, results: Array.from({length: 64}, () => rand.next())});
	}
}

const header = {
	package: `rand-seed@${version}`,
	node: process.version,
	captured: new Date().toISOString().slice(0, 10),
	note: 'rand-seed 3.0.0 streams; see test/golden/capture-rand-seed-3.0.0.cjs.',
};
const lines = cases.map(entry => JSON.stringify(entry));
process.stdout.write(`${JSON.stringify(header, null, '\t').slice(0, -2)},\n\t"cases": [\n\t\t${lines.join(',\n\t\t')}\n\t]\n}\n`);
