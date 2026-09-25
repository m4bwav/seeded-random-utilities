import assert from 'node:assert/strict';
import {exec} from 'node:child_process';
import {access, readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../..', import.meta.url));
const read = file => readFile(new URL(`../../${file}`, import.meta.url), 'utf8');
const packageJson = JSON.parse(await read('package.json'));

const PUBLISHED_FILES = [
  'CHANGELOG.md',
  'LICENSE',
  'README.md',
  'dist/index.cjs',
  'dist/index.cjs.map',
  'dist/index.d.cts',
  'dist/index.d.mts',
  'dist/index.mjs',
  'dist/index.mjs.map',
  'package.json',
];

// The first build packed to about 36 kB, most of it the two source maps, which carry the TypeScript source for debuggers and bundlers.
const TARBALL_BUDGET = 45_000;

test('the tarball holds exactly the built files and the docs, and stays under the size budget', async () => {
  // --ignore-scripts: prepack would rebuild dist/ while the other test files are reading it.
  const stdout = await new Promise((resolve, reject) => {
    exec('npm pack --dry-run --json --ignore-scripts', {cwd: root, encoding: 'utf8'}, (error, output) => {
      if (error) {
        reject(error);
      } else {
        resolve(output);
      }
    });
  });
  const [packed] = JSON.parse(stdout);
  assert.deepEqual(new Set(packed.files.map(file => file.path)), new Set(PUBLISHED_FILES));
  assert.ok(packed.size < TARBALL_BUDGET, `the tarball is ${packed.size} bytes`);
});

test('package.json: entry points exist, no runtime dependencies, Node 20 and up', async () => {
  assert.equal(packageJson.type, 'module');
  assert.deepEqual(packageJson.exports, {
    '.': {import: './dist/index.mjs', require: './dist/index.cjs'},
    './package.json': './package.json',
  });
  assert.equal(packageJson.main, './dist/index.cjs');
  assert.equal(packageJson.module, './dist/index.mjs');
  assert.equal(packageJson.types, './dist/index.d.cts');
  for (const file of ['dist/index.mjs', 'dist/index.cjs', 'dist/index.d.mts', 'dist/index.d.cts']) {
    await access(new URL(`../../${file}`, import.meta.url));
  }

  assert.deepEqual(packageJson.dependencies ?? {}, {});
  assert.equal(packageJson.engines.node, '>=20');
  assert.equal(packageJson.sideEffects, false);
  assert.equal(packageJson.repository.url, 'git+https://github.com/m4bwav/seeded-random-utilities.git');
});

test('the builds use nothing Node-specific or browser-specific, so they run in browsers, Deno, Bun and workers', async () => {
  for (const file of ['dist/index.mjs', 'dist/index.cjs']) {
    const code = await read(file);
    assert.doesNotMatch(code, /\bnode:/u, `${file} imports a node: module`);
    assert.doesNotMatch(code, /\brequire\(/u, `${file} calls require()`);
    assert.doesNotMatch(code, /\bprocess\./u, `${file} uses process`);
    assert.doesNotMatch(code, /\bBuffer\b/u, `${file} uses Buffer`);
    assert.doesNotMatch(code, /\b__(?:dirname|filename)\b/u, `${file} uses __dirname or __filename`);
    assert.doesNotMatch(code, /\b(?:window|document|crypto)\b/u, `${file} uses a browser global`);
    // Only the unseeded path may use Math.random.
    assert.equal(code.match(/Math\.random/gu)?.length, 1, `${file} uses Math.random outside the unseeded path`);
  }
});

test('the builds keep rand-seed\'s MIT notice, which the inlined generators need', async () => {
  for (const file of ['dist/index.mjs', 'dist/index.cjs']) {
    const code = await read(file);
    assert.match(code, /Copyright \(c\) 2020 Michael Dzjaparidze/u, file);
    assert.match(code, /The above copyright notice and this permission notice shall be included/u, file);
  }

  assert.match(await read('LICENSE'), /Copyright \(c\) 2020 Michael Dzjaparidze/u, 'LICENSE');
});

test('the CommonJS build runs in a bare ECMAScript context, with no Node or browser globals', async () => {
  const context = vm.createContext({module: {exports: {}}});
  context.exports = context.module.exports;
  vm.runInContext(await read('dist/index.cjs'), context);
  const SeededRandomUtilities = context.module.exports.default;
  // The first number 1.1.4 gave for the seed '1234' (sfc32).
  assert.equal(new SeededRandomUtilities('1234').random(), 0.3111365893855691);
});

test('the declaration files need no Node types', async () => {
  for (const file of ['dist/index.d.mts', 'dist/index.d.cts']) {
    const types = await read(file);
    assert.doesNotMatch(types, /\bNodeJS\.|\bBuffer\b|node:|reference types=/u, file);
    assert.doesNotMatch(types, /sourceMappingURL/u, `${file} points at a declaration map that is not published`);
  }
});

test('the declaration files for ESM and CommonJS describe the same API', async () => {
  const [esm, cjs] = await Promise.all([read('dist/index.d.mts'), read('dist/index.d.cts')]);
  assert.equal(esm, cjs);
});
