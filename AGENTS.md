# AGENTS.md

Rules for any AI agent (Claude Code, Copilot, Cursor, Codex) working in this repository. `CLAUDE.md` and `.github/copilot-instructions.md` only point here.

## What this is

The npm package `seeded-random-utilities`: seedable random helpers (floats, integers in a range, booleans, characters, element picks, unique picks, shuffles) over three small generators (sfc32, mulberry32, xoshiro128**), written in TypeScript. It has been on npm since 2019-11-22.

1.1.4 (2019-11-25) is the published version until 2.0.0 ships. It is built with rollup 1 and TypeScript 3.7, tested with jest 24, and has one runtime dependency, `rand-seed ^0.1.2`.

Version 2 is planned in `ai-docs/plans/2026-09-25-modernization-and-v2-release.md`: TypeScript built by tsdown into ESM and CommonJS with declaration files, no runtime dependencies, and the 1.1.4 sequences reproduced bit for bit. Start with `ai-docs/HANDOFF.md` to see how far it has got.

## Rules

- **Same seed, same sequence, is the product.** A seeded call returns exactly what 1.1.4 returned for the same seed, algorithm and arguments, on every runtime. `test/golden/1.1.4.json` is the contract; it was captured from the published 1.1.4 by `test/golden/capture-1.1.4.cjs`, in a scratch project.
  - Never regenerate the golden file from this repository's code, and never compare its numbers with a tolerance.
  - Never change an algorithm, the seed hash, or how many numbers a method draws.
  - A fix that would change a sequence goes under a new name (a method or a `PRNG` member), with a decision entry in `ai-docs/decisions/` and a changelog line.
- **Availability.** The package must stay usable from `import` and `require`, ship types for both, and support every Node line in `engines`. The library stays free of Node and DOM APIs (`process`, `Buffer`, `require`, `__dirname`, `node:` imports, `window`, `document`), so it runs in browsers, Bun, Deno and workers. No runtime dependency without a decision entry.
- **Tests cover every artifact, not just the code.** Once v2 lands, the plan's test strategy is the contract: golden, unit, package shape, consumer fixtures, Bun and Deno, and post-publish verification. A behaviour change lands with its test. `npm test` never touches the network.
- **Nothing reaches npm without Mark.** Never run `npm publish` or `npm stage publish` from a machine, never create or store an npm token, and never approve anything on npmjs.com. From 2.0.0, releases go through `release.yml`, which only stages; Mark approves each version with 2FA.
- **Research beats recall.** Node, npm and tool versions change, and the notes under `ai-docs/notes/` carry the date each fact was verified. Re-verify any version number older than three months before relying on it.
- **Document for handoff.** Anything learned, decided or built goes into `ai-docs/` (at minimum a line in `ai-docs/log.md`) before you finish. Rewrite `ai-docs/HANDOFF.md` when work is left unfinished. A fresh session in any tool must be able to continue from disk alone.
- **No AI attribution anywhere**: no Co-Authored-By trailers, no "generated with" lines in commits, pull requests or files.
- **Windows note.**
  - Write files with an editor tool, not shell heredocs (they lose backslashes).
  - Check line endings by counting byte 13 with node; Git Bash's grep cannot see carriage returns.
  - Spawn npm and npx through a shell from Node; they are `.cmd` shims.
  - `core.autocrlf` is false here, so files are committed exactly as written. The v2 rewrite adds a `.gitattributes` that keeps the repository LF.

## Commands (1.1.4, until the v2 rewrite replaces them)

```bash
npm ci --ignore-scripts        # nothing in the old tree needs its install scripts
npm run lint                   # eslint 6: 1 warning, exit 0
npm test                       # jest 24: 21 tests, with coverage
npm run build                  # rollup 1 -> dist/seeded-random-utilities.js (CommonJS) and .es.js
node sample/index.js           # after a build: two equal sequences for seed '1234'
```

On Windows, add `--script-shell "C:\Program Files\Git\usr\bin\bash.exe"` to the npm run commands: the scripts call `./node_modules/.bin/…`, which cmd.exe, npm's default script shell there, cannot run.

## Layout and traps (1.1.4)

- `src/SeededRandomUtilities.ts` is the class, `src/RandomUtilities.ts` its interface, and `src/index.ts` the exports: the default class, plus `Rand` and `PRNG` re-exported from rand-seed. The tests are `tests/SeededRandomUtilities.test.ts` (jest). The build is `rollup.config.js`; its CommonJS bundle needs `require(…).default`.
- Never upgrade `rand-seed`. `^0.1.2` installs 0.1.5 on a fresh install, and 0.1.2 to 1.0.0 give the same numbers, but 1.0.1 and later change xoshiro128ss and 3.0.0 changes sfc32. Details: `ai-docs/notes/2026-09-25-rand-seed-history-and-the-1-1-4-golden-sequences.md`.
- `.travis.yml` contains a leaked codecov token. Never copy it anywhere; Mark revokes it at codecov.io, and the file goes in the v2 rewrite.
- jest does not run `test/golden/` (its testMatch is `tests/`), and eslint does not lint it (the lint script reads `.ts` files only).

## everlast (session knowledge, load on demand)

- `ai-docs/INDEX.md` lists what past sessions learned here (solutions with verified commands, decisions with reasons, plans). At the start of a task, scan it and open only the entries whose title or tags match; no line matches: `everlast.py search "<key terms>"` before concluding nothing was recorded. Read `ai-docs/HANDOFF.md` when continuing unfinished work (everlast-resume skill).
- Before acting on an entry marked `(recheck due)`, run `everlast.py recheck <entry>`, re-run its Verified-by command only when that is read-only or safe (a build, a test, a version query), then record `everlast.py verify <entry>` or `verify <entry> --failed "what broke"`; a fix that changed is superseded, never reused blindly.
- Before finishing a task that hit a dead end, verified a non-obvious command, made a design choice, or taught you something about the user, record it (everlast-capture skill, or `everlast.py note` / `handoff`); rewrite `HANDOFF.md` when work is left unfinished. Say "nothing to record" when that is true.
- Anything naming a person, an internal host or name, a credential, or an opinion about people goes to the private sidecar (`--private`), never here. Lessons about the user or this machine go to the user tier (`--user`).
- Rules go in this file, system layout in CODEMAP.md; the doc set holds only what could not be re-derived from the code in a minute.
- Link documents together with relative markdown links: every markdown folder is reachable from an index whose lines say when to read each file (`ai-docs/INDEX.md` is generated from frontmatter; give entries a one-line `summary`), and an entry links the entries it relates to on a typed `Related:` line (`supersedes`, `contradicts`, `builds on`, `see also`). The set then reads as a graph for people in Obsidian and for agents alike. No wikilinks in the repo.
