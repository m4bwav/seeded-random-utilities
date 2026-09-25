// A consumer written as an ES module: default and named imports of the installed package, then every golden case of 1.1.4.
// Usage: node index.js <path to 1.1.4.json>. Runs under Node, Bun and Deno.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import process from 'node:process';
import SeededRandomUtilities, {PRNG, Rand, SeededRandomUtilities as Named} from 'seeded-random-utilities';

assert.equal(SeededRandomUtilities, Named, 'the default export is the named export');
if (typeof import.meta.resolve === 'function') {
  assert.match(import.meta.resolve('seeded-random-utilities'), /\/dist\/index\.mjs$/u, 'import resolves to the ESM build');
}

assert.equal(new SeededRandomUtilities('1234', PRNG.mulberry32).random(), 0.7808577308896929);
assert.equal(new Rand('1234').next(), 0.3111365893855691);

// The golden cases, encoded as the capture encoded them. Strings with emoji shuffle by character since 2.0.0 (the test suite checks those).
const golden = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const hasAstral = value => typeof value === 'string' && /[\u{10000}-\u{10FFFF}]/u.test(value);

function call(rng, method, arguments_) {
  try {
    const value = rng[method](...arguments_.map(argument => structuredClone(argument)));
    return value === undefined ? {$undefined: true} : value;
  } catch (error) {
    return {$throws: error.message};
  }
}

let checked = 0;
for (const entry of golden.cases) {
  if (entry.method === 'shuffle' && hasAstral(entry.args[0])) {
    continue;
  }

  const rng = new SeededRandomUtilities(entry.seed, entry.algorithm ?? undefined);
  let results;
  if (entry.method === 'script') {
    results = entry.steps.map(([method, arguments_]) => call(rng, method, arguments_));
  } else {
    for (let draw = 0; draw < entry.skip; draw++) {
      rng.random();
    }

    results = Array.from({length: entry.calls}, () => call(rng, entry.method, entry.args));
  }

  // eslint-disable-next-line unicorn/prefer-structured-clone -- through JSON, as the capture wrote them
  assert.deepEqual(JSON.parse(JSON.stringify(results)), entry.results, `golden case ${checked}`);
  checked++;
}

assert.ok(checked > 300, `only ${checked} golden cases ran`);
console.log('esm-node ok');
