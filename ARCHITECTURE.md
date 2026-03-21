# Architecture — ProofDesk

Architecture style:
Local-first modular frontend system.

Primary modules:
apps/ui
packages/domain
packages/execution
packages/storage
packages/release

Data flow:
Seed JSON → Domain model → Editable UI state → localStorage → Export JSON → Release agent

Release logic:
acceptanceStatus drives release readiness
release readiness drives commit eligibility

Non-goals:
- backend
- auth
- pipelines
- browser automation
