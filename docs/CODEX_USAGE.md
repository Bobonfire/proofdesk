# Codex Usage for ProofDesk Contract

Use this workflow when Codex works in a target repository that contains a `proofdesk/` folder.

## 1. Startup checks

Before editing code:
1. Read `proofdesk/config/project.json`.
2. Read `proofdesk/state/current.json`.
3. Read `proofdesk/index/manifest.json`.
4. Read the latest update file referenced in `manifest.json`.

Then summarize:
- Current release readiness state
- Blocking functions
- Last recorded update scope

## 2. During implementation

When work changes function state:
- Update status in memory using canonical enums only.
- Recompute `release_state`.
- Create:
  - a new snapshot file in `proofdesk/state/snapshots/`
  - one or more event files in `proofdesk/events/`
  - one update file in `proofdesk/updates/`

Do not overwrite older snapshot/event/update files.

## 3. End-of-turn write protocol

1. Write immutable files first:
   - snapshot
   - event(s)
   - update
2. Update mutable pointers last:
   - `proofdesk/state/current.json`
   - `proofdesk/index/manifest.json`

If a write fails midway, do not partially rewrite old files.

## 4. Commit policy

Commit is allowed only when:
- `approved_for_release` is `true`
- `release_state.blocking_functions == 0`
- `release_state.ready_for_commit == "READY"`

Else:
- do not commit
- log a blocking update entry with exact reasons

## 5. Update file structure

Each update markdown file should include:
- `Summary`
- `Files Changed`
- `Status Changes`
- `Release Impact`
- `Risks`
- `Next Actions`

Keep updates concise and factual so future agents can diff progress safely.
