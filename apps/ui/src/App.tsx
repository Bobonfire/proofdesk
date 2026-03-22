import { useEffect, useMemo, useState } from "react";
import { seedProject, type AcceptanceStatus, type FunctionItem, type RuntimeState } from "@proofdesk/domain";
import { computeReleaseState } from "@proofdesk/release";
import { loadRuntimeState, persistProofdeskContract, saveRuntimeState, type ProofdeskDirectoryHandle } from "@proofdesk/storage";
import { CapabilityTree, type CapabilityTreeNode } from "./components/CapabilityTree";
import { FunctionDetailPanel } from "./components/FunctionDetailPanel";

type AcceptanceFilter = "all" | AcceptanceStatus;

const ACCEPTANCE_FILTERS: Array<{ value: AcceptanceFilter; label: string }> = [
  { value: "all", label: "All acceptance states" },
  { value: "accepted", label: "Accepted" },
  { value: "under_review", label: "Under review" },
  { value: "in_scope", label: "In scope" },
  { value: "rejected", label: "Rejected" }
];

function includesSearch(functionItem: FunctionItem, query: string, epicName: string, featureName: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const haystack = [
    functionItem.name,
    functionItem.shortDescription,
    functionItem.longDescription,
    functionItem.expectedBehavior,
    functionItem.knownRisks,
    epicName,
    featureName,
    ...(functionItem.tags ?? [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

function metricValue(functions: FunctionItem[], mode: "ready_to_test" | "passed" | "failed" | "accepted"): number {
  if (mode === "accepted") {
    return functions.filter((item) => item.acceptanceStatus === "accepted").length;
  }

  return functions.filter((item) => item.testStatus === mode).length;
}

export default function App() {
  const [runtimeState] = useState<RuntimeState>(() => loadRuntimeState());
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [acceptanceFilter, setAcceptanceFilter] = useState<AcceptanceFilter>("all");
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>(runtimeState.functions[0]?.id ?? "");
  const [isWritingContract, setIsWritingContract] = useState<boolean>(false);
  const [writeContractMessage, setWriteContractMessage] = useState<string>("");

  useEffect(() => {
    saveRuntimeState(runtimeState);
  }, [runtimeState]);

  const releaseState = useMemo(
    () => computeReleaseState(runtimeState.functions, runtimeState.approvedForRelease),
    [runtimeState.approvedForRelease, runtimeState.functions]
  );

  const epicById = useMemo(() => new Map(seedProject.epics.map((item) => [item.id, item])), []);
  const featureById = useMemo(() => new Map(seedProject.features.map((item) => [item.id, item])), []);

  const filteredFunctions = useMemo(() => {
    return runtimeState.functions.filter((item) => {
      const feature = featureById.get(item.featureId);
      const epic = epicById.get(item.epicId);
      const matchesSearch = includesSearch(item, searchQuery, epic?.name ?? "", feature?.name ?? "");
      const matchesAcceptance = acceptanceFilter === "all" || item.acceptanceStatus === acceptanceFilter;
      return matchesSearch && matchesAcceptance;
    });
  }, [acceptanceFilter, epicById, featureById, runtimeState.functions, searchQuery]);

  const visibleFunctionIds = useMemo(() => new Set(filteredFunctions.map((item) => item.id)), [filteredFunctions]);

  const treeNodes = useMemo<CapabilityTreeNode[]>(() => {
    return seedProject.epics
      .map((epic) => {
        const features = seedProject.features
          .filter((feature) => feature.epicId === epic.id)
          .map((feature) => {
            const functions = runtimeState.functions.filter(
              (functionItem) => functionItem.featureId === feature.id && visibleFunctionIds.has(functionItem.id)
            );

            return {
              feature,
              functions
            };
          })
          .filter((item) => item.functions.length > 0);

        return { epic, features };
      })
      .filter((item) => item.features.length > 0);
  }, [runtimeState.functions, visibleFunctionIds]);

  const flattenedVisibleFunctions = useMemo(
    () => treeNodes.flatMap((node) => node.features.flatMap((featureNode) => featureNode.functions)),
    [treeNodes]
  );

  useEffect(() => {
    if (flattenedVisibleFunctions.length === 0) {
      setSelectedFunctionId("");
      return;
    }

    const stillVisible = flattenedVisibleFunctions.some((item) => item.id === selectedFunctionId);
    if (!stillVisible) {
      setSelectedFunctionId(flattenedVisibleFunctions[0].id);
    }
  }, [flattenedVisibleFunctions, selectedFunctionId]);

  const selectedFunction = useMemo(
    () => runtimeState.functions.find((item) => item.id === selectedFunctionId) ?? null,
    [runtimeState.functions, selectedFunctionId]
  );
  const selectedFeature = selectedFunction ? featureById.get(selectedFunction.featureId) ?? null : null;
  const selectedEpic = selectedFunction ? epicById.get(selectedFunction.epicId) ?? null : null;
  const selectedTestCases = useMemo(
    () => runtimeState.testCases.filter((item) => item.functionId === selectedFunction?.id),
    [runtimeState.testCases, selectedFunction?.id]
  );

  async function handleWriteContractFiles(): Promise<void> {
    type DirectoryPickerWindow = Window & {
      showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<ProofdeskDirectoryHandle>;
    };

    const directoryPicker = (window as DirectoryPickerWindow).showDirectoryPicker;
    if (!directoryPicker) {
      setWriteContractMessage("Directory writing is not supported in this browser.");
      return;
    }

    setIsWritingContract(true);
    setWriteContractMessage("Writing ProofDesk files...");

    try {
      const repositoryHandle = await directoryPicker({ mode: "readwrite" });
      const result = await persistProofdeskContract({
        repositoryHandle,
        runtimeState,
        releaseState,
        actor: "user",
        summary: "State export triggered from ProofDesk UI."
      });

      setWriteContractMessage(
        `Wrote ${result.snapshotFile}, ${result.eventFile}, and ${result.updateFile} under ${result.rootPath}/.`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setWriteContractMessage(`Write failed: ${message}`);
    } finally {
      setIsWritingContract(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>ProofDesk Capability Map</h1>
        <p>
          Living function map for epic, feature, and function scope visibility with acceptance-first status tracking.
        </p>
        <div className="header-actions">
          <button type="button" onClick={() => void handleWriteContractFiles()} disabled={isWritingContract}>
            {isWritingContract ? "Writing..." : "Write ProofDesk Contract Files"}
          </button>
          {writeContractMessage ? <p className="header-message">{writeContractMessage}</p> : null}
        </div>
      </header>

      <section className="summary-bar" aria-label="Capability summary">
        <article>
          <span>Total functions</span>
          <strong>{runtimeState.functions.length}</strong>
        </article>
        <article>
          <span>Ready to test</span>
          <strong>{metricValue(runtimeState.functions, "ready_to_test")}</strong>
        </article>
        <article>
          <span>Passed</span>
          <strong>{metricValue(runtimeState.functions, "passed")}</strong>
        </article>
        <article>
          <span>Failed</span>
          <strong>{metricValue(runtimeState.functions, "failed")}</strong>
        </article>
        <article>
          <span>Accepted</span>
          <strong>{metricValue(runtimeState.functions, "accepted")}</strong>
        </article>
      </section>

      <main className="split-layout">
        <aside className="left-panel">
          <div className="panel-header">
            <h2>Capability hierarchy</h2>
            <p>Epic → Feature → Function</p>
          </div>

          <div className="filters">
            <label>
              Search
              <input
                aria-label="Search functions"
                placeholder="Search by function, tag, feature, or epic"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
            <label>
              Acceptance filter
              <select
                aria-label="Filter by acceptance status"
                value={acceptanceFilter}
                onChange={(event) => setAcceptanceFilter(event.target.value as AcceptanceFilter)}
              >
                {ACCEPTANCE_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <CapabilityTree
            nodes={treeNodes}
            selectedFunctionId={selectedFunctionId}
            onSelectFunction={(functionId) => setSelectedFunctionId(functionId)}
          />
        </aside>

        <FunctionDetailPanel
          functionItem={selectedFunction}
          epic={selectedEpic}
          feature={selectedFeature}
          testCases={selectedTestCases}
        />
      </main>
    </div>
  );
}
