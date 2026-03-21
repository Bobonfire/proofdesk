# ProofDesk v1 — Agent Design Document

## 1. Product summary

Build a local-first lightweight web application called **ProofDesk**.

ProofDesk is a human-facing dev-acceptance portal for non-technical or low-code/vibe-code product owners who want to understand what has been built, inspect scope at epic/feature/function level, and run functional checks without using terminal commands, PowerShell, curl, or manual code interaction.

The app must make an MVP visible and testable through a simple control cockpit.

This is **not** a CI/CD replacement, **not** a full test automation platform, and **not** an observability suite.

It is a local control layer above the product.

## 2. Primary goal

The primary goal of ProofDesk v1 is to let a non-code user do the following from one UI:

- see what exists at epic, feature, and function level
- inspect short functional descriptions
- see development and test status
- open or run function-specific tests
- inspect input, expected output, actual output, and result
- add and edit test cases without touching code
- test both API functions and UI flows
- work fully locally

## 3. Product positioning

ProofDesk v1 should feel like:

- a capability map
- a test cockpit
- a lightweight acceptance portal
- living functional documentation

It should **not** feel like:

- a developer IDE
- a QA enterprise suite
- a complex automation tool
- a monitoring dashboard

## 4. Audience

Primary user:

- a product owner / founder / vibe coder / no-code or low-code builder
- someone who understands product behavior and requirements
- someone who notices when things are wrong
- someone who does not want to use shell commands or code-based testing tools

Secondary user:

- a coding agent or developer who uses the portal’s data structure as a source of truth for built scope and test cases

## 5. Scope for v1

### In scope

- local web app
- epic → feature → function hierarchy
- function detail view
- editable test cases
- API test execution from UI
- UI flow test guidance with pass/fail capture
- simple status model
- local persistence
- filters and search
- inline test result history per test case
- JSON-backed config/data model
- lightweight modern interface

### Out of scope

- multi-user collaboration
- auth and permissions
- CI/CD integration
- GitHub/GitLab pipeline integration
- browser automation
- advanced assertions framework
- flaky test detection
- observability/tracing
- environment orchestration
- cloud deployment as primary mode
- full audit logging
- database backend
- role-based access control
- AI-generated tests inside v1
- code coverage reporting

## 6. Core product principles

1. **Human-readable first**
Everything must be framed in business/function language, not code language.
2. **Control without code**
The user must be able to validate functionality without touching code or terminal.
3. **Local-first**
The first version must work locally with minimal setup.
4. **Testability over automation**
The app should make testing easy before it makes testing sophisticated.
5. **Editable truth**
Test cases and statuses must be editable in the UI.
6. **One-click where possible**
API checks should be runnable directly from the portal.
7. **Guided manual checks where needed**
UI flow tests may open routes and show explicit instructions rather than fully automate them.
8. **Keep v1 intentionally narrow**
Do not build a second product around the product.

## 7. Core concepts

ProofDesk uses four main entities:

- Epic
- Feature
- Function
- Test Case

Hierarchy:

- an Epic contains many Features
- a Feature contains many Functions
- a Function contains many Test Cases

A Function is the key operational unit in the product.

## 8. Functional model

### Epic

Represents a high-level capability domain.

Examples:

- Authentication
- Activities
- Analytics
- Settings

Fields:

- id
- name
- description
- priority
- status summary
- notes

### Feature

Represents a grouped sub-capability under an epic.

Examples:

- Login
- Import ride
- FTP trends

Fields:

- id
- epicId
- name
- description
- priority
- notes

### Function

Represents an actual functional behavior that can be tested or verified.

Examples:

- Login with email/password
- Import Strava activity
- Calculate FTP estimate
- Save user settings

Fields:

- id
- epicId
- featureId
- name
- shortDescription
- longDescription
- functionType
- devStatus
- testStatus
- acceptanceStatus
- priority
- owner
- tags
- screenPath
- endpointConfig
- expectedBehavior
- knownRisks
- notes

### Test Case

Represents one specific validation scenario for one function.

Examples:

- valid login
- invalid password
- duplicate activity import
- missing stream data
- FTP estimate from sample power curve

Fields:

- id
- functionId
- name
- description
- testType
- executionType
- preconditions
- input
- expectedOutput
- validationRule
- manualSteps
- passCriteria
- failCriteria
- lastResult
- lastRunAt
- notes

## 9. Status models

### Development status

Allowed values:

- not\_started
- in\_progress
- built
- partial
- needs\_refactor
- blocked

### Test status

Allowed values:

- not\_tested
- ready\_to\_test
- passed
- failed
- blocked

### Acceptance status

Allowed values:

- in\_scope
- under\_review
- accepted
- rejected
- needs\_clarification

These statuses must be editable from the UI.

Do not infer all statuses automatically in v1. Manual editing is allowed and expected.

## 10. Supported execution types

ProofDesk v1 must support two execution types.

### 10.1 API execution

Used when a function can be validated by making an API call.

Behavior:

- show request method
- show URL or endpoint
- show editable input payload or query params
- show headers if needed
- allow user to run request
- show raw response
- show parsed response if JSON
- compare response to expected outcome
- allow marking pass/fail manually
- optionally apply simple automatic validation

### 10.2 UI flow execution

Used when a function is verified through the product UI.

Behavior:

- show route or deep link
- show manual test instructions
- show expected behavior
- allow user to click “Open flow”
- allow user to mark pass/fail after verification
- allow notes on what deviated

Do not attempt browser automation in v1.

## 11. High-level UX

ProofDesk should have four main screens or panels.

### 11.1 Overview screen

Purpose:
Show the full capability map and current state.

Must include:

- app title
- summary metrics
- search
- filters
- epic/feature/function tree or matrix
- quick status indicators
- click-through to function detail

Top summary examples:

- total functions
- ready to test
- passed
- failed
- blocked

Filters:

- by epic
- by feature
- by function type
- by test status
- by dev status
- by acceptance status
- by tags
- by execution type

### 11.2 Function detail screen

Purpose:
Provide a single place to inspect one function.

Must include:

- epic and feature breadcrumb
- function name
- short description
- long description
- type
- statuses
- expected behavior
- route or endpoint
- associated test cases
- notes
- quick actions

Quick actions:

- run API test
- open UI flow
- create test case
- edit function metadata
- update status

### 11.3 Test runner panel

Purpose:
Run or verify a selected test case.

For API tests:

- input editor
- request preview
- run button
- actual output display
- expected output display
- validation result
- pass/fail control
- notes field
- save result

For UI tests:

- open flow button
- manual steps
- expected behavior
- pass/fail control
- notes field
- save result

### 11.4 Test case editor

Purpose:
Allow non-code users to create and edit test cases from the UI.

Must include:

- test case name
- description
- test type
- execution type
- input
- expected output
- validation rule
- preconditions
- manual steps
- pass criteria
- fail criteria
- notes

This must not require editing source files manually.

## 12. Information architecture

Use this relationship model:

- Overview shows many epics
- Epic contains features
- Feature contains functions
- Function contains test cases
- Test case can be executed or manually verified

At every level, the user should see enough context to understand scope without seeing source code.

## 13. Function types

Supported function types:

- api
- ui
- integration
- data\_check
- manual

In v1, focus actual runnable behavior on:

- api
- ui

The others may exist as labels for future use.

## 14. Test types

Supported test types:

- smoke
- happy\_path
- edge\_case
- negative\_case
- regression
- exploratory
- manual\_verification

These are mainly used for filtering and classification in v1.

## 15. Validation behavior

### For API tests

Support basic automatic validation modes:

- status code equals expected
- response contains key/value
- response field equals expected value
- response field exists
- string contains
- numeric range match

Also allow manual override:

- mark pass even if auto-check is inconclusive
- mark fail with notes

### For UI tests

Validation is manual in v1.

The user should see:

- what to do
- what should happen
- what counts as pass
- what counts as fail

Then the user records the result.

## 16. Data persistence

Use local persistence only in v1.

Preferred strategy:

- seed config and entities from JSON files
- persist edits and run results in local storage or lightweight local file-backed mechanism depending on framework feasibility

Preferred approach for v1:

- load baseline data from JSON
- save runtime changes to localStorage first
- optionally support import/export JSON

Reason:
This keeps the build simple and local-first.

## 17. Import/export

Support these actions in v1 if feasible without complexity explosion:

- import project JSON
- export current ProofDesk data JSON
- reset to seed data

This will help users keep the portal aligned with evolving MVP scope.

## 18. Recommended technical direction

Build as a **local React application**.

Recommended stack:

- React
- TypeScript
- Vite
- Tailwind CSS
- simple component library if useful
- localStorage for local persistence
- JSON files for seed data

Do not use a backend unless clearly required.

Do not overengineer architecture. The app should be small, inspectable, and agent-friendly.

## 19. Recommended folder structure

Use a structure similar to:

```javascript
proofdesk/
  src/
    app/
    components/
    features/
      overview/
      function-detail/
      test-runner/
      test-editor/
    data/
      seed/
        epics.json
        features.json
        functions.json
        testcases.json
    lib/
      validation/
      execution/
      storage/
      filters/
    types/
    hooks/
    pages/
  public/
  docs/
  package.json
  README.md
```

## 20. Suggested domain types

Use explicit TypeScript interfaces.

Minimum core types:

- Epic
- Feature
- FunctionItem
- TestCase
- TestRunResult
- EndpointConfig
- ValidationRule
- Status enums

Keep type definitions simple and stable.

## 21. Example JSON structures

### Epic example

```javascript
{
  "id": "epic_analytics",
  "name": "Analytics",
  "description": "Capabilities related to performance insights and calculations.",
  "priority": "high",
  "notes": ""
}
```

### Feature example

```javascript
{
  "id": "feature_ftp_trends",
  "epicId": "epic_analytics",
  "name": "FTP Trends",
  "description": "Calculate and display FTP trend-related insights.",
  "priority": "high",
  "notes": ""
}
```

### Function example

```javascript
{
  "id": "function_calculate_ftp_estimate",
  "epicId": "epic_analytics",
  "featureId": "feature_ftp_trends",
  "name": "Calculate FTP estimate",
  "shortDescription": "Estimate FTP from supported input data.",
  "longDescription": "This function calculates an FTP estimate based on selected source data and configured estimation logic.",
  "functionType": "api",
  "devStatus": "built",
  "testStatus": "ready_to_test",
  "acceptanceStatus": "under_review",
  "priority": "high",
  "owner": "",
  "tags": ["analytics", "ftp", "api"],
  "screenPath": "",
  "endpointConfig": {
    "method": "POST",
    "url": "http://localhost:3000/api/ftp/estimate",
    "headers": {
      "Content-Type": "application/json"
    }
  },
  "expectedBehavior": "Returns a valid FTP estimate and explanation object.",
  "knownRisks": "May fail on incomplete input payloads.",
  "notes": ""
}
```

### Test case example

```javascript
{
  "id": "tc_ftp_valid_input",
  "functionId": "function_calculate_ftp_estimate",
  "name": "Valid FTP estimate request",
  "description": "Checks whether a valid payload returns a valid FTP estimate.",
  "testType": "happy_path",
  "executionType": "api",
  "preconditions": ["API is running locally"],
  "input": {
    "powerCurve": {
      "300": 340,
      "600": 325,
      "1200": 305
    },
    "weightKg": 75
  },
  "expectedOutput": {
    "statusCode": 200,
    "bodyContains": ["ftpEstimate"]
  },
  "validationRule": {
    "mode": "status_and_field_exists",
    "expectedStatusCode": 200,
    "requiredFields": ["ftpEstimate"]
  },
  "manualSteps": [],
  "passCriteria": "Response returns status 200 and contains ftpEstimate.",
  "failCriteria": "Request errors, returns wrong structure, or lacks ftpEstimate.",
  "lastResult": "",
  "lastRunAt": "",
  "notes": ""
}
```

### UI flow test case example

```javascript
{
  "id": "tc_open_ftp_chart_screen",
  "functionId": "function_show_ftp_chart",
  "name": "Open FTP chart and confirm rendering",
  "description": "Checks whether the chart screen opens and displays trend data.",
  "testType": "smoke",
  "executionType": "ui",
  "preconditions": ["Frontend app is running locally", "Test data exists"],
  "input": {},
  "expectedOutput": {
    "route": "http://localhost:5173/analytics/ftp"
  },
  "validationRule": {
    "mode": "manual"
  },
  "manualSteps": [
    "Click Open flow.",
    "Confirm that the FTP trend page loads.",
    "Confirm that a chart is visible.",
    "Confirm that no error state is shown."
  ],
  "passCriteria": "Page loads, chart is visible, and no blocking UI errors appear.",
  "failCriteria": "Page fails to load, chart is missing, or visible errors block usage.",
  "lastResult": "",
  "lastRunAt": "",
  "notes": ""
}
```

## 22. UI requirements

### Visual character

The app should feel:

- clean
- modern
- lightweight
- structured
- confidence-building

It should not feel playful or overloaded.

### Layout

Prefer a split layout:

- left side: hierarchy / filters / list
- right side: detail panel
- modal or drawer for test execution and editing

Alternative:

- top summary
- left navigation
- center list
- right detail pane

### Density

Keep information compact but readable. This is a tool, not a marketing site.

### Status rendering

Statuses should be visually distinct and easy to scan.

Use consistent badges or chips.

### Navigation

The user must always know:

- where they are
- which epic/feature/function they are in
- what they can do next

## 23. Functional requirements

### FR-01 Overview hierarchy

The app must display a hierarchical overview of epics, features, and functions.

### FR-02 Search and filter

The app must support searching by name and filtering by status, type, epic, and tags.

### FR-03 Function inspection

The app must display function-level details including description, statuses, expected behavior, and linked test cases.

### FR-04 Editable statuses

The user must be able to update development, test, and acceptance statuses from the UI.

### FR-05 Test case listing

The user must be able to see all test cases linked to a function.

### FR-06 Test case creation

The user must be able to create a new test case from the UI.

### FR-07 Test case editing

The user must be able to edit existing test cases from the UI.

### FR-08 API test execution

The user must be able to run API-based test cases directly from the portal.

### FR-09 API input editing

The user must be able to inspect and edit the input payload before running an API test.

### FR-10 API result display

The app must show actual API response data after execution.

### FR-11 Basic validation

The app must support simple validation against expected output for API tests.

### FR-12 Manual result override

The user must be able to mark a test pass/fail manually and add notes.

### FR-13 UI flow launch

The user must be able to launch UI-based flows from the portal.

### FR-14 UI test guidance

The app must show manual instructions and expected behavior for UI flow tests.

### FR-15 Run result history

The app should store the last result and timestamp for each test case.

### FR-16 Local persistence

User changes and test results must persist locally.

### FR-17 Import/export

The app should support exporting and importing ProofDesk data as JSON.

## 24. Non-functional requirements

### NFR-01 Local-first

The application must run locally with minimal setup.

### NFR-02 No backend dependency

The default app must not require a backend service of its own.

### NFR-03 Clear UX

The app must remain understandable to non-technical users.

### NFR-04 Fast interaction

Navigation and test execution UX must feel immediate.

### NFR-05 Simple maintainability

The internal model should remain simple enough for agent-assisted iteration.

### NFR-06 Portable data

Core data should be stored in simple portable JSON structures.

## 25. V1 simplifications

To prevent scope creep, deliberately simplify the following:

- no browser automation
- no advanced assertion DSL
- no environment management
- no authentication
- no collaborative editing
- no live test recording
- no plugin system
- no dynamic code scanning
- no smart auto-discovery of all routes/endpoints
- no automatic requirement ingestion

These may become future product features, but not in v1.

## 26. Expected user flows

### Flow A — inspect built scope

1. User opens ProofDesk
2. User sees summary counts
3. User filters to one epic
4. User selects feature
5. User opens function detail
6. User reads description and status

### Flow B — run API test

1. User opens function detail
2. User selects API test case
3. User reviews input and expected output
4. User edits input if needed
5. User clicks Run test
6. App executes request
7. App displays response
8. App shows validation result
9. User saves pass/fail and notes

### Flow C — verify UI flow

1. User opens function detail
2. User selects UI test case
3. User reads manual steps and expected behavior
4. User clicks Open flow
5. Linked UI opens
6. User verifies behavior manually
7. User returns to ProofDesk
8. User records pass/fail and notes

### Flow D — add testcase

1. User opens function detail
2. User clicks New test case
3. User fills in fields
4. User saves
5. New test case appears in function detail

## 27. Data editing model

Use a simple editing model:

- all seed data loads from JSON
- runtime modifications are stored locally
- user can export current state
- later versions may sync to files or cloud, but not in v1

The app should not assume all config is immutable.

## 28. Error handling

The app must handle these cases gracefully:

- API endpoint unavailable
- invalid JSON input
- malformed expected output
- missing route for UI flow
- missing linked function or feature
- local persistence load failure

When errors occur:

- show plain-language error messages
- do not expose raw stack traces in main UI
- allow recovery where possible

## 29. Suggested MVP starter dataset

The coding agent should create a small seed dataset with:

- 3 epics
- 2–3 features per epic
- 2–4 functions per feature
- 1–3 test cases per function

This should allow the portal to feel complete immediately and make the structure easy to extend.

## 30. Acceptance criteria for v1 build

ProofDesk v1 is successful when all of the following are true:

1. The user can open a local web app and see a structured map of epics, features, and functions.
2. The user can inspect at least one function with a full detail view.
3. The user can update statuses without editing code.
4. The user can create and edit a test case from the UI.
5. The user can run at least one API test case directly from the portal.
6. The user can launch at least one UI flow from the portal and record pass/fail manually.
7. The user can inspect expected vs actual output for API tests.
8. The user can filter functions by test status and function type.
9. The user can close and reopen the app without losing local edits.
10. The interface is understandable without technical knowledge.

## 31. Build instructions for the coding agent

Build a local-first React + TypeScript application named ProofDesk.

The product must provide:

- a hierarchical overview of epics, features, functions
- function detail screens
- editable statuses
- editable test cases
- direct API test execution
- manual UI flow verification support
- local persistence
- import/export support if feasible

Use JSON seed files as the baseline source of truth.

Optimize for:

- clarity
- low friction
- non-technical usage
- maintainability
- future extensibility

Do not build:

- CI/CD features
- auth
- backend services unless truly necessary
- browser automation
- excessive abstraction

Prefer:

- simple strong types
- clean UI
- explicit components
- shallow architecture
- localStorage persistence
- a small validation utility for API tests

## 32. Design guardrails for the coding agent

Do not overengineer.

Do not invent enterprise features.

Do not introduce heavy dependencies unless they clearly reduce complexity.

Do not make the UI developer-centric.

Do not optimize for multi-user workflows.

Do not hide important information behind too many clicks.

Make the portal feel like a practical functional cockpit.

## 33. Future extensions, not for v1

These may be added later in product mode:

- Netlify deployment
- shared workspace or multi-user mode
- cloud persistence
- test suite collections
- browser automation integration
- CI pipeline hooks
- requirement import and sync
- route and endpoint auto-discovery
- agent-assisted testcase generation
- evidence screenshots
- productized template export for other vibe coders

## 34. Final one-sentence definition

**ProofDesk v1 is a local lightweight dev-acceptance cockpit that makes an MVP visible and testable at epic, feature, and function level, with editable test cases and no-code execution paths for API and UI validation.**