# Document Hierarchy — ProofDesk

Precedence order:

1. ADR decisions
2. docs/AGENT_INSTRUCTIONS.md
3. docs/ARCHITECTURE.md
4. docs/STATE_MODEL.md
5. docs/DEFINITION_OF_DONE.md
6. docs/TEST_STRATEGY.md
7. docs/SECURITY_BASELINE.md
8. docs/OBSERVABILITY_RUNBOOK.md

Contract integrity rule:

When domain types change:
- update seed JSON
- update release-state computation
- update status transitions
in the same PR.
