# Handoff

Updated 2026-09-25: 2.0.0-beta.1 is approved and verified, and 2.0.0 is staged on npm waiting for Mark's approval. Read this first, then [log.md](log.md) for evidence.

## Current state

- **master.** At 9722f06 ("2.0.0", tag v2.0.0), after eaefe88 (the CHANGELOG heading dated 2026-09-25). The rewrite is pull request #17, 3ed7bb2.
- **2.0.0-beta.1.** Approved by Mark and verified: verify-published run 36201514545 was green in all 15 jobs. `npm audit signatures` verified the attestation, and require and import give 1.1.4's first number.
- **2.0.0.** Release run 36201644420 is green. It staged seeded-random-utilities@2.0.0 with tag `latest` (stage id 9e38f4ec-bdcd-4947-8816-6925b4552883, provenance at sigstore log index 2962768304). The GitHub Release v2.0.0 exists and is not a prerelease.
- **npm dist-tags now:** `latest` 1.1.4, `next` 2.0.0-beta.1. `latest` becomes 2.0.0 when Mark approves.
- **The codecov token** will not be revoked, by Mark's decision (see the log).

## Waiting for Mark

Approve 2.0.0 on npmjs.com (the package's Staged Packages tab, with 2FA).

## Next single action

After the approval:

1. Run `gh workflow run verify-published.yml -R m4bwav/seeded-random-utilities -f version=2.0.0`; all 15 jobs must pass.
2. Check `npm view seeded-random-utilities dist-tags`: `latest` 2.0.0.
3. Install it in a temp project and run `npm audit signatures`; check `npx -y -p seeded-random-utilities@2 node -e ...` if wanted.

Then Stage 4, all in the plan:

- Rewrite this file around the standing work: Dependabot, 3.0.0 removing the deprecated names with the Node 24 floor after 2027-04-30.
- Update the inventory row (`D:\m4bwa\Claude\Projects\Ai\package-modernization\inventory.md`).
- Mark the kickoff prompt done.
- Apply the plan's collected "playbook differences" list to `D:\m4bwa\Claude\Projects\Ai\package-modernization\playbook.md`.
- Tell Mark whether the playbook is ready to become the npm-modernize skill (playbook section 10); do not build it.

## Dead ends hit

- The Bash tool loses backslashes and fails on nested quoting; use the Edit tool or a script file.
- The everlast handoff refuses a body without `## Next single action`.
