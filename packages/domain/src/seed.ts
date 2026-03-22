import discoveryEpicsJson from "./seed/discovery/discovery-epics.json";
import discoveryFeaturesJson from "./seed/discovery/discovery-features.json";
import discoveryMetadataJson from "./seed/discovery/discovery-metadata.json";
import epicsJson from "./seed/execution/epics.json";
import featuresJson from "./seed/execution/features.json";
import functionsJson from "./seed/execution/functions.json";
import testCasesJson from "./seed/execution/testcases.json";
import type {
  AcceptanceStatus,
  CapabilityEpicNode,
  CapabilityFeatureNode,
  CapabilityGraph,
  CapabilityImplementationState,
  CapabilityLayer,
  DevStatus,
  DiscoveryLifecyclePhase,
  DiscoveryOrigin,
  DiscoveryPlanningStatus,
  DiscoveryScaffoldSeed,
  DiscoverySeed,
  Epic,
  ExecutionSeed,
  ExecutionType,
  Feature,
  FunctionItem,
  FunctionType,
  Priority,
  ProjectSeed,
  RuntimeState,
  TestCase,
  TestCaseResult,
  TestStatus,
  TestType
} from "./types";

type RawEpic = {
  id: string;
  name: string;
  description: string;
  priority: string;
  notes?: string;
};

type RawFeature = {
  id: string;
  epicId: string;
  name: string;
  description: string;
  priority: string;
  notes?: string;
};

type RawFunction = {
  id: string;
  epicId: string;
  featureId: string;
  name: string;
  shortDescription: string;
  longDescription?: string;
  functionType: string;
  devStatus: string;
  testStatus: string;
  acceptanceStatus: string;
  priority: string;
  owner?: string;
  tags?: string[];
  screenPath?: string;
  endpointConfig?: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    url: string;
    headers?: Record<string, string>;
  };
  expectedBehavior: string;
  knownRisks?: string;
  notes?: string;
};

type RawTestCase = {
  id: string;
  functionId: string;
  name: string;
  description: string;
  testType: string;
  executionType: string;
  lastResult?: string;
  lastRunAt?: string;
};

type DiscoveryScaffoldMetadata = Omit<DiscoveryScaffoldSeed, "discoveryEpics" | "discoveryFeatures">;

function toPriority(value: string): Priority {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }

  return "medium";
}

function toDevStatus(value: string): DevStatus {
  if (value === "needs_refactor") {
    return "blocked";
  }

  const allowed: DevStatus[] = ["not_started", "in_progress", "built", "partial", "blocked"];
  return allowed.includes(value as DevStatus) ? (value as DevStatus) : "not_started";
}

function toTestStatus(value: string): TestStatus {
  if (value === "blocked") {
    return "not_tested";
  }

  const allowed: TestStatus[] = ["not_tested", "ready_to_test", "passed", "failed"];
  return allowed.includes(value as TestStatus) ? (value as TestStatus) : "not_tested";
}

function toAcceptanceStatus(value: string): AcceptanceStatus {
  if (value === "needs_clarification") {
    return "under_review";
  }

  const allowed: AcceptanceStatus[] = ["in_scope", "under_review", "accepted", "rejected"];
  return allowed.includes(value as AcceptanceStatus) ? (value as AcceptanceStatus) : "in_scope";
}

function toFunctionType(value: string): FunctionType {
  const allowed: FunctionType[] = ["api", "ui", "integration", "data_check", "manual"];
  return allowed.includes(value as FunctionType) ? (value as FunctionType) : "manual";
}

function toTestType(value: string): TestType {
  const allowed: TestType[] = [
    "smoke",
    "happy_path",
    "edge_case",
    "negative_case",
    "regression",
    "exploratory",
    "manual_verification"
  ];
  return allowed.includes(value as TestType) ? (value as TestType) : "manual_verification";
}

function toExecutionType(value: string): ExecutionType {
  return value === "api" || value === "ui" ? value : "ui";
}

function toDiscoveryLifecyclePhase(value: string): DiscoveryLifecyclePhase {
  const allowed: DiscoveryLifecyclePhase[] = ["discovery", "shaping", "planned", "in_progress", "validating", "future"];
  return allowed.includes(value as DiscoveryLifecyclePhase) ? (value as DiscoveryLifecyclePhase) : "discovery";
}

function toDiscoveryPlanningStatus(value: string): DiscoveryPlanningStatus {
  const allowed: DiscoveryPlanningStatus[] = ["idea", "candidate", "selected", "scoped", "deferred"];
  return allowed.includes(value as DiscoveryPlanningStatus) ? (value as DiscoveryPlanningStatus) : "idea";
}

function toDiscoveryOrigin(value: string): DiscoveryOrigin {
  const allowed: DiscoveryOrigin[] = ["discovery", "planned", "derived"];
  return allowed.includes(value as DiscoveryOrigin) ? (value as DiscoveryOrigin) : "discovery";
}

function toTestCaseResult(value: string | undefined): TestCaseResult | undefined {
  if (value === "passed" || value === "failed" || value === "error") {
    return value;
  }

  return undefined;
}

function mapEpics(raw: RawEpic[]): Epic[] {
  return raw.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    priority: toPriority(item.priority),
    notes: item.notes || undefined
  }));
}

function mapFeatures(raw: RawFeature[]): Feature[] {
  return raw.map((item) => ({
    id: item.id,
    epicId: item.epicId,
    name: item.name,
    description: item.description,
    priority: toPriority(item.priority),
    notes: item.notes || undefined
  }));
}

function mapFunctions(raw: RawFunction[]): FunctionItem[] {
  return raw.map((item) => ({
    id: item.id,
    epicId: item.epicId,
    featureId: item.featureId,
    name: item.name,
    shortDescription: item.shortDescription,
    longDescription: item.longDescription || undefined,
    functionType: toFunctionType(item.functionType),
    devStatus: toDevStatus(item.devStatus),
    testStatus: toTestStatus(item.testStatus),
    acceptanceStatus: toAcceptanceStatus(item.acceptanceStatus),
    priority: toPriority(item.priority),
    owner: item.owner || undefined,
    tags: item.tags ?? [],
    screenPath: item.screenPath || undefined,
    endpointConfig: item.endpointConfig,
    expectedBehavior: item.expectedBehavior,
    knownRisks: item.knownRisks || undefined,
    notes: item.notes || undefined
  }));
}

function mapTestCases(raw: RawTestCase[]): TestCase[] {
  return raw.map((item) => ({
    id: item.id,
    functionId: item.functionId,
    name: item.name,
    description: item.description,
    testType: toTestType(item.testType),
    executionType: toExecutionType(item.executionType),
    lastResult: toTestCaseResult(item.lastResult),
    lastRunAt: item.lastRunAt || undefined
  }));
}

function mapDiscoveryMetadata(raw: DiscoveryScaffoldMetadata): DiscoveryScaffoldMetadata {
  return {
    seedType: "proofdesk.discovery.scaffold",
    seedVersion: raw.seedVersion,
    generatedOn: raw.generatedOn,
    product: raw.product,
    sourceOfTruth: Array.isArray(raw.sourceOfTruth) ? raw.sourceOfTruth : [],
    dependencies: raw.dependencies ?? [],
    futureNotes: raw.futureNotes ?? []
  };
}

function mapDiscoverySeed(raw: DiscoverySeed): DiscoverySeed {
  return {
    metadata: mapDiscoveryMetadata(raw.metadata),
    discoveryEpics: raw.discoveryEpics.map((item) => ({
      ...item,
      priority: toPriority(item.priority),
      lifecyclePhase: toDiscoveryLifecyclePhase(item.lifecyclePhase),
      planningStatus: toDiscoveryPlanningStatus(item.planningStatus)
    })),
    discoveryFeatures: raw.discoveryFeatures.map((item) => ({
      ...item,
      priority: toPriority(item.priority),
      lifecyclePhase: toDiscoveryLifecyclePhase(item.lifecyclePhase),
      planningStatus: toDiscoveryPlanningStatus(item.planningStatus),
      origin: toDiscoveryOrigin(item.origin),
      candidateFunctionHints: Array.isArray(item.candidateFunctionHints) ? item.candidateFunctionHints : []
    }))
  };
}

function normalizeNameKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ");
}

function resolveLayer(hasDiscovery: boolean, hasExecution: boolean): CapabilityLayer {
  if (hasDiscovery && hasExecution) {
    return "mixed";
  }

  return hasDiscovery ? "discovery" : "execution";
}

function isFunctionImplementationReady(item: FunctionItem): boolean {
  const built = item.devStatus === "built" || item.devStatus === "partial";
  return built && item.testStatus === "passed" && item.acceptanceStatus === "accepted";
}

function toFeatureImplementationState(
  discoveryFeature: CapabilityFeatureNode["discoveryFeature"],
  executionFeature: CapabilityFeatureNode["executionFeature"],
  functions: FunctionItem[]
): CapabilityImplementationState {
  if (functions.length === 0) {
    if (!executionFeature) {
      return discoveryFeature?.lifecyclePhase === "in_progress" || discoveryFeature?.lifecyclePhase === "validating"
        ? "in_progress"
        : "planned";
    }

    return "in_progress";
  }

  return functions.every(isFunctionImplementationReady) ? "implemented" : "in_progress";
}

function findExecutionEpicMatch(
  discoveryEpic: DiscoverySeed["discoveryEpics"][number],
  executionEpics: Epic[],
  usedExecutionEpicIds: Set<string>
): Epic | undefined {
  return executionEpics.find((item) => {
    if (usedExecutionEpicIds.has(item.id)) {
      return false;
    }

    if (item.id === discoveryEpic.id) {
      return true;
    }

    return normalizeNameKey(item.name) === normalizeNameKey(discoveryEpic.name);
  });
}

function findExecutionFeatureMatch(
  discoveryFeature: DiscoverySeed["discoveryFeatures"][number],
  executionFeatures: Feature[],
  usedExecutionFeatureIds: Set<string>,
  preferredEpicId?: string
): Feature | undefined {
  const directMatch = executionFeatures.find((item) => {
    if (usedExecutionFeatureIds.has(item.id)) {
      return false;
    }

    if (preferredEpicId && item.epicId !== preferredEpicId) {
      return false;
    }

    return item.id === discoveryFeature.id;
  });
  if (directMatch) {
    return directMatch;
  }

  return executionFeatures.find((item) => {
    if (usedExecutionFeatureIds.has(item.id)) {
      return false;
    }

    if (preferredEpicId && item.epicId !== preferredEpicId) {
      return false;
    }

    return normalizeNameKey(item.name) === normalizeNameKey(discoveryFeature.name);
  });
}

function buildCapabilityFeatureNode(input: {
  discoveryFeature?: DiscoverySeed["discoveryFeatures"][number];
  executionFeature?: Feature;
  functions: FunctionItem[];
}): CapabilityFeatureNode {
  const discoveryFeature = input.discoveryFeature ?? null;
  const executionFeature = input.executionFeature ?? null;

  return {
    id: discoveryFeature?.id ?? executionFeature?.id ?? "unknown_feature",
    name: discoveryFeature?.name ?? executionFeature?.name ?? "Unknown feature",
    description: discoveryFeature?.description ?? executionFeature?.description ?? "",
    layer: resolveLayer(Boolean(discoveryFeature), Boolean(executionFeature)),
    implementationState: toFeatureImplementationState(discoveryFeature, executionFeature, input.functions),
    discoveryFeature,
    executionFeature,
    functions: input.functions
  };
}

function buildCapabilityEpicNode(input: {
  discoveryEpic?: DiscoverySeed["discoveryEpics"][number];
  executionEpic?: Epic;
  features: CapabilityFeatureNode[];
}): CapabilityEpicNode {
  const discoveryEpic = input.discoveryEpic ?? null;
  const executionEpic = input.executionEpic ?? null;

  return {
    id: discoveryEpic?.id ?? executionEpic?.id ?? "unknown_epic",
    name: discoveryEpic?.name ?? executionEpic?.name ?? "Unknown epic",
    description: discoveryEpic?.description ?? executionEpic?.description ?? "",
    layer: resolveLayer(Boolean(discoveryEpic), Boolean(executionEpic)),
    discoveryEpic,
    executionEpic,
    features: input.features
  };
}

export function loadExecutionSeed(): ExecutionSeed {
  return {
    epics: mapEpics(epicsJson as RawEpic[]),
    features: mapFeatures(featuresJson as RawFeature[]),
    functions: mapFunctions(functionsJson as RawFunction[]),
    testCases: mapTestCases(testCasesJson as RawTestCase[])
  };
}

export function loadDiscoverySeed(): DiscoverySeed {
  return mapDiscoverySeed({
    metadata: discoveryMetadataJson as DiscoveryScaffoldMetadata,
    discoveryEpics: discoveryEpicsJson as DiscoverySeed["discoveryEpics"],
    discoveryFeatures: discoveryFeaturesJson as DiscoverySeed["discoveryFeatures"]
  });
}

export function buildDiscoveryScaffold(discoverySeed: DiscoverySeed = loadDiscoverySeed()): DiscoveryScaffoldSeed {
  return {
    ...discoverySeed.metadata,
    discoveryEpics: discoverySeed.discoveryEpics.map((item) => ({ ...item })),
    discoveryFeatures: discoverySeed.discoveryFeatures.map((item) => ({ ...item }))
  };
}

export function mergeDiscoveryAndExecutionGraph(
  discoverySeed: DiscoverySeed = loadDiscoverySeed(),
  executionSeed: ExecutionSeed = loadExecutionSeed()
): CapabilityGraph {
  const usedExecutionEpicIds = new Set<string>();
  const usedExecutionFeatureIds = new Set<string>();
  const executionFeaturesByEpicId = new Map<string, Feature[]>();

  for (const feature of executionSeed.features) {
    const list = executionFeaturesByEpicId.get(feature.epicId);
    if (list) {
      list.push(feature);
      continue;
    }

    executionFeaturesByEpicId.set(feature.epicId, [feature]);
  }

  const epics: CapabilityEpicNode[] = [];

  const sortedDiscoveryEpics = [...discoverySeed.discoveryEpics].sort((a, b) => a.order - b.order);
  const sortedDiscoveryFeatures = [...discoverySeed.discoveryFeatures].sort((a, b) => a.order - b.order);

  for (const discoveryEpic of sortedDiscoveryEpics) {
    const executionEpic = findExecutionEpicMatch(discoveryEpic, executionSeed.epics, usedExecutionEpicIds);
    if (executionEpic) {
      usedExecutionEpicIds.add(executionEpic.id);
    }

    const epicDiscoveryFeatures = sortedDiscoveryFeatures.filter((item) => item.epicId === discoveryEpic.id);
    const mergedFeatures: CapabilityFeatureNode[] = [];

    for (const discoveryFeature of epicDiscoveryFeatures) {
      const executionFeature = findExecutionFeatureMatch(
        discoveryFeature,
        executionSeed.features,
        usedExecutionFeatureIds,
        executionEpic?.id
      );
      if (executionFeature) {
        usedExecutionFeatureIds.add(executionFeature.id);
      }

      const functions = executionFeature
        ? executionSeed.functions.filter((item) => item.featureId === executionFeature.id)
        : [];

      mergedFeatures.push(
        buildCapabilityFeatureNode({
          discoveryFeature,
          executionFeature,
          functions
        })
      );
    }

    if (executionEpic) {
      const remainingExecutionFeatures = executionFeaturesByEpicId
        .get(executionEpic.id)
        ?.filter((item) => !usedExecutionFeatureIds.has(item.id));

      for (const executionFeature of remainingExecutionFeatures ?? []) {
        usedExecutionFeatureIds.add(executionFeature.id);
        mergedFeatures.push(
          buildCapabilityFeatureNode({
            executionFeature,
            functions: executionSeed.functions.filter((item) => item.featureId === executionFeature.id)
          })
        );
      }
    }

    epics.push(
      buildCapabilityEpicNode({
        discoveryEpic,
        executionEpic,
        features: mergedFeatures
      })
    );
  }

  const unmatchedExecutionEpics = executionSeed.epics.filter((item) => !usedExecutionEpicIds.has(item.id));
  for (const executionEpic of unmatchedExecutionEpics) {
    const executionFeatures = (executionFeaturesByEpicId.get(executionEpic.id) ?? []).filter(
      (item) => !usedExecutionFeatureIds.has(item.id)
    );

    for (const feature of executionFeatures) {
      usedExecutionFeatureIds.add(feature.id);
    }

    epics.push(
      buildCapabilityEpicNode({
        executionEpic,
        features: executionFeatures.map((executionFeature) =>
          buildCapabilityFeatureNode({
            executionFeature,
            functions: executionSeed.functions.filter((item) => item.featureId === executionFeature.id)
          })
        )
      })
    );
  }

  return { epics };
}

export function buildSeedProject(executionSeed: ExecutionSeed = loadExecutionSeed()): ProjectSeed {
  return {
    epics: executionSeed.epics.map((item) => ({ ...item })),
    features: executionSeed.features.map((item) => ({ ...item })),
    functions: executionSeed.functions.map((item) => ({ ...item, tags: [...(item.tags ?? [])] })),
    testCases: executionSeed.testCases.map((item) => ({ ...item }))
  };
}

export function loadSeedProject(): ProjectSeed {
  return buildSeedProject(loadExecutionSeed());
}

export const seedDiscovery = loadDiscoverySeed();
export const seedExecution = loadExecutionSeed();
export const seedProject = buildSeedProject(seedExecution);
export const seedDiscoveryScaffold: DiscoveryScaffoldSeed = buildDiscoveryScaffold(seedDiscovery);
export const seedCapabilityGraph = mergeDiscoveryAndExecutionGraph(seedDiscovery, seedExecution);

export function createInitialRuntimeState(): RuntimeState {
  return {
    approvedForRelease: false,
    functions: seedExecution.functions.map((item) => ({ ...item, tags: [...(item.tags ?? [])] })),
    testCases: seedExecution.testCases.map((item) => ({ ...item })),
    runHistory: []
  };
}
