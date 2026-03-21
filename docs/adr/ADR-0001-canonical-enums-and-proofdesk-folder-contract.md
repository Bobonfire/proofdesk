# ADR-0001: Canonical Enums and ProofDesk Folder Contract

Status: Accepted  
Date: 2026-03-21

## Context

The design document and state model differ on status values.  
The document hierarchy states that `docs/STATE_MODEL.md` is higher priority than the design document.

## Decision

1. Canonical enums follow `docs/STATE_MODEL.md`.
2. Extra labels (`needs_refactor`, `needs_clarification`) are flags, not enum values.
3. Target repositories should use a `proofdesk/` folder contract with append-only snapshots/events/updates.
4. Mutable pointers are limited to `proofdesk/state/current.json` and `proofdesk/index/manifest.json`.

## Consequences

- Agents can safely track progress without rewriting history.
- Release readiness remains deterministic and machine-readable.
- Contract drift is reduced through schemas and naming conventions.

## References

- `docs/STATE_MODEL.md`
- `docs/DOCUMENT_HIERARCHY.md`
- `docs/PROOFDESK_CONTRACT.md`
- `contracts/*.schema.json`
