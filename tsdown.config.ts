import {readFileSync, writeFileSync} from 'node:fs';
import {defineConfig} from 'tsdown';

// With `sourcemap: true` the declaration files still end in a sourceMappingURL comment although no declaration map is written (tsdown 0.23.0); drop the dangling reference.
function dropDeclarationMapComments(): void {
  for (const file of ['dist/index.d.mts', 'dist/index.d.cts']) {
    writeFileSync(file, readFileSync(file, 'utf8').replace(/\n\/\/# sourceMappingURL=\S+$/u, '\n'));
  }
}

// ESM and CommonJS with a declaration file for each. `exports: true` writes main, module, types and exports into package.json.
export default defineConfig({
  entry: {index: 'src/index.ts'},
  format: ['esm', 'cjs'],
  platform: 'neutral',
  // No declaration maps: they would point into src/, which is not published.
  dts: {sourcemap: false},
  fixedExtension: true,
  exports: true,
  sourcemap: true,
  // The CommonJS build then exports default, SeededRandomUtilities, Rand and PRNG, the same names as the ESM build.
  // The JSDoc lives in the declaration files, where editors read it; dropping it from the JavaScript keeps the tarball small.
  outputOptions: {exports: 'named', comments: {jsdoc: false}},
  hooks: {'build:done': dropDeclarationMapComments},
});
