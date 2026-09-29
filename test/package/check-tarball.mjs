/*
Checks a packed tarball before release.yml stages it: exactly the published files, under the size budget, and the version expected.
Usage: node test/package/check-tarball.mjs <file.tgz> [version]
Prints the file's SHA-512 in hex (as sha512sum does), so the jobs that test and stage it can be matched in the run log; exits 1 on any difference.
*/
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {PUBLISHED_FILES, TARBALL_BUDGET} from './published-files.js';

const [file, version] = process.argv.slice(2);
if (!file) {
  console.error('usage: node test/package/check-tarball.mjs <file.tgz> [version]');
  process.exit(2);
}

// tar runs in the tarball's folder with a relative name: Git Bash's tar reads C:/ as a remote host.
const directory = path.dirname(path.resolve(file));
const name = path.basename(file);
const tar = arguments_ => execFileSync('tar', arguments_, {cwd: directory, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});

const problems = [];
const entries = tar(['-tzf', name]).split('\n').filter(Boolean).map(entry => entry.slice('package/'.length)).toSorted();
const expected = PUBLISHED_FILES.toSorted();
if (JSON.stringify(entries) !== JSON.stringify(expected)) {
  problems.push(`files differ: got ${entries.join(', ')}; expected ${expected.join(', ')}`);
}

const {size} = statSync(path.join(directory, name));
if (size >= TARBALL_BUDGET) {
  problems.push(`${size} bytes, over the budget of ${TARBALL_BUDGET}`);
}

const manifest = JSON.parse(tar(['-xzOf', name, 'package/package.json']));
if (version !== undefined && manifest.version !== version) {
  problems.push(`package.json says ${manifest.version}, expected ${version}`);
}

const sha512 = createHash('sha512').update(readFileSync(path.join(directory, name))).digest('hex');
console.log(`${name}: ${entries.length} files, ${size} bytes, version ${manifest.version}, sha512 ${sha512}`);
for (const problem of problems) {
  console.error(`check-tarball: ${problem}`);
}

process.exit(problems.length > 0 ? 1 : 0);
