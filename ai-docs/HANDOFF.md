# Handoff

Updated 2026-09-25 (Stage 0 of the v2 plan is done; stopped for Mark's plan review). Read this first, then [log.md](log.md) when you need evidence.

## Current state

- **The plan.** [plans/2026-09-25-modernization-and-v2-release.md](plans/2026-09-25-modernization-and-v2-release.md) holds the survey, the 14 confirmed 1.1.4 bugs, decisions D1 to D21, the v2 API with the 1.1.4 name map, the build and test strategy, stages 0 to 4, the pull request table, security and the checklist.
- **The research behind D1 to D3.** [notes/2026-09-25-rand-seed-history-and-the-1-1-4-golden-sequences.md](notes/2026-09-25-rand-seed-history-and-the-1-1-4-golden-sequences.md).
- **The decision record.** It stays proposed until Mark rules: [decisions/2026-09-25-v2-shape-keep-the-1-1-4-sequences-zero-deps-deprecated-aliases.md](decisions/2026-09-25-v2-shape-keep-the-1-1-4-sequences-zero-deps-deprecated-aliases.md).
- **On master.** One Stage 0 commit: AGENTS.md, CLAUDE.md (its first line imports AGENTS.md), `.github/copilot-instructions.md`, `ai-docs/`, and `test/golden/` (1.1.4.json with 322 cases captured from the published 1.1.4, and capture-1.1.4.cjs). No package code has changed.
- **Unchanged since the survey.** npm still has 1.1.4 only. GitHub still has 12 open Dependabot pull requests, 72 alerts, the codecov webhook and no workflows.

## Waiting for Mark

1. Rule on the decisions table; silence means the recommendations stand. The ones most worth a look:
   - D2: the name `PRNG.xoshiro128ssReference`.
   - D6: the kickoff asked for `generateRandomArrayOfUniqueIntegers` to be bounded, which conflicts with D1's bit-for-bit promise. The recommendation keeps the old method exact and adds `getUniqueRandomIntegers`.
   - D9: shuffling strings by code point, the one exception to D1.
   - D10: which additions to keep.
2. Answer three questions (plan, Stage 0):
   - May the agent delete the codecov webhook, the 12 Dependabot branches, and `v2` after the merge?
   - May the agent apply the repo settings through `gh`?
   - Who turns on secret scanning and push protection?
3. Any time, blocking nothing: revoke the codecov token at codecov.io. Check github.com/settings/installations and github.com/settings/applications for Codecov, SonarCloud and Travis CI.

## Decisions made this session (proposed)

- D1: 2.0.0 reproduces 1.1.4 bit for bit.
- D2: xoshiro128** 1.1 is added under a new name; 1.1.4's is version 1.0, which the authors call a mistake.
- D3: rand-seed is inlined; no runtime dependencies.
- D5: the old names become deprecated aliases of `(min, max)` names that give the same numbers.
- D7: numbers become real seeds, and unknown algorithm names throw.

## Dead ends hit

- The 1.1.4 npm scripts fail under cmd.exe ("'.' is not recognized"). Run them with `--script-shell` pointing at Git Bash (AGENTS.md, Commands).
- The kickoff survey said 1.1.4 treats `''` as no seed. It does not; the golden quirks prove it.

## Next single action

When Mark has ruled, branch `v2` from `master` and start Stage 1. Write the golden test first: the first build must pass all 322 cases before any new method is written.
