# AGENTS.md - ProofDesk Contract

This repository uses the ProofDesk tracking contract.

Before coding, always read in this order:
1. `proofdesk/config/project.json`
2. `proofdesk/state/current.json`
3. `proofdesk/index/manifest.json`
4. latest file in `proofdesk/updates/`

Required behavior:
- Use canonical enums only:
  - `devStatus`: `not_started | in_progress | built | partial | blocked`
  - `testStatus`: `not_tested | ready_to_test | passed | failed`
  - `acceptanceStatus`: `in_scope | under_review | accepted | rejected`
- Treat `needs_refactor` and `needs_clarification` as flags, not enum values.
- Never rewrite immutable history files:
  - `proofdesk/state/snapshots/*`
  - `proofdesk/events/*`
  - `proofdesk/updates/*`
- Only mutable pointers:
  - `proofdesk/state/current.json`
  - `proofdesk/index/manifest.json`

On each meaningful state change:
1. Write new snapshot file.
2. Write event file(s).
3. Write update markdown file.
4. Update `current.json`.
5. Update `manifest.json` last.

Commit guardrails:
- Block commit if `approved_for_release` is false.
- Block commit if `release_state.blocking_functions > 0`.
- Allow commit only if `release_state.ready_for_commit == "READY"`.
