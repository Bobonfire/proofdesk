import { useEffect, useMemo, useState } from "react";
import {
  type ScopeLevel,
  seedProject,
  type AcceptanceStatus,
  type DevStatus,
  type Feature,
  type FunctionItem,
  type RuntimeState,
  type TestCase,
  type TestRunRecord,
  type TestStatus
} from "@proofdesk/domain";
import { runApiExecution } from "@proofdesk/execution";
import { computeReleaseState, computeScopeReadiness } from "@proofdesk/release";
import { loadRuntimeState, saveRuntimeState } from "@proofdesk/storage";

const DEV_STATUSES: DevStatus[] = ["not_started", "in_progress", "built", "partial", "blocked"];
const TEST_STATUSES: TestStatus[] = ["not_tested", "ready_to_test", "passed", "failed"];
const ACCEPTANCE_STATUSES: AcceptanceStatus[] = ["in_scope", "under_review", "accepted", "rejected"];
const TEST_TYPES: Array<TestCase["type"]> = ["smoke", "happy_path", "edge_case", "negative_case"];
const EXECUTION_TYPES: Array<TestCase["executionType"]> = ["api", "ui"];
const HTTP_METHODS: NonNullable<TestCase["apiConfig"]>["method"][] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const UI_SCOPE_LEVELS: ScopeLevel[] = ["Function", "Feature", "Epic"];

function readyBadgeClass(state: "NOT_READY" | "ALMOST_READY" | "READY"): string {
  if (state === "READY") {
    return "badge badge-ready";
  }

  if (state === "ALMOST_READY") {
    return "badge badge-almost";
  }

  return "badge badge-not";
}

function statusFlowStep(func: FunctionItem): 1 | 2 | 3 {
  if (func.acceptanceStatus === "accepted") {
    return 3;
  }

  if (func.testStatus === "passed") {
    return 2;
  }

  return 1;
}

function functionIdsForEpic(featureById: Map<string, Feature>, epicFeatureIds: string[], functions: FunctionItem[]): string[] {
  const featureSet = new Set(epicFeatureIds);
  return functions
    .filter((func) => {
      const feature = featureById.get(func.featureId);
      return Boolean(feature && featureSet.has(feature.id));
    })
    .map((func) => func.id);
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function toCompactUtcTimestamp(dateIso: string): string {
  const d = new Date(dateIso);
  const year = d.getUTCFullYear().toString().padStart(4, "0");
  const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = d.getUTCDate().toString().padStart(2, "0");
  const hour = d.getUTCHours().toString().padStart(2, "0");
  const min = d.getUTCMinutes().toString().padStart(2, "0");
  const sec = d.getUTCSeconds().toString().padStart(2, "0");
  return `${year}${month}${day}T${hour}${min}${sec}Z`;
}

function randomHex(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => (b % 16).toString(16))
    .join("")
    .slice(0, length);
}

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function writeTextFile(dirHandle: any, filename: string, content: string): Promise<void> {
  const handle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

export default function App() {
  const stored = useMemo(() => loadRuntimeState(), []);
  const [functions, setFunctions] = useState<FunctionItem[]>(stored?.functions ?? seedProject.functions);
  const [testCases, setTestCases] = useState<TestCase[]>(stored?.testCases ?? seedProject.testCases);
  const [runHistory, setRunHistory] = useState<TestRunRecord[]>(stored?.runHistory ?? []);
  const [approvedForRelease, setApprovedForRelease] = useState<boolean>(stored?.approvedForRelease ?? false);
  const [scopeLevel, setScopeLevel] = useState<ScopeLevel>("Function");
  const [selectedScopeId, setSelectedScopeId] = useState<string>("");
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>(
    (stored?.functions ?? seedProject.functions)[0]?.id ?? ""
  );
  const [apiResultText, setApiResultText] = useState<string>("");
  const [isRunningApi, setIsRunningApi] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string>("");

  const runtimeState: RuntimeState = useMemo(
    () => ({
      approvedForRelease,
      functions,
      testCases,
      runHistory
    }),
    [approvedForRelease, functions, testCases, runHistory]
  );

  useEffect(() => {
    saveRuntimeState(runtimeState);
  }, [runtimeState]);

  const releaseState = useMemo(
    () => computeReleaseState(functions, approvedForRelease),
    [functions, approvedForRelease]
  );
  const scopeReadiness = useMemo(
    () => computeScopeReadiness(functions, seedProject.features, seedProject.epics),
    [functions]
  );

  const featureById = useMemo(() => {
    return new Map(seedProject.features.map((feature) => [feature.id, feature]));
  }, []);
  const functionById = useMemo(() => new Map(functions.map((func) => [func.id, func])), [functions]);

  const scopeItems = useMemo(() => {
    if (scopeLevel === "Function") {
      return functions.map((func) => ({ id: func.id, name: func.name }));
    }

    if (scopeLevel === "Feature") {
      return seedProject.features.map((feature) => ({ id: feature.id, name: feature.name }));
    }

    return seedProject.epics.map((epic) => ({ id: epic.id, name: epic.name }));
  }, [functions, scopeLevel]);

  useEffect(() => {
    if (scopeItems.length === 0) {
      setSelectedScopeId("");
      return;
    }

    const exists = scopeItems.some((item) => item.id === selectedScopeId);
    if (!exists) {
      setSelectedScopeId(scopeItems[0].id);
    }
  }, [scopeItems, selectedScopeId]);

  const scopedFunctions = useMemo(() => {
    if (!selectedScopeId) {
      return functions;
    }

    if (scopeLevel === "Function") {
      return functions.filter((func) => func.id === selectedScopeId);
    }

    if (scopeLevel === "Feature") {
      return functions.filter((func) => func.featureId === selectedScopeId);
    }

    const epic = seedProject.epics.find((item) => item.id === selectedScopeId);
    if (!epic) {
      return [];
    }

    const functionIds = new Set(functionIdsForEpic(featureById, epic.featureIds, functions));
    return functions.filter((func) => functionIds.has(func.id));
  }, [featureById, functions, scopeLevel, selectedScopeId]);

  useEffect(() => {
    if (scopedFunctions.length === 0) {
      return;
    }

    const exists = scopedFunctions.some((func) => func.id === selectedFunctionId);
    if (!exists) {
      setSelectedFunctionId(scopedFunctions[0].id);
    }
  }, [scopedFunctions, selectedFunctionId]);

  const selectedFunction = useMemo(
    () => functions.find((func) => func.id === selectedFunctionId) ?? functions[0],
    [functions, selectedFunctionId]
  );

  const selectedScopeReadinessItem = useMemo(() => {
    if (!selectedScopeId) {
      return null;
    }

    if (scopeLevel === "Function") {
      return scopeReadiness.function.find((item) => item.scopeId === selectedScopeId) ?? null;
    }

    if (scopeLevel === "Feature") {
      return scopeReadiness.feature.find((item) => item.scopeId === selectedScopeId) ?? null;
    }

    return scopeReadiness.epic.find((item) => item.scopeId === selectedScopeId) ?? null;
  }, [scopeLevel, scopeReadiness, selectedScopeId]);

  const scopedHighPriorityCount = useMemo(
    () => scopedFunctions.filter((func) => func.priority === "high").length,
    [scopedFunctions]
  );

  const scopedHighPriorityAcceptedCount = useMemo(
    () =>
      scopedFunctions.filter(
        (func) =>
          func.priority === "high" &&
          (func.devStatus === "built" || func.devStatus === "partial") &&
          func.testStatus === "passed" &&
          func.acceptanceStatus === "accepted"
      ).length,
    [scopedFunctions]
  );

  const selectedFunctionTestCases = useMemo(
    () => testCases.filter((tc) => tc.functionId === selectedFunction?.id),
    [selectedFunction?.id, testCases]
  );

  const blockedByFunctions = useMemo(
    () =>
      (selectedFunction?.blockedByFunctionIds ?? [])
        .map((id) => functionById.get(id))
        .filter((item): item is FunctionItem => Boolean(item)),
    [functionById, selectedFunction?.blockedByFunctionIds]
  );

  const firstApiTestCase = useMemo(
    () => selectedFunctionTestCases.find((tc) => tc.executionType === "api"),
    [selectedFunctionTestCases]
  );

  const [selectedApiTestCaseId, setSelectedApiTestCaseId] = useState<string>(firstApiTestCase?.id ?? "");

  useEffect(() => {
    if (!firstApiTestCase) {
      setSelectedApiTestCaseId("");
      return;
    }

    const exists = selectedFunctionTestCases.some((tc) => tc.id === selectedApiTestCaseId && tc.executionType === "api");
    if (!exists) {
      setSelectedApiTestCaseId(firstApiTestCase.id);
    }
  }, [firstApiTestCase, selectedApiTestCaseId, selectedFunctionTestCases]);

  const selectedApiTestCase = useMemo(
    () => testCases.find((tc) => tc.id === selectedApiTestCaseId && tc.executionType === "api"),
    [selectedApiTestCaseId, testCases]
  );

  function updateFunction(functionId: string, update: Partial<FunctionItem>) {
    setFunctions((prev) =>
      prev.map((func) => {
        if (func.id !== functionId) {
          return func;
        }

        return {
          ...func,
          ...update
        };
      })
    );
  }

  function addTestCase(functionId: string) {
    const testCase: TestCase = {
      id: createId("tc"),
      functionId,
      name: "New test case",
      type: "smoke",
      executionType: "api",
      expectedOutcome: "Expected behavior description",
      apiConfig: {
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/todos/1",
        expectedStatus: 200
      }
    };

    setTestCases((prev) => [testCase, ...prev]);
  }

  function updateTestCase(testCaseId: string, update: Partial<TestCase>) {
    setTestCases((prev) =>
      prev.map((tc) => {
        if (tc.id !== testCaseId) {
          return tc;
        }

        const next = { ...tc, ...update };
        if (next.executionType === "ui") {
          delete next.apiConfig;
        } else if (!next.apiConfig) {
          next.apiConfig = {
            method: "GET",
            url: "https://jsonplaceholder.typicode.com/todos/1",
            expectedStatus: 200
          };
        }

        return next;
      })
    );
  }

  function removeTestCase(testCaseId: string) {
    setTestCases((prev) => prev.filter((tc) => tc.id !== testCaseId));
  }

  async function runSelectedApiTest() {
    if (!selectedApiTestCase || !selectedApiTestCase.apiConfig || !selectedFunction) {
      return;
    }

    setIsRunningApi(true);
    setApiResultText("");

    const startedAt = new Date().toISOString();
    try {
      let headers: Record<string, string> | undefined;
      if (selectedApiTestCase.apiConfig.headersJson?.trim()) {
        headers = JSON.parse(selectedApiTestCase.apiConfig.headersJson) as Record<string, string>;
      }

      const result = await runApiExecution({
        method: selectedApiTestCase.apiConfig.method,
        url: selectedApiTestCase.apiConfig.url,
        body: selectedApiTestCase.apiConfig.body,
        headers
      });

      const expectedStatus = selectedApiTestCase.apiConfig.expectedStatus;
      const expectedBodyIncludes = selectedApiTestCase.apiConfig.expectedBodyIncludes;
      const statusMatch = expectedStatus ? result.status === expectedStatus : result.ok;
      const bodyMatch = expectedBodyIncludes ? result.bodyText.includes(expectedBodyIncludes) : true;
      const passed = statusMatch && bodyMatch;

      const detailParts = [
        `status=${result.status}`,
        expectedStatus ? `expectedStatus=${expectedStatus}` : "expectedStatus=any-2xx",
        expectedBodyIncludes ? `expectedBodyIncludes=${expectedBodyIncludes}` : "expectedBodyIncludes=none"
      ];

      const historyRecord: TestRunRecord = {
        id: createId("run"),
        testCaseId: selectedApiTestCase.id,
        functionId: selectedFunction.id,
        executedAt: startedAt,
        result: passed ? "passed" : "failed",
        statusCode: result.status,
        details: detailParts.join(" | ")
      };

      setRunHistory((prev) => [historyRecord, ...prev].slice(0, 100));
      updateFunction(selectedFunction.id, {
        testStatus: passed ? "passed" : "failed"
      });
      setApiResultText(result.bodyText.slice(0, 3000));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown API test error";
      const historyRecord: TestRunRecord = {
        id: createId("run"),
        testCaseId: selectedApiTestCase.id,
        functionId: selectedFunction.id,
        executedAt: startedAt,
        result: "error",
        details: message
      };

      setRunHistory((prev) => [historyRecord, ...prev].slice(0, 100));
      updateFunction(selectedFunction.id, {
        testStatus: "failed"
      });
      setApiResultText(`API test error: ${message}`);
    } finally {
      setIsRunningApi(false);
    }
  }

  async function exportProofdeskState() {
    setExportMessage("Exporting...");
    const generatedAt = new Date().toISOString();
    const compact = toCompactUtcTimestamp(generatedAt);
    const shortSha = randomHex(7);
    const snapshotName = `PD_STATE_${compact}_${shortSha}.json`;
    const eventSeq = String(runHistory.length + 1).padStart(4, "0");
    const updateSeq = String(runHistory.length + 1).padStart(4, "0");
    const eventName = `PD_EVT_${compact}_${eventSeq}_release_readiness_computed.json`;
    const updateName = `PD_UPD_${compact}_${updateSeq}_ui_export.md`;

    const currentObj = {
      schema_version: "1.0.0",
      generated_at: generatedAt,
      source: "proofdesk-ui",
      current_snapshot: snapshotName,
      approved_for_release: approvedForRelease,
      release_state: {
        ready_for_commit: releaseState.readyForCommit,
        total_functions: releaseState.totalFunctions,
        required_functions: releaseState.requiredFunctions,
        accepted_functions: releaseState.acceptedFunctions,
        blocking_functions: releaseState.blockingFunctions,
        readiness_reason: releaseState.readinessReason
      },
      functions: functions.map((func) => ({
        id: func.id,
        title: func.name,
        priority: func.priority,
        devStatus: func.devStatus,
        testStatus: func.testStatus,
        acceptanceStatus: func.acceptanceStatus,
        blocked_by_function_ids: func.blockedByFunctionIds ?? [],
        quality_flags: {
          needs_refactor: Boolean(func.qualityFlags?.needs_refactor),
          needs_clarification: Boolean(func.qualityFlags?.needs_clarification)
        },
        notes: func.notes ?? "",
        last_updated_at: generatedAt
      })),
      test_cases: testCases,
      run_history: runHistory,
      supersedes_snapshot: null
    };

    const projectObj = {
      schema_version: "1.0.0",
      project_id: "proofdesk_ui_project",
      project_name: "ProofDesk UI Project",
      repo_root: ".",
      default_branch: "main",
      created_at: generatedAt,
      status_enums: {
        devStatus: DEV_STATUSES,
        testStatus: TEST_STATUSES,
        acceptanceStatus: ACCEPTANCE_STATUSES,
        readyForCommit: ["NOT_READY", "ALMOST_READY", "READY"]
      }
    };

    const snapshotText = JSON.stringify(currentObj, null, 2);
    const currentText = JSON.stringify(currentObj, null, 2);
    const projectText = JSON.stringify(projectObj, null, 2);
    const eventObj = {
      schema_version: "1.0.0",
      event_id: `PD_EVT_${compact}_${eventSeq}_release_readiness_computed`,
      seq: runHistory.length + 1,
      created_at: generatedAt,
      type: "release_readiness_computed",
      actor: "system",
      function_id: null,
      payload: {
        ready_for_commit: releaseState.readyForCommit,
        blocking_functions: releaseState.blockingFunctions,
        reason: releaseState.readinessReason
      },
      snapshot_ref: snapshotName,
      supersedes: null
    };
    const eventText = JSON.stringify(eventObj, null, 2);
    const updateText = `---
update_id: PD_UPD_${compact}_${updateSeq}_ui_export
seq: ${runHistory.length + 1}
created_at: ${generatedAt}
supersedes: null
snapshot_ref: ${snapshotName}
---

# Summary

Export created from ProofDesk UI.

# Files Changed

- proofdesk/config/project.json
- proofdesk/state/current.json
- proofdesk/state/snapshots/${snapshotName}
- proofdesk/events/${eventName}
- proofdesk/index/manifest.json

# Status Changes

- Runtime state exported for agent consumption.

# Release Impact

- ready_for_commit: ${releaseState.readyForCommit}
- blocking_functions: ${releaseState.blockingFunctions}

# Risks

- Export reflects current UI state only.

# Next Actions

1. Continue validation.
2. Re-export after state changes.
`;

    const snapshotHash = await sha256Hex(snapshotText);
    const eventHash = await sha256Hex(eventText);
    const updateHash = await sha256Hex(updateText);

    const manifestObj = {
      schema_version: "1.0.0",
      project_id: "proofdesk_ui_project",
      generated_at: generatedAt,
      latest_snapshot: snapshotName,
      latest_event_seq: runHistory.length + 1,
      latest_update_seq: runHistory.length + 1,
      items: [
        {
          type: "snapshot",
          file: `proofdesk/state/snapshots/${snapshotName}`,
          sha256: snapshotHash,
          created_at: generatedAt,
          supersedes: null
        },
        {
          type: "event",
          file: `proofdesk/events/${eventName}`,
          sha256: eventHash,
          created_at: generatedAt,
          supersedes: null
        },
        {
          type: "update",
          file: `proofdesk/updates/${updateName}`,
          sha256: updateHash,
          created_at: generatedAt,
          supersedes: null
        }
      ]
    };
    const manifestText = JSON.stringify(manifestObj, null, 2);

    const picker = (window as unknown as { showDirectoryPicker?: () => Promise<any> }).showDirectoryPicker;
    if (picker) {
      const repoRoot = await picker();
      const proofdeskDir = await repoRoot.getDirectoryHandle("proofdesk", { create: true });
      const configDir = await proofdeskDir.getDirectoryHandle("config", { create: true });
      const stateDir = await proofdeskDir.getDirectoryHandle("state", { create: true });
      const snapshotsDir = await stateDir.getDirectoryHandle("snapshots", { create: true });
      const eventsDir = await proofdeskDir.getDirectoryHandle("events", { create: true });
      const updatesDir = await proofdeskDir.getDirectoryHandle("updates", { create: true });
      const indexDir = await proofdeskDir.getDirectoryHandle("index", { create: true });

      await writeTextFile(configDir, "project.json", projectText);
      await writeTextFile(stateDir, "current.json", currentText);
      await writeTextFile(snapshotsDir, snapshotName, snapshotText);
      await writeTextFile(eventsDir, eventName, eventText);
      await writeTextFile(updatesDir, updateName, updateText);
      await writeTextFile(indexDir, "manifest.json", manifestText);
      setExportMessage("Export complete: files written to selected folder/proofdesk.");
      return;
    }

    const fallbackBundle = {
      "proofdesk/config/project.json": projectObj,
      "proofdesk/state/current.json": currentObj,
      [`proofdesk/state/snapshots/${snapshotName}`]: currentObj,
      [`proofdesk/events/${eventName}`]: eventObj,
      [`proofdesk/updates/${updateName}`]: updateText,
      "proofdesk/index/manifest.json": manifestObj
    };

    const blob = new Blob([JSON.stringify(fallbackBundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proofdesk_bundle_${compact}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setExportMessage("Export complete: fallback bundle downloaded as one JSON file.");
  }

  return (
    <div className="app">
      <header className="header">
        <h1>ProofDesk v1</h1>
        <p>Local-first acceptance cockpit for function-level release readiness.</p>
        <p className="meta">
          Tip: zolang de server draait kun je verversen voor de nieuwste UI. Tijdens development werkt live update ook.
        </p>
      </header>

      <div className="grid">
        <section className="card">
          <h2>Scope Perspective</h2>
          <div className="scope-switcher" role="tablist" aria-label="Scope perspective switch">
            {UI_SCOPE_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                className={scopeLevel === level ? "scope-tab active" : "scope-tab"}
                onClick={() => setScopeLevel(level)}
              >
                {level}
              </button>
            ))}
          </div>
          <label>
            Scope item
            <select value={selectedScopeId} onChange={(event) => setSelectedScopeId(event.target.value)}>
              {scopeItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <p className="meta">Perspective: {scopeLevel}</p>
          <p className="meta">
            Scope readiness: {selectedScopeReadinessItem?.readinessScorePercent ?? 0}% (
            {selectedScopeReadinessItem?.readyHighPriorityFunctions ?? 0}/
            {selectedScopeReadinessItem?.totalHighPriorityFunctions ?? 0} high-priority ready)
          </p>
          <p className="meta">Functions in scope: {scopedFunctions.length}</p>
          <p className="meta">Epics: {seedProject.epics.length} | Features: {seedProject.features.length}</p>
          <p className="meta">Test cases: {testCases.length} | Runs logged: {runHistory.length}</p>
        </section>

        <section className="card">
          <h2>Release Panel</h2>
          <p>
            Ready for Commit
            <span className={readyBadgeClass(releaseState.readyForCommit)}>{releaseState.readyForCommit}</span>
          </p>
          <p className="meta">
            Release readiness score: {releaseState.readinessScorePercent}% ({releaseState.acceptedFunctions}/
            {releaseState.requiredFunctions})
          </p>
          <p className="meta">High-priority blocking: {releaseState.highPriorityBlocking}</p>
          <p className="meta">Optional pending: {releaseState.optionalPending}</p>
          <p className="meta">
            Scoped readiness: {scopedHighPriorityAcceptedCount}/{scopedHighPriorityCount} high-priority accepted
          </p>
          <p className="meta">Reason: {releaseState.readinessReason}</p>
          <label className="check">
            <input
              type="checkbox"
              checked={approvedForRelease}
              onChange={(event) => setApprovedForRelease(event.target.checked)}
            />
            Approve for Release
          </label>
          <button type="button" onClick={exportProofdeskState}>
            Export ProofDesk State
          </button>
          {exportMessage ? <p className="meta">{exportMessage}</p> : null}
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Function + Testcases</h2>

        <label>
          Select function
          <select value={selectedFunction?.id ?? ""} onChange={(event) => setSelectedFunctionId(event.target.value)}>
            {(scopedFunctions.length > 0 ? scopedFunctions : functions).map((func) => (
              <option key={func.id} value={func.id}>
                {func.name}
              </option>
            ))}
          </select>
        </label>

        {selectedFunction ? (
          <article className="function-row" key={selectedFunction.id}>
            <h3 className="row-title">{selectedFunction.name}</h3>
            <p className="meta">Feature: {featureById.get(selectedFunction.featureId)?.name ?? "Unknown"}</p>
            <p className="meta">Priority: {selectedFunction.priority}</p>
            <p className="meta">{selectedFunction.description}</p>
            {blockedByFunctions.length > 0 ? (
              <div className="dependency-box">
                <strong>Blocked by</strong>
                <ul>
                  {blockedByFunctions.map((func) => (
                    <li key={func.id}>{func.name}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="meta">Blocked by: none</p>
            )}

            <div className="status-flow">
              <div className={statusFlowStep(selectedFunction) >= 1 ? "status-node complete" : "status-node"}>
                DEV
              </div>
              <div className={statusFlowStep(selectedFunction) >= 2 ? "status-link complete" : "status-link"} />
              <div className={statusFlowStep(selectedFunction) >= 2 ? "status-node complete" : "status-node"}>
                TEST
              </div>
              <div className={statusFlowStep(selectedFunction) >= 3 ? "status-link complete" : "status-link"} />
              <div className={statusFlowStep(selectedFunction) >= 3 ? "status-node complete" : "status-node"}>
                ACCEPT
              </div>
            </div>

            <div className="row-grid">
              <label>
                Dev status
                <select
                  value={selectedFunction.devStatus}
                  onChange={(event) =>
                    updateFunction(selectedFunction.id, {
                      devStatus: event.target.value as DevStatus
                    })
                  }
                >
                  {DEV_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Test status
                <select
                  value={selectedFunction.testStatus}
                  onChange={(event) =>
                    updateFunction(selectedFunction.id, {
                      testStatus: event.target.value as TestStatus
                    })
                  }
                >
                  {TEST_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Acceptance status
                <select
                  value={selectedFunction.acceptanceStatus}
                  onChange={(event) =>
                    updateFunction(selectedFunction.id, {
                      acceptanceStatus: event.target.value as AcceptanceStatus
                    })
                  }
                >
                  {ACCEPTANCE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="row-actions">
              <button type="button" onClick={() => addTestCase(selectedFunction.id)}>
                Add Testcase
              </button>
            </div>

            <div className="list">
              {selectedFunctionTestCases.map((tc) => (
                <div className="testcase" key={tc.id}>
                  <div className="testcase-grid">
                    <label>
                      Name
                      <input
                        value={tc.name}
                        onChange={(event) => updateTestCase(tc.id, { name: event.target.value })}
                      />
                    </label>

                    <label>
                      Type
                      <select
                        value={tc.type}
                        onChange={(event) => updateTestCase(tc.id, { type: event.target.value as TestCase["type"] })}
                      >
                        {TEST_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Execution
                      <select
                        value={tc.executionType}
                        onChange={(event) =>
                          updateTestCase(tc.id, {
                            executionType: event.target.value as TestCase["executionType"]
                          })
                        }
                      >
                        {EXECUTION_TYPES.map((executionType) => (
                          <option key={executionType} value={executionType}>
                            {executionType}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label>
                    Expected outcome
                    <textarea
                      value={tc.expectedOutcome}
                      onChange={(event) => updateTestCase(tc.id, { expectedOutcome: event.target.value })}
                    />
                  </label>

                  {tc.executionType === "api" ? (
                    <div className="testcase-grid">
                      <label>
                        Method
                        <select
                          value={tc.apiConfig?.method ?? "GET"}
                          onChange={(event) =>
                            updateTestCase(tc.id, {
                              apiConfig: {
                                ...(tc.apiConfig ?? { method: "GET", url: "" }),
                                method: event.target.value as NonNullable<TestCase["apiConfig"]>["method"]
                              }
                            })
                          }
                        >
                          {HTTP_METHODS.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        URL
                        <input
                          value={tc.apiConfig?.url ?? ""}
                          onChange={(event) =>
                            updateTestCase(tc.id, {
                              apiConfig: {
                                ...(tc.apiConfig ?? { method: "GET", url: "" }),
                                url: event.target.value
                              }
                            })
                          }
                        />
                      </label>

                      <label>
                        Expected status
                        <input
                          type="number"
                          value={tc.apiConfig?.expectedStatus ?? 200}
                          onChange={(event) =>
                            updateTestCase(tc.id, {
                              apiConfig: {
                                ...(tc.apiConfig ?? { method: "GET", url: "" }),
                                expectedStatus: Number(event.target.value)
                              }
                            })
                          }
                        />
                      </label>

                      <label>
                        Body includes
                        <input
                          value={tc.apiConfig?.expectedBodyIncludes ?? ""}
                          onChange={(event) =>
                            updateTestCase(tc.id, {
                              apiConfig: {
                                ...(tc.apiConfig ?? { method: "GET", url: "" }),
                                expectedBodyIncludes: event.target.value
                              }
                            })
                          }
                        />
                      </label>
                    </div>
                  ) : null}

                  <div className="row-actions">
                    <button type="button" onClick={() => removeTestCase(tc.id)}>
                      Delete testcase
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ) : null}
      </section>

      <div className="grid" style={{ marginTop: 16 }}>
        <section className="card">
          <h2>API Test Runner</h2>
          <label>
            API testcase
            <select value={selectedApiTestCaseId} onChange={(event) => setSelectedApiTestCaseId(event.target.value)}>
              {selectedFunctionTestCases
                .filter((tc) => tc.executionType === "api")
                .map((tc) => (
                  <option key={tc.id} value={tc.id}>
                    {tc.name}
                  </option>
                ))}
            </select>
          </label>

          {selectedApiTestCase ? (
            <>
              <p className="meta">Method: {selectedApiTestCase.apiConfig?.method ?? "GET"}</p>
              <p className="meta">URL: {selectedApiTestCase.apiConfig?.url ?? "-"}</p>
              <button type="button" onClick={runSelectedApiTest} disabled={isRunningApi}>
                {isRunningApi ? "Running..." : "Run API Test"}
              </button>
              <pre className="output">{apiResultText || "No run output yet."}</pre>
            </>
          ) : (
            <p className="meta">No API testcase available for this function.</p>
          )}
        </section>

        <section className="card">
          <h2>Run History</h2>
          <div className="history">
            {runHistory.length === 0 ? <p className="meta">No test runs yet.</p> : null}
            {runHistory.slice(0, 12).map((run) => {
              const tc = testCases.find((item) => item.id === run.testCaseId);
              return (
                <div className="history-item" key={run.id}>
                  <strong>{tc?.name ?? run.testCaseId}</strong>
                  <p className="meta">
                    {run.executedAt} | {run.result}
                    {typeof run.statusCode === "number" ? ` | status=${run.statusCode}` : ""}
                  </p>
                  <p className="meta">{run.details}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
