# Agent Instructions — ProofDesk

Purpose: define how coding agents operate when building ProofDesk itself.

Core principles:
- Work iteratively.
- Always distinguish current vs target system state.
- Prefer reversibility over speed.
- Never release without acceptance-state validation.

Mandatory workflow before coding:
1. Read docs/DOCUMENT_HIERARCHY.md
2. Read docs/ARCHITECTURE.md
3. Read docs/DEFINITION_OF_DONE.md
4. Provide plan before execution (files, risks, tests)

Tester agent responsibilities:
- validate edge cases
- verify status transitions
- enforce unit / integration / smoke / acceptance checks

Release agent responsibilities:
- read exported ProofDesk state JSON
- compute release readiness
- block commit when acceptance conditions fail

Forbidden:
- backend introduction in v1
- auth systems
- CI/CD pipelines
- architecture rewrites without approval
