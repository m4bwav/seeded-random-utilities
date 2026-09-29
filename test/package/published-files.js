// What the npm tarball holds, shared by shape.test.js (a dry-run pack of the checkout) and check-tarball.mjs (the tarball release.yml stages).
export const PUBLISHED_FILES = [
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

// About 44 kB after the review fixes (2026-09-25), most of it the two source maps, which carry the TypeScript source for debuggers and bundlers.
export const TARBALL_BUDGET = 50_000;
