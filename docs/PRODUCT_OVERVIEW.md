# ProofDesk

ProofDesk is een local-first dev-acceptance cockpit voor vibe coders, product owners en solo builders die willen begrijpen wat er gebouwd is, functies willen testen zonder code, en releases willen uitvoeren op basis van function-level acceptance.

ProofDesk vervangt geen CI/CD.
ProofDesk vervangt geen IDE.
ProofDesk vervangt geen QA-suite.

ProofDesk maakt scope zichtbaar, testen uitvoerbaar en releasebeslissingen controleerbaar.

---

# Kernidee

Release gebeurt niet wanneer code “klaar” is.

Release gebeurt wanneer functionaliteit:

- gebouwd is
- getest is
- geaccepteerd is

AcceptanceStatus is de bron van waarheid voor release readiness.

---

# Doelgroep

Primair:

- vibe coders
- solo builders
- product owners zonder dev tooling
- founders zonder engineering team

Secundair:

- coding agents
- developers die acceptance-driven workflows willen

---

# Wat ProofDesk v1 doet

ProofDesk v1 biedt:

- epic → feature → function capability map
- function-level inspectie
- editable testcases
- API test execution vanuit UI
- UI flow verificatie met manual guidance
- statusbeheer (dev / test / acceptance)
- release readiness berekening
- approval-triggered commit automation
- local persistence

Alles werkt lokaal.

Geen backend vereist.

---

# Wat ProofDesk v1 bewust niet doet

Niet inbegrepen in v1:

- multi-user samenwerking
- authentication
- CI/CD integratie
- pipeline orchestration
- browser automation
- cloud persistence
- enterprise QA features
- observability suites

ProofDesk v1 is een acceptance cockpit, geen platform.

---

# Releasefilosofie

ProofDesk gebruikt acceptance-driven release.

Een release is toegestaan wanneer:

- high-priority functions accepted zijn
- tests passed zijn
- blocking functions ontbreken
- approval flag gezet is

Daarna kan een agent automatisch:

- commit genereren
- commit message opstellen
- wijzigingen pushen

Zonder terminalgebruik door de gebruiker.

---

# Architectuur (v1)

ProofDesk v1 is:

local-first  
frontend-only  
React + TypeScript  
JSON-seeded domain model  
localStorage persistence  

Modules:

apps/ui  
packages/domain  
packages/execution  
packages/storage  
packages/release  

Zie:

docs/ARCHITECTURE.md

voor details.

---

# Statusmodel

ProofDesk gebruikt drie kernstatussen:

devStatus  
testStatus  
acceptanceStatus  

Release readiness wordt hieruit afgeleid.

Zie:

docs/STATE_MODEL.md

voor exacte transities.

---

# Release flow

Stap 1  
Agent bouwt functionaliteit

Stap 2  
Gebruiker opent ProofDesk

Stap 3  
Gebruiker test functies

Stap 4  
Gebruiker markeert accepted

Stap 5  
Release Panel wordt READY

Stap 6  
Gebruiker klikt:

Approve for Release

Stap 7  
Agent commit en push uitgevoerd

---

# Local-first principe

ProofDesk werkt zonder backend.

Data:

seed JSON → runtime edits → localStorage → export JSON

Export JSON is machine-readable contract voor agents.

---

# Repository structuur

Belangrijkste directories:

docs/  
src/  
public/  

Domain data:

src/data/seed/

Core types:

src/types/

Execution logic:

src/lib/execution/

Release computation:

src/lib/release/

---

# Document structuur

Belangrijkste projectcontracten:

docs/AGENT_INSTRUCTIONS.md  
docs/ARCHITECTURE.md  
docs/DOCUMENT_HIERARCHY.md  
docs/DEFINITION_OF_DONE.md  
docs/STATE_MODEL.md  
docs/TEST_STRATEGY.md  
docs/SECURITY_BASELINE.md  
docs/OBSERVABILITY_RUNBOOK.md  

Deze documenten vormen samen de source-of-truth voor agentgedrag en systeemstructuur.

---

# Ontwikkelstrategie

ProofDesk wordt iteratief gebouwd.

Agents moeten:

- huidige staat expliciteren
- doelstaat expliciteren
- scoped wijzigingen maken
- contracts synchroniseren
- releasevoorwaarden respecteren

Zie:

docs/AGENT_INSTRUCTIONS.md

---

# Wanneer is ProofDesk v1 “klaar”

ProofDesk v1 is succesvol wanneer:

- capability map zichtbaar is
- function detail inspecteerbaar is
- testcases editable zijn
- API tests uitvoerbaar zijn
- UI flow verificatie mogelijk is
- statuses editable zijn
- release readiness zichtbaar is
- approval-trigger commit automation werkt

Zie:

docs/DEFINITION_OF_DONE.md

---

# Eén-zin definitie

ProofDesk is een local lightweight dev-acceptance cockpit die een MVP zichtbaar en testbaar maakt op epic-, feature- en function-niveau en releases mogelijk maakt op basis van function-level acceptance.