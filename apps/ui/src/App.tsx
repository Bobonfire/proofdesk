import { useMemo, useState } from "react";
import {
  seedProject,
  type AcceptanceStatus,
  type DevStatus,
  type FunctionItem,
  type TestStatus
} from "@proofdesk/domain";
import { computeReleaseState } from "@proofdesk/release";
import { loadRuntimeState, saveRuntimeState } from "@proofdesk/storage";

function readyBadgeClass(state: "NOT_READY" | "ALMOST_READY" | "READY"): string {
  if (state === "READY") {
    return "badge badge-ready";
  }

  if (state === "ALMOST_READY") {
    return "badge badge-almost";
  }

  return "badge badge-not";
}

const DEV_STATUSES: DevStatus[] = ["not_started", "in_progress", "built", "partial", "blocked"];
const TEST_STATUSES: TestStatus[] = ["not_tested", "ready_to_test", "passed", "failed"];
const ACCEPTANCE_STATUSES: AcceptanceStatus[] = ["in_scope", "under_review", "accepted", "rejected"];

export default function App() {
  const stored = loadRuntimeState();
  const [functions, setFunctions] = useState<FunctionItem[]>(stored?.functions ?? seedProject.functions);
  const [approvedForRelease, setApprovedForRelease] = useState<boolean>(stored?.approvedForRelease ?? false);

  const releaseState = useMemo(
    () => computeReleaseState(functions, approvedForRelease),
    [functions, approvedForRelease]
  );

  const featureById = useMemo(() => {
    const map = new Map(seedProject.features.map((feature) => [feature.id, feature]));
    return map;
  }, []);

  function updateFunction(functionId: string, update: Partial<FunctionItem>) {
    const nextFunctions = functions.map((func) => {
      if (func.id !== functionId) {
        return func;
      }

      return {
        ...func,
        ...update
      };
    });

    setFunctions(nextFunctions);
    saveRuntimeState({
      approvedForRelease,
      functions: nextFunctions
    });
  }

  function updateApproval(nextApproval: boolean) {
    setApprovedForRelease(nextApproval);
    saveRuntimeState({
      approvedForRelease: nextApproval,
      functions
    });
  }

  return (
    <div className="app">
      <header className="header">
        <h1>ProofDesk v1</h1>
        <p>Local-first acceptance cockpit for function-level release readiness.</p>
      </header>

      <div className="grid">
        <section className="card">
          <h2>Overview</h2>
          <p className="meta">Epics: {seedProject.epics.length}</p>
          <p className="meta">Features: {seedProject.features.length}</p>
          <p className="meta">Functions: {functions.length}</p>
          <p className="meta">Test cases: {seedProject.testCases.length}</p>
        </section>

        <section className="card">
          <h2>Release Panel</h2>
          <p>
            Ready for Commit
            <span className={readyBadgeClass(releaseState.readyForCommit)}>{releaseState.readyForCommit}</span>
          </p>
          <p className="meta">Required functions: {releaseState.requiredFunctions}</p>
          <p className="meta">Accepted functions: {releaseState.acceptedFunctions}</p>
          <p className="meta">Blocking functions: {releaseState.blockingFunctions}</p>
          <p className="meta">Reason: {releaseState.readinessReason}</p>
          <label>
            <input
              type="checkbox"
              checked={approvedForRelease}
              onChange={(event) => updateApproval(event.target.checked)}
            />
            Approve for Release
          </label>
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Function Detail</h2>
        <div className="list">
          {functions.map((func) => {
            const feature = featureById.get(func.featureId);
            return (
              <article className="function-row" key={func.id}>
                <h3 className="row-title">{func.name}</h3>
                <p className="meta">Feature: {feature?.name ?? "Unknown"}</p>
                <p className="meta">Priority: {func.priority}</p>
                <p className="meta">{func.description}</p>

                <div className="row-grid">
                  <label>
                    Dev status
                    <select
                      value={func.devStatus}
                      onChange={(event) =>
                        updateFunction(func.id, {
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
                      value={func.testStatus}
                      onChange={(event) =>
                        updateFunction(func.id, {
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
                      value={func.acceptanceStatus}
                      onChange={(event) =>
                        updateFunction(func.id, {
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
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
