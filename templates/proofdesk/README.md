# ProofDesk Folder Template

Copy this `proofdesk/` structure into a target repository to track ProofDesk progress in an LLM-friendly, append-only format.

## What is immutable
- `state/snapshots/*`
- `events/*`
- `updates/*`

## What is mutable
- `state/current.json`
- `index/manifest.json`

Never edit old snapshots/events/updates. Add a new entry and use `supersedes` if you need correction.
