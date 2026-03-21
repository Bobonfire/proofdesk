# ProofDesk v1 — Agent Build & Release Brief

## 1. Objective

Build a local-first application called **ProofDesk** and implement an **agent-driven release flow** where:

- the user performs UAT inside ProofDesk
- test outcomes are captured in the app
- once acceptance criteria are met, the agent:
    - commits changes
    - creates a structured commit message
    - pushes to the repository

No manual Git interaction should be required by the user.

***

## 2. System responsibilities

The system consists of two logical parts:

### A. ProofDesk (UI layer)

- visibility (what is built)
- state (status tracking)
- execution (run tests)
- acceptance (user-driven validation)

### B. Agent Runtime (automation layer)

- monitors acceptance state
- evaluates release conditions
- performs git actions (commit + push)

***

## 3. Release philosophy

Release is not triggered by code completion.

Release is triggered by:

**function-level acceptance validated through ProofDesk**

This means:

- “built” ≠ ready
- “tested” ≠ accepted
- only “accepted” contributes to release readiness

***

## 4. Acceptance model

Define release readiness as:

A release is allowed when:

- all functions with priority = high are:
    - devStatus = built OR partial
    - testStatus = passed
    - acceptanceStatus = accepted

Optional extension (not required in v1):

- medium priority partially required
- low priority ignored

***

## 5. Required new entity: Release State

Add a computed layer:

```javascript
ReleaseState:
  totalFunctions
  acceptedFunctions
  requiredFunctions
  failedFunctions
  readyForRelease (boolean)
```

This should be visible in the UI as a **Release Panel**.

***

## 6. UI addition — Release Panel

Add a top-level component:

### Release Panel must show:

- % accepted (progress bar)
- count of:
    - total functions
    - accepted
    - failed
    - not tested
- blocking items (list of functions not accepted)

### Critical element:

A **"Ready for Commit" indicator**

States:

- NOT\_READY
- ALMOST\_READY
- READY

***

## 7. UAT trigger

Add a button:

**"Approve for Release"**

This button is only enabled when:

- release conditions are met

When clicked:

- mark project as `approved_for_release = true`
- persist locally

***

## 8. Agent responsibilities after approval

The coding agent must:

### Step 1 — Detect approval

- read ProofDesk state (JSON or local storage export)
- detect `approved_for_release = true`

### Step 2 — Generate commit scope

The agent must:

- extract all functions where:
    - acceptanceStatus = accepted
- group them by feature/epic

### Step 3 — Generate commit message

Format:

```javascript
feat: UAT-approved release via ProofDesk

Accepted scope:

Epic: Analytics
- Calculate FTP estimate
- Show FTP chart

Epic: Activities
- Import Strava activity

Test status:
- All high-priority functions passed and accepted

Generated via ProofDesk UAT
```

### Step 4 — Git actions

The agent must:

- stage all relevant changes
- create commit
- push to configured branch (default: main or dev depending on setup)

No user interaction required.

***

## 9. Safety constraints

The agent must NOT:

- commit if approval flag is false
- commit if blocking functions exist
- overwrite unrelated changes blindly
- push if git state is invalid

If blocked:

- return clear explanation in terminal/log

***

## 10. Data contract between UI and agent

ProofDesk must expose a **machine-readable state**.

Preferred format:

```javascript
{
  "approved_for_release": true,
  "functions": [
    {
      "id": "function_calculate_ftp_estimate",
      "priority": "high",
      "devStatus": "built",
      "testStatus": "passed",
      "acceptanceStatus": "accepted"
    }
  ]
}
```

The agent must use this as the source of truth.

***

## 11. Minimal implementation approach

Keep this simple:

### ProofDesk side:

- store state in JSON or localStorage
- add export button:
→ `Export ProofDesk State`

### Agent side:

- read exported JSON file
- evaluate conditions
- execute git commands

***

## 12. Git integration approach (v1)

Do NOT overengineer.

Use:

- local git CLI
- simple commands:
    - `git add .`
    - `git commit -m "..."`
    - `git push`

Do not:

- build custom git clients
- introduce complex branching logic

***

## 13. Optional enhancement (low effort, high value)

Add in UI:

- "Last commit status"
- "Last release timestamp"
- "Last commit message preview"

This gives user confidence.

***

## 14. UX principle for release

The user should feel:

“I validated this → now ship it”

NOT:

“I need to understand git”

***

## 15. End-to-end flow

### Step 1

Agent builds features

### Step 2

User opens ProofDesk

### Step 3

User:

- reviews functions
- runs tests
- adjusts test cases
- marks pass/fail
- marks accepted

### Step 4

Release Panel becomes READY

### Step 5

User clicks:
**Approve for Release**

### Step 6

Agent detects approval

### Step 7

Agent:

- generates commit
- commits
- pushes

### Step 8

System resets approval flag

***

## 16. Guardrails

Agent must prioritize:

- correctness over automation
- transparency over magic
- reversibility over speed

***

## 17. What makes this powerful (design intent)

You are effectively creating:

**a human-in-the-loop CI system**

But:

- driven by functional validation
- not pipelines
- not YAML configs
- not dev tooling

This is exactly aligned with vibe coding.

***

## 18. Final instruction to agent

Build ProofDesk v1 as specified.

Additionally implement:

- release state computation
- approval trigger
- exportable state
- agent-readable contract
- git automation after approval

Keep everything:

- simple
- local-first
- transparent
- editable

Do not introduce complexity beyond what is required to:

- visualize scope
- run tests
- capture acceptance
- trigger release