/**
@type {import('xo').FlatXoConfig}
*/
const xoConfig = [
  {
    // The type fixture imports the built package, so it only resolves after a build; the consumer fixtures type-check it against the installed tarball instead.
    // The capture scripts run in scratch projects against the old packages and are kept exactly as they were run.
    // The golden JSON files are captured data: 1.1.4.json holds the lone surrogates 1.1.4's string shuffle produced, as evidence.
    ignores: ['ai-docs/**', 'test/consumers/types/**', 'test/golden/*.cjs', 'test/golden/*.json'],
  },
  {
    files: ['**/*.md'],
    rules: {
      // The docs write intervals such as [0, max], which read as link labels to this rule.
      'markdown/no-missing-label-refs': 'off',
    },
  },
  {
    space: 2,
    rules: {
      // The `v` flag is a syntax error in Safari 16 and Chrome before 112, which would stop the library loading at all in those browsers; `u` works everywhere.
      'require-unicode-regexp': ['error', {requireFlag: 'u'}],
    },
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      // The public parameters keep 1.1.4's names (copy, skipShuffle), which callers see in their editors.
      'unicorn/consistent-boolean-name': 'off',
    },
  },
  {
    files: ['src/generators.ts'],
    rules: {
      // Bitwise arithmetic is what these generators are; each expression is carried over from rand-seed 0.1.5 so the numbers stay those of 1.1.4.
      'no-bitwise': 'off',
      'unicorn/prefer-math-trunc': 'off',
      '@stylistic/no-mixed-operators': 'off',
    },
  },
  {
    files: ['package.json'],
    rules: {
      // The shape below is the one publint and attw approved in every resolution mode (see get-title-at-url's plan): main, module and types stay for older resolvers, and the declaration files are found by sibling name, so no types or default conditions.
      'package-json/prefer-exports': 'off',
      'package-json/require-default-condition': 'off',
      'package-json/require-types-in-exports': 'off',
      // Npm always publishes package.json, whatever `files` says.
      'package-json/prefer-files-field': 'off',
      // Trusted publishing matches repository.url exactly, so it stays spelled out.
      'package-json/prefer-shorthand': 'off',
      // Deliberate pins: tsdown is pre-1.0 and pinned exactly; TypeScript stays on 6.0 until tsdown and xo declare 7.
      'package-json/dependency-version-range': 'off',
    },
  },
  {
    files: ['test/**/*.{js,cjs,ts}'],
    rules: {
      // The test scripts name their files, so helpers, fixtures and capture scripts can live under test/.
      'node-test/no-import-test-files': 'off',
      // Table-driven tests: an assertion per row of a fixed, non-empty table.
      'node-test/no-conditional-assertion': 'off',
      'no-await-in-loop': 'off',
      // Skips that depend on the runtime (Bun and Deno are opt-in), never forgotten ones.
      'node-test/no-skip-test': 'off',
      // The oracles and the chi-square sums are arithmetic on purpose.
      'no-bitwise': 'off',
      '@stylistic/no-mixed-operators': 'off',
    },
  },
  {
    // Each golden test calls the helper for its kind of case, and the helpers assert.
    files: ['test/golden/golden.test.js'],
    rules: {
      'node-test/require-assertion': 'off',
    },
  },
  {
    // CommonJS on purpose: this fixture proves require() works.
    files: ['test/consumers/cjs-node/**/*.js'],
    rules: {
      'unicorn/prefer-module': 'off',
      'unicorn/prefer-top-level-await': 'off',
    },
  },
  {
    // The fixture projects model consumers: some are CommonJS on purpose, and none needs engines.
    files: ['test/consumers/**/package.json'],
    rules: {
      'package-json/prefer-type-module': 'off',
      'package-json/require-engines': 'off',
    },
  },
];

export default xoConfig;
