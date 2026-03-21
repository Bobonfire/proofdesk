# Document Hierarchy — ProofDesk

Precedence order:

1. ADR decisions
2. AGENT_INSTRUCTIONS.md
3. ARCHITECTURE.md
4. STATE_MODEL.md
5. DEFINITION_OF_DONE.md
6. TEST_STRATEGY.md
7. SECURITY_BASELINE.md
8. OBSERVABILITY_RUNBOOK.md

Contract integrity rule:

When domain types change:
- update seed JSON
- update release-state computation
- update status transitions
in the same PR.
