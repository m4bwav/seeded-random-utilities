---
title: GitHub wiki written and published for 2.0.0
kind: note
date: 2026-09-28
verified: 2026-09-28
stale_after: 2027-03-28
tags: [wiki, docs, 2.0.0, github, wikiwright, golden]
summary: "the nine wiki pages, where their git working copy is, how every example was verified against the published 2.0.0 (the script and its output beside this note), how the golden captures fed Versions and upgrading, the facts the README lacks, the inaccuracies in the shipped docs, and how to update the wiki at the next release; read before touching the wiki, the README's error sentence, or the HANDOFF's dist-tag line"
---

# GitHub wiki for 2.0.0

## Summary

Mark asked for the repository wiki (https://github.com/m4bwav/seeded-random-utilities/wiki) as the second real run of the wikiwright skill (m4bwav/wikiwright, released as 0.2.0 from this run). Nine pages plus sidebar and footer were written from:

- the 2.0.0 source, README, CHANGELOG, AGENTS.md, HANDOFF, log and the rand-seed research note;
- the CI workflows, the pull requests (no issues exist) and the npm registry;
- the golden captures under `test/golden/`.

Every output on the wiki was printed by `2026-09-28-wiki-verify.mjs` (next to this note) against `seeded-random-utilities@2.0.0` installed from npm; its full output is `2026-09-28-wiki-verify.out.txt`. The script also ran 1.1.4 and 1.0.0 from npm, and Deno and Bun.

Published on 2026-09-28 as wiki commit `7980d4b`. Results:

- `wikiwright.py live`: every page answered, and the sidebar and footer rendered.
- `wikiwright.py check`: 0 errors, 0 warnings.
- `wikiwright.py outputs`: 41 outputs checked, 0 missing.
- Everwrite checker: 0 strong findings, 5 weak (long sentences).

Pages: Home, Getting started, API reference, Same seed same sequence, Errors and edge cases, Recipes, Versions and upgrading, FAQ, Development.

## Where the pages are

`D:\m4bwa\Claude\Projects\Ai\seeded-random-utilities.wiki` (a sibling of this clone, outside this repository), branch `master`, remote `origin` = `https://github.com/m4bwav/seeded-random-utilities.wiki.git`. Files: `Home.md`, `Getting-Started.md`, `API-Reference.md`, `Same-Seed-Same-Sequence.md`, `Errors-and-Edge-Cases.md`, `Recipes.md`, `Versions-and-Upgrading.md`, `FAQ.md`, `Development.md`, `_Sidebar.md`, `_Footer.md`. Plain markdown links between pages (`[Recipes](Recipes)`), no wikilinks, LF line endings.

## How it was published

The wiki feature had been switched off in Stage 2 of the modernization (log, 2026-09-25). Mark's overlay decision of 2026-09-28 (every public package gets a wiki) switched it back on. `wikiwright.py preflight m4bwav/seeded-random-utilities --enable --clone <wiki dir>` ran `gh repo edit --enable-wiki` at 19:25:33 UTC, then re-checked `git ls-remote` every 5 seconds: the wiki repository was still missing after 61 seconds (`STATE: no-wiki-repo`). Mark saved the first page at 19:27:28 UTC (commit `ef61124`, "Initial Home page", authored by him), and a background poll saw the repository at 19:27:39. So switching the feature on does not create the wiki repository; only the first page saved in the web UI does. Preflight then reported `STATE: placeholder`. The pages were committed on the cloned placeholder and pushed as a plain fast-forward (`ef61124..7980d4b`).

## Updating the wiki later

1. `git -C D:\m4bwa\Claude\Projects\Ai\seeded-random-utilities.wiki pull --ff-only`.
2. Re-verify in a scratch folder outside the repository:
   - `npm init -y`, then `npm install seeded-random-utilities@<new> typescript@6`, and copy in `2026-09-28-wiki-verify.mjs` with `VERSION` changed.
   - Install `seeded-random-utilities@1.1.4` and `@1.0.0` in two more folders, and `deno` and `bun` from npm in a third.
   - Run `node wiki-verify.mjs > out.txt` with `V114=`, `V100=`, `RT=` pointing at those folders and `GOLDEN=` at this clone's `test/golden`. Without them the old-version, runtime and golden sections are missing.
   - The output is seeded, so it is identical on every run and machine. Diff it with `2026-09-28-wiki-verify.out.txt`: every difference is a page to fix.
3. `python <wikiwright>/scripts/wikiwright.py outputs <wiki dir> out.txt`: every output on a page must be in the new output. Then `wikiwright.py check <wiki dir> --version <new>` and the everwrite checker.
4. Commit, `git push`, `wikiwright.py live m4bwav/seeded-random-utilities <wiki dir>`.

Pages that name the version: Home (last line), Getting started (the Deno import line and the first sentence), API reference (first paragraph), Versions and upgrading (table, downloads, the 3.0.0 section), Development (the test count only), the footer. The API reference's "Since" column and the deprecated table change at 3.0.0.

## How the examples were verified

Everything ran on Windows 11 with Node 24.18.0 and npm 11.16.0, in a scratch project with `seeded-random-utilities@2.0.0` and `typescript@6.0.3`:

- **Module systems and runtimes.** Imported both ways; the Home example also ran under Deno 2.9.6 and Bun 1.4.2 (the npm packages `deno` and `bun`).
- **Package managers.** pnpm 10.34.5 and yarn 4.18.1 through corepack, and `bun add`, each installed 2.0.0 into an empty project, and the Home example printed the same four lines. Yarn 4's Plug'n'Play needs `yarn node`.
- **Types.** TypeScript examples were compiled with `tsc --strict --module nodenext`.
- **Old versions.** 1.1.4 and 1.0.0 were installed from npm in their own folders.
- **Golden captures.** `test/golden/capture-1.1.4.cjs` was replayed against 1.1.4 today (322 of 322 cases identical to `1.1.4.json`) and against 2.0.0 with only its rand-seed version line patched (316 of 322 identical; the 6 are the emoji shuffle, and the quirks differ exactly as the CHANGELOG lists). `capture-2.0.0.cjs` was run against the published `dist/index.cjs` (150 of 150 identical to `2.0.0.json`). The golden files were only read, never rewritten. This was the first time a golden capture fed a wikiwright Versions page.
- **The repository's own tests.** `npm test` on master: 1223 of 1223.

Not run: browsers (the page says so), and 1.1.0 to 1.1.3, whose type name comes from the CHANGELOG.

## Facts verified while writing (not in the README)

- The ES module and CommonJS builds hold two copies of the class: `instanceof` fails across them, although their numbers are identical and a state from one resumes in the other.
- Draws per call: `selectRandomElement` on 10 items drew 10, 2 and 3 numbers in three calls. `selectUniqueRandomElements(10 items, 3)` drew 10. `generateRandomArrayOfUniqueIntegers(3, 9)` drew 20. `getRandomString(8)` draws 8, and `shuffle` one per element or character.
- `mulberry32` and `mulberry32Reference` first differ at draw 4,917,760 for seed `'1234'` (consistent with decision D2b in the log).
- `getRandomFloat(1, 1 + Number.EPSILON)` returned `max` in 58 of 100 draws.
- `getRandomFloat(5, 5)` returns 5, `getRandomIntegar(5, 5)` returns 5, and `getRandomIntegar(0, 10)` (reversed) returns a number.
- The deprecated `generateRandomArrayOfUniqueIntegers(10, 3)` returns all four integers 0 to 3, and with `skipShuffle` they come back in ascending order.
- `fromState` accepts a hand-made `{algorithm: 'sfc32', state: [0, 0, 0, 0]}`.
- An array seed's message prints the array joined (`not x` for `['x']`). A `Date` seed's message contains the local time zone, so it differs between machines.
- 1.0.0 exported the interface as `ISeededRandomUtilities`; 1.1.x renamed it `RandomUtilities`.
- 1.1.4 imported from an ES module gives the exports object as default (`typeof S` is `object`, `S.default` a function).
- Yarn 4 with Plug'n'Play needs `yarn node script.mjs`.
- Deno runs `npm:seeded-random-utilities@2.0.0` with no permission flags.
- Registry, read 2026-09-28:
  - 8 versions; only `latest` (2.0.0) as a dist-tag; none deprecated.
  - Downloads: week to 2026-09-27, 2.0.0 188, 2.0.0-beta.1 134, 1.1.4 88; month 494; year 4,282.
  - 2.0.0: 10 files, 171,187 bytes unpacked, with an attestation.

## Inaccuracies found in the docs

Numbered; the README and CHANGELOG ship inside the package, so they reach npm only with a release. Not fixed.

1. The README's API section ends: "Bad arguments throw `TypeError` or `RangeError` with a message that names the method: an empty or reversed range, ...". That is wrong in two ways:
   - `getRandomFloat` accepts an empty range (`getRandomFloat(5, 5)` returns 5); only the integer methods throw for one.
   - The constructor's messages ("Unknown algorithm ...", "A seed must be ...") and the three kept from 1.1.4 ("Parameter source is not set", "Parameter picks cannot be negative", "Parameter amount cannot be negative") do not name a method.

   Suggested: "Bad arguments throw `TypeError` or `RangeError`: a reversed range, an integer range with no integer in it, ..., and most messages start with the method's name."
2. ai-docs/HANDOFF.md (Current state, and item 5) says "`next` is 2.0.0-beta.1" and "`next` stays on 2.0.0-beta.1". npm showed only `latest` on 2026-09-28 (the package was modified on 2026-09-27). Corrected in HANDOFF with this note.
3. AGENTS.md, under What this is, says "1.1.4 ... stays the published version until 2.0.0 ships" and "Once v2 lands" are out of date since 2.0.0 shipped on 2026-09-25. Not shipped in the package; left for Mark.
4. An omission rather than an error: the CHANGELOG entry for 1.1.0 to 1.1.3 says "The interface is exported as `RandomUtilities`" does not say that 1.0.0's `ISeededRandomUtilities` went away, a type rename inside 1.x.

Worth adding at the next README change (omissions): yarn 4's `yarn node`; the `instanceof` hazard across builds; that a `String` object is accepted as a seed; and that `getState()` throws for an unseeded generator.

## Gotchas

- A test's first `new Date(0)` error message printed the local time zone. Keep time-zone-dependent strings out of the verification output, or the saved output differs by machine.
- `node --input-type=module -e` spawned through a shell prints Node's DEP0190 warning on stderr (from `spawnSync` with `shell: true` for the `.cmd` shims of deno and bun); harmless, and not in the saved stdout.
- `capture-2.0.0.cjs` takes the build path as its argument (`node capture-2.0.0.cjs <dist/index.cjs>`); its header's "never run it again" means never regenerate the golden file.

Related: see also [../HANDOFF.md](../HANDOFF.md), [../log.md](../log.md), [2026-09-25-rand-seed-history-and-the-1-1-4-golden-sequences.md](2026-09-25-rand-seed-history-and-the-1-1-4-golden-sequences.md).
