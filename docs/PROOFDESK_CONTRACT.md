# ProofDesk Contract for Target Repositories

This document defines the file contract for running ProofDesk against any code repository.

Document precedence used for this contract:
- `docs/DOCUMENT_HIERARCHY.md`
- `docs/AGENT_INSTRUCTIONS.md`
- `docs/ARCHITECTURE.md`
- `docs/STATE_MODEL.md`
- `docs/DEFINITION_OF_DONE.md`
- `docs/TEST_STRATEGY.md`
- `docs/SECURITY_BASELINE.md`
- `docs/OBSERVABILITY_RUNBOOK.md`

## 1. Canonical enums (state model is leading)

Use these exact enums:

```ts
type DevStatus = 'not_started' | 'in_progress' | 'built' | 'partial' | 'blocked';
type TestStatus = 'not_tested' | 'ready_to_test' | 'passed' | 'failed';
type AcceptanceStatus = 'in_scope' | 'under_review' | 'accepted' | 'rejected';
type ReadyForCommit = 'NOT_READY' | 'ALMOST_READY' | 'READY';
```

Normalization rules:
- Treat `needs_refactor` as a flag, not a status.
- Treat `needs_clarification` as a flag, not a status.
- Keep flags under `quality_flags` or `notes`; do not expand enum values.

## 2. Release readiness rule

Release is eligible only when all required high-priority functions satisfy:
- `devStatus` is `built` or `partial`
- `testStatus` is `passed`
- `acceptanceStatus` is `accepted`

And additionally:
- `approved_for_release` is `true`
- `blocking_functions` equals `0`

## 3. Required folder layout in target repo

```text
proofdesk/
  config/
    project.json
  state/
    current.json
    snapshots/
      PD_STATE_YYYYMMDDTHHMMSSZ_<shortsha>.json
  events/
    PD_EVT_YYYYMMDDTHHMMSSZ_<seq4>_<type>.json
  updates/
    PD_UPD_YYYYMMDDTHHMMSSZ_<seq4>_<slug>.md
  index/
    manifest.json
```

## 4. Naming conventions

Allowed file name patterns:
- Snapshot: `^PD_STATE_[0-9]{8}T[0-9]{6}Z_[a-f0-9]{7,12}\.json$`
- Event: `^PD_EVT_[0-9]{8}T[0-9]{6}Z_[0-9]{4}_[a-z0-9_]+\.json$`
- Update: `^PD_UPD_[0-9]{8}T[0-9]{6}Z_[0-9]{4}_[a-z0-9_]+\.md$`

## 5. Mutability policy

Immutable (append-only):
- `proofdesk/state/snapshots/*`
- `proofdesk/events/*`
- `proofdesk/updates/*`

Mutable:
- `proofdesk/state/current.json` (pointer to latest state)
- `proofdesk/index/manifest.json` (index metadata)

Correction policy:
- Never rewrite immutable files.
- If a prior item is wrong, create a new event/update with `supersedes`.

## 6. Minimum data contract

`current.json` must include:
- `approved_for_release`
- `release_state`
- `functions[]` with status fields
- `generated_at`
- `supersedes_snapshot` (nullable)

`manifest.json` must include:
- `latest_snapshot`
- `latest_event_seq`
- `latest_update_seq`
- indexed items with checksums

## 7. Agent write order (safe protocol)

On each accepted state update:
1. Read `project.json`, `current.json`, `manifest.json`.
2. Validate enum values and status transition legality.
3. Write new snapshot file.
4. Write one or more new event files.
5. Write one new update file.
6. Update `current.json` to point to the new snapshot.
7. Update `manifest.json` last.

If any validation fails, block and emit a clear reason in the update file.
