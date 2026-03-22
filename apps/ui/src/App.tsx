import { useEffect, useMemo, useState } from "react";
import {
  mergeDiscoveryAndExecutionGraph,
  seedDiscovery,
  seedExecution,
  type AcceptanceStatus,
  type FunctionItem,
  type RuntimeState
} from "@proofdesk/domain";
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

function textMatchesQuery(text: string | undefined, query: string): boolean {
  if (!query) {
    return true;
  }

  return (text ?? "").toLowerCase().includes(query);
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

  const executionEpicById = useMemo(() => new Map(seedExecution.epics.map((item) => [item.id, item])), []);
  const executionFeatureById = useMemo(() => new Map(seedExecution.features.map((item) => [item.id, item])), []);
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredFunctions = useMemo(() => {
    return runtimeState.functions.filter((item) => {
      const feature = executionFeatureById.get(item.featureId);
      const epic = executionEpicById.get(item.epicId);
      const matchesSearch = includesSearch(item, searchQuery, epic?.name ?? "", feature?.name ?? "");
      const matchesAcceptance = acceptanceFilter === "all" || item.acceptanceStatus === acceptanceFilter;
      return matchesSearch && matchesAcceptance;
    });
  }, [acceptanceFilter, executionEpicById, executionFeatureById, runtimeState.functions, searchQuery]);

  const visibleFunctionIds = useMemo(() => new Set(filteredFunctions.map((item) => item.id)), [filteredFunctions]);
  const runtimeFunctionsByFeatureId = useMemo(() => {
    const map = new Map<string, FunctionItem[]>();
    for (const item of runtimeState.functions) {
      const current = map.get(item.featureId);
      if (current) {
        current.push(item);
        continue;
      }

      map.set(item.featureId, [item]);
    }
    return map;
  }, [runtimeState.functions]);

  const capabilityGraph = useMemo(() => {
    return mergeDiscoveryAndExecutionGraph(seedDiscovery, {
      ...seedExecution,
      functions: runtimeState.functions,
      testCases: runtimeState.testCases
    });
  }, [runtimeState.functions, runtimeState.testCases]);

  const treeNodes = useMemo<CapabilityTreeNode[]>(() => {
    return capabilityGraph.epics
      .map((epicNode) => {
        const features = epicNode.features
          .map((featureNode) => {
            const runtimeFunctions = featureNode.executionFeature
              ? runtimeFunctionsByFeatureId.get(featureNode.executionFeature.id) ?? []
              : [];

            const functions = runtimeFunctions.filter((functionItem) => visibleFunctionIds.has(functionItem.id));
            const matchesText =
              textMatchesQuery(epicNode.name, normalizedQuery) ||
              textMatchesQuery(epicNode.description, normalizedQuery) ||
              textMatchesQuery(featureNode.name, normalizedQuery) ||
              textMatchesQuery(featureNode.description, normalizedQuery) ||
              textMatchesQuery(featureNode.discoveryFeature?.whyItMatters, normalizedQuery);

            const shouldShowFeature =
              functions.length > 0 ||
              featureNode.layer !== "execution" ||
              runtimeFunctions.length === 0 ||
              matchesText;

            if (!shouldShowFeature) {
              return null;
            }

            return {
              ...featureNode,
              functions
            };
          })
          .filter((featureNode): featureNode is NonNullable<typeof featureNode> => featureNode !== null);

        const epicMatchesText = textMatchesQuery(epicNode.name, normalizedQuery) || textMatchesQuery(epicNode.description, normalizedQuery);
        if (features.length === 0 && !epicMatchesText) {
          return null;
        }

        return {
          ...epicNode,
          features
        };
      })
      .filter((node): node is CapabilityTreeNode => node !== null);
  }, [capabilityGraph, normalizedQuery, runtimeFunctionsByFeatureId, visibleFunctionIds]);

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
  const selectedFeature = selectedFunction ? executionFeatureById.get(selectedFunction.featureId) ?? null : null;
  const selectedEpic = selectedFunction ? executionEpicById.get(selectedFunction.epicId) ?? null : null;
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
