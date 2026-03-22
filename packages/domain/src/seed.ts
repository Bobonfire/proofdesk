import epicsJson from "./seed/epics.json";
import featuresJson from "./seed/features.json";
import functionsJson from "./seed/functions.json";
import testCasesJson from "./seed/testcases.json";
import discoveryScaffoldJson from "./seed/discovery-scaffold.json";
import type {
  AcceptanceStatus,
  DevStatus,
  DiscoveryOrigin,
  DiscoveryPlanningStatus,
  DiscoveryScaffoldSeed,
  DiscoveryLifecyclePhase,
  Epic,
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

function mapEpics(raw: Array<Record<string, string>>): Epic[] {
  return raw.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    priority: toPriority(item.priority),
    notes: item.notes || undefined
  }));
}

function mapFeatures(raw: Array<Record<string, string>>): Feature[] {
  return raw.map((item) => ({
    id: item.id,
    epicId: item.epicId,
    name: item.name,
    description: item.description,
    priority: toPriority(item.priority),
    notes: item.notes || undefined
  }));
}

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

export const seedProject: ProjectSeed = {
  epics: mapEpics(epicsJson as Array<Record<string, string>>),
  features: mapFeatures(featuresJson as Array<Record<string, string>>),
  functions: mapFunctions(functionsJson as RawFunction[]),
  testCases: mapTestCases(testCasesJson as RawTestCase[])
};

function mapDiscoveryScaffold(raw: DiscoveryScaffoldSeed): DiscoveryScaffoldSeed {
  return {
    ...raw,
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

export const seedDiscoveryScaffold: DiscoveryScaffoldSeed = mapDiscoveryScaffold(
  discoveryScaffoldJson as DiscoveryScaffoldSeed
);

export function createInitialRuntimeState(): RuntimeState {
  return {
    approvedForRelease: false,
    functions: seedProject.functions.map((item) => ({ ...item, tags: [...(item.tags ?? [])] })),
    testCases: seedProject.testCases.map((item) => ({ ...item })),
    runHistory: []
  };
}
