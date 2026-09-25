/*
Consumer fixtures: install the package into a scratch project outside the repository, and use each published artifact the way a consumer would. Needs the network once to install TypeScript and the Node types into that project (the npm cache usually has them).

- By default the package is the tarball `npm pack` makes from the current dist/; `npm run test:consumers` builds dist/ first. CI builds once on Node 24 and runs this file directly on each Node line, because the build tools need Node 22.18 or later.
- CONSUMER_PACKAGE=seeded-random-utilities@<version> installs that version from the registry instead of packing; verify-published.yml checks a release this way.
- CONSUMER_RUNTIMES=bun,deno also runs the ES module fixture (with every 1.1.4 golden case) and the CommonJS fixture (Bun only) under Bun and Deno; the CI Bun and Deno jobs set it. A runtime it names must be installed.
*/
import assert from 'node:assert/strict';
import {exec, execFile} from 'node:child_process';
import {
  copyFile,
  cp,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {after, before, test} from 'node:test';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../..', import.meta.url));
const fixtures = fileURLToPath(new URL('.', import.meta.url));
const golden = fileURLToPath(new URL('../golden/1.1.4.json', import.meta.url));

const RUNTIME_FIXTURES = ['esm-node', 'cjs-node'];
const TYPE_FIXTURES = ['ts-nodenext-esm', 'ts-nodenext-cjs', 'ts-bundler', 'ts-node10'];
const RUNTIME_NAMES = {bun: 'Bun', deno: 'Deno'};

const registryPackage = process.env.CONSUMER_PACKAGE;
const runtimes = new Set((process.env.CONSUMER_RUNTIMES ?? '').split(',').map(name => name.trim()).filter(Boolean));

let workspace;

function settle(error, stdout, stderr) {
  return {
    code: error ? (error.code ?? 1) : 0, stdout, stderr, output: `${stdout}${stderr}`,
  };
}

// A shell command: npm is a .cmd shim on Windows, which only runs through a shell.
function shell(command, cwd) {
  return new Promise(resolve => {
    exec(command, {cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024}, (error, stdout, stderr) => {
      resolve(settle(error, stdout, stderr));
    });
  });
}

// An executable run without a shell: node itself, bun or deno.
function run(file, arguments_, cwd) {
  return new Promise(resolve => {
    execFile(file, arguments_, {cwd, encoding: 'utf8'}, (error, stdout, stderr) => {
      resolve(settle(error, stdout, stderr));
    });
  });
}

function node(arguments_, cwd) {
  return run(process.execPath, arguments_, cwd);
}

async function mustSucceed(step, result) {
  const settled = await result;
  assert.equal(settled.code, 0, `${step} failed:\n${settled.output}`);
  return settled;
}

// Bun and Deno run only when CONSUMER_RUNTIMES asks for them.
function unlessRuntime(name) {
  return runtimes.has(name) ? false : `set CONSUMER_RUNTIMES=${name} to run the fixtures under ${RUNTIME_NAMES[name]}`;
}

before(async () => {
  workspace = await mkdtemp(path.join(tmpdir(), 'seeded-random-utilities-consumers-'));
  let spec = registryPackage;
  if (spec === undefined) {
    // Pack without lifecycle scripts, so stdout holds only npm's JSON and the tarball holds the dist/ under test.
    const packed = await mustSucceed('npm pack', shell(`npm pack --json --ignore-scripts --pack-destination "${workspace}"`, root));
    const [{filename}] = JSON.parse(packed.stdout);
    spec = `./${filename}`;
  }

  await writeFile(path.join(workspace, 'package.json'), `${JSON.stringify({name: 'consumer-workspace', private: true}, undefined, 2)}\n`);
  const typescript = require('typescript/package.json').version;
  const nodeTypes = require('@types/node/package.json').version;
  // --prefer-offline only for the tarball: a registry install must see a version published minutes ago.
  const offline = registryPackage === undefined ? ' --prefer-offline' : '';
  await mustSucceed('npm install', shell(`npm install --no-audit --no-fund${offline} "${spec}" typescript@${typescript} @types/node@${nodeTypes}`, workspace));

  for (const fixture of [...RUNTIME_FIXTURES, ...TYPE_FIXTURES]) {
    await cp(path.join(fixtures, fixture), path.join(workspace, fixture), {recursive: true});
  }

  for (const fixture of TYPE_FIXTURES) {
    await cp(path.join(fixtures, 'types', 'assertions.ts'), path.join(workspace, fixture, 'index.ts'));
  }

  await copyFile(golden, path.join(workspace, '1.1.4.json'));
});

after(async () => {
  if (workspace && process.env.KEEP_CONSUMER_WORKSPACE === undefined) {
    await rm(workspace, {recursive: true, force: true});
  } else if (workspace) {
    console.log(`consumer workspace kept at ${workspace}`);
  }
});

test('esm-node: default and named imports from an ES module, and every 1.1.4 golden case', async () => {
  const result = await node(['esm-node/index.js', '1.1.4.json'], workspace);
  assert.equal(result.code, 0, result.output);
  assert.equal(result.stdout.trim(), 'esm-node ok');
});

test('cjs-node: require() from a CommonJS module, as 1.1.4 code used it', async () => {
  const result = await node(['cjs-node/index.js'], workspace);
  assert.equal(result.code, 0, result.output);
  assert.equal(result.stdout.trim(), 'cjs-node ok');
});

for (const fixture of TYPE_FIXTURES) {
  test(`${fixture}: the declaration files type-check`, async () => {
    const tsc = path.join(workspace, 'node_modules', 'typescript', 'bin', 'tsc');
    const result = await node([tsc, '--project', fixture], workspace);
    assert.equal(result.code, 0, result.output);
  });
}

test('bun: the ES module fixture, golden cases included', {skip: unlessRuntime('bun')}, async () => {
  const result = await run('bun', ['esm-node/index.js', '1.1.4.json'], workspace);
  assert.equal(result.code, 0, result.output);
  assert.equal(result.stdout.trim(), 'esm-node ok');
});

test('bun: the CommonJS fixture', {skip: unlessRuntime('bun')}, async () => {
  const result = await run('bun', ['cjs-node/index.js'], workspace);
  assert.equal(result.code, 0, result.output);
  assert.equal(result.stdout.trim(), 'cjs-node ok');
});

// --node-modules-dir=manual: Deno resolves from the node_modules npm created, as Node does.
const DENO_RUN = ['run', '--allow-read', '--node-modules-dir=manual'];

test('deno: the ES module fixture, golden cases included', {skip: unlessRuntime('deno')}, async () => {
  const result = await run('deno', [...DENO_RUN, 'esm-node/index.js', '1.1.4.json'], workspace);
  assert.equal(result.code, 0, result.output);
  assert.equal(result.stdout.trim(), 'esm-node ok');
});
