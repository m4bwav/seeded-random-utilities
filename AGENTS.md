# AGENTS.md

Rules for any AI agent (Claude Code, Copilot, Cursor, Codex) working in this repository. `CLAUDE.md` and `.github/copilot-instructions.md` only point here.

## What this is

The npm package `seeded-random-utilities`: seedable random helpers (floats, integers in a range, booleans, characters, strings, element picks, weighted picks, unique integers, shuffles, state export) over small generators (sfc32, mulberry32, xoshiro128**, and reference versions of the last two), written in TypeScript. It has been on npm since 2019-11-22.

Version 2 is TypeScript in `src/`, built by tsdown into ESM and CommonJS with a declaration file for each, with no runtime dependencies. It reproduces 1.1.4's sequences bit for bit. 1.1.4 (2019-11-25, rollup 1, TypeScript 3.7, `rand-seed ^0.1.2`) stays the published version until 2.0.0 ships.

The plan is `ai-docs/plans/2026-09-25-modernization-and-v2-release.md`; start with `ai-docs/HANDOFF.md` to see how far it has got.

## Rules

- **Same seed, same sequence, is the product.** A seeded call returns exactly what 1.1.4 returned for the same seed, algorithm and arguments, on every runtime. `test/golden/1.1.4.json` is the contract; it was captured from the published 1.1.4 by `test/golden/capture-1.1.4.cjs`, in a scratch project.
  - Never regenerate the golden file from this repository's code, and never compare its numbers with a tolerance.
  - Never change an algorithm, the seed hash, or how many numbers a method draws.
  - A fix that would change a sequence goes under a new name (a method or a `PRNG` member), with a decision entry in `ai-docs/decisions/` and a changelog line.
- **Availability.** The package must stay usable from `import` and `require`, ship types for both, and support every Node line in `engines`. The library stays free of Node and DOM APIs (`process`, `Buffer`, `require`, `__dirname`, `node:` imports, `window`, `document`), so it runs in browsers, Bun, Deno and workers. No runtime dependency without a decision entry.
- **Tests cover every artifact, not just the code.** Once v2 lands, the plan's test strategy is the contract: golden, unit, package shape, consumer fixtures, Bun and Deno, and post-publish verification. A behaviour change lands with its test. `npm test` never touches the network.
- **Nothing reaches npm without Mark.** Never run `npm publish` or `npm stage publish` from a machine, never create or store an npm token, and never approve anything on npmjs.com. From 2.0.0, releases go through `release.yml`, which only stages; Mark approves each version with 2FA.
- **Releases follow one ritual.**
  1. Update `CHANGELOG.md`. A release's heading carries its date; `release.yml` refuses "Unreleased" for a release, and a prerelease uses the section of the release it leads to.
  2. Run `npm version <major|minor|patch>`, then `git push --follow-tags`.
  3. `release.yml` builds, tests, stages the npm publish through trusted publishing and creates the GitHub Release.
  4. Mark approves the staged version on npmjs.com.
  5. Run the `verify-published` workflow with the version.
- **Dependencies.** Dependabot opens weekly pull requests (npm and GitHub Actions); merge when the `ci` check is green, and read the release notes for a major first. Actions are pinned to commit SHAs with the version in a comment; keep it that way.
- **Research beats recall.** Node, npm and tool versions change, and the notes under `ai-docs/notes/` carry the date each fact was verified. Re-verify any version number older than three months before relying on it.
- **Document for handoff.** Anything learned, decided or built goes into `ai-docs/` (at minimum a line in `ai-docs/log.md`) before you finish. Rewrite `ai-docs/HANDOFF.md` when work is left unfinished. A fresh session in any tool must be able to continue from disk alone.
- **No AI attribution anywhere**: no Co-Authored-By trailers, no "generated with" lines in commits, pull requests or files.
- **Windows note.**
  - Write files with an editor tool, not shell heredocs (they lose backslashes).
  - Check line endings by counting byte 13 with node; Git Bash's grep cannot see carriage returns.
  - Spawn npm and npx through a shell from Node; they are `.cmd` shims.
  - `.gitattributes` keeps the repository LF, and `core.autocrlf` is false here, so check new files before committing them.

## Commands

```bash
npm ci
npm run build          # tsdown -> dist/ (index.mjs, index.cjs, index.d.mts, index.d.cts, maps)
npm test               # build, then node --test: golden, unit, generators, distribution, package shape
npm run test:dist      # the same suites against the dist/ already built, without building
npm run test:consumers # build, pack, install the tarball into a scratch project, run the ESM, CJS and type fixtures
                       # CONSUMER_RUNTIMES=bun,deno adds Bun and Deno; CONSUMER_PACKAGE=seeded-random-utilities@<version> installs from npm instead
npm run coverage       # c8 over the suites, mapped back to src/; fails under 95% lines or 90% branches (it is at 100%)
npm run lint           # xo (config and every rule override, with its reason, in xo.config.js)
npm run typecheck      # tsc --noEmit
npm run check          # publint, attw --pack ., npm pack --dry-run
```

tsdown needs Node 22.18+ or 24 to build; the built output and the tests run on Node 20 and up.

## Layout and traps

- `src/generators.ts` holds the algorithms, the xfnv1a seed hash and `PRNG`, ported from rand-seed 0.1.5 with rand-seed's MIT notice in a `/*!` header that the build keeps (the shape test checks it). `src/rand.ts` holds `Rand` and the seed and algorithm parsing. `src/random-utilities.ts` holds the public types. `src/seeded-random-utilities.ts` holds the class, whose 1.1.4 method bodies are carried over expression by expression.
- `test/golden/1.1.4.json` (322 cases) and `rand-seed-3.0.0.json` were captured from the npm packages by the `capture-*.cjs` scripts beside them, in scratch projects. Lint ignores both the files and the scripts, which are kept as they were run. `1.1.4.json` contains lone surrogates on purpose: they are 1.1.4's broken string shuffles.
- `test/unit/generators.test.js` checks every algorithm against BigInt versions written from the authors' C code. A change that passes the golden file but not those is still wrong.
- Never upgrade to rand-seed's newer numbers. 0.1.2 to 1.0.0 match 1.1.4, but 1.0.1 and later change xoshiro128ss and 3.0.0 changes sfc32. Details: `ai-docs/notes/2026-09-25-rand-seed-history-and-the-1-1-4-golden-sequences.md`.
- Tests import `dist/`, never `src/`, and run against both builds (`test/helpers/builds.js`). The npm scripts name every test file, because plain `node --test` would also run the fixtures and the capture scripts.
- `package.json` `main`, `module`, `types` and `exports` are rewritten by tsdown on every build (`exports: true`); edit them in `tsdown.config.ts`, not by hand.
- `xo --fix` rewrites code: stage your work first and read the diff it makes to `src/`, which must keep every 1.1.4 expression's meaning.
- CI (`.github/workflows/ci.yml`) installs and builds on Node 24 in every job, because tsdown cannot run on Node 20. It then switches to the job's Node line and runs `npm run test:dist` and the consumer fixtures. The ruleset on `master` requires only the final `ci` job, which passes when every other job passed.
- The npm trusted publisher names `release.yml`, so renaming the file breaks publishing. Its `publish` job, the only one with `id-token` and `contents` set to write, stages the tarball the `build` job tested and runs no dependency code. Within 24 hours of a publish, Deno needs `--minimum-dependency-age=0` to install the new version.

## everlast (session knowledge, load on demand)

- `ai-docs/INDEX.md` lists what past sessions learned here (solutions with verified commands, decisions with reasons, plans). At the start of a task, scan it and open only the entries whose title or tags match; no line matches: `everlast.py search "<key terms>"` before concluding nothing was recorded. Read `ai-docs/HANDOFF.md` when continuing unfinished work (everlast-resume skill).
- Before acting on an entry marked `(recheck due)`, run `everlast.py recheck <entry>`, re-run its Verified-by command only when that is read-only or safe (a build, a test, a version query), then record `everlast.py verify <entry>` or `verify <entry> --failed "what broke"`; a fix that changed is superseded, never reused blindly.
- Before finishing a task that hit a dead end, verified a non-obvious command, made a design choice, or taught you something about the user, record it (everlast-capture skill, or `everlast.py note` / `handoff`); rewrite `HANDOFF.md` when work is left unfinished. Say "nothing to record" when that is true.
- Anything naming a person, an internal host or name, a credential, or an opinion about people goes to the private sidecar (`--private`), never here. Lessons about the user or this machine go to the user tier (`--user`).
- Rules go in this file, system layout in CODEMAP.md; the doc set holds only what could not be re-derived from the code in a minute.
- Link documents together with relative markdown links: every markdown folder is reachable from an index whose lines say when to read each file (`ai-docs/INDEX.md` is generated from frontmatter; give entries a one-line `summary`), and an entry links the entries it relates to on a typed `Related:` line (`supersedes`, `contradicts`, `builds on`, `see also`). The set then reads as a graph for people in Obsidian and for agents alike. No wikilinks in the repo.
