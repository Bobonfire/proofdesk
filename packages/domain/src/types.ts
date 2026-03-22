export type DevStatus = "not_started" | "in_progress" | "built" | "partial" | "blocked";

export type TestStatus = "not_tested" | "ready_to_test" | "passed" | "failed";

export type AcceptanceStatus = "in_scope" | "under_review" | "accepted" | "rejected";

export type ReadyForCommit = "NOT_READY" | "ALMOST_READY" | "READY";
export type ScopeLevel = "Function" | "Feature" | "Epic" | "Product";
export type Priority = "high" | "medium" | "low";
export type FunctionType = "api" | "ui" | "integration" | "data_check" | "manual";
export type TestType =
  | "smoke"
  | "happy_path"
  | "edge_case"
  | "negative_case"
  | "regression"
  | "exploratory"
  | "manual_verification";
export type ExecutionType = "api" | "ui";
export type TestCaseResult = "passed" | "failed" | "error";
export type DiscoveryLifecyclePhase = "discovery" | "shaping" | "planned" | "in_progress" | "validating" | "future";
export type DiscoveryPlanningStatus = "idea" | "candidate" | "selected" | "scoped" | "deferred";
export type DiscoveryOrigin = "discovery" | "planned" | "derived";

export interface Epic {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  notes?: string;
}

export interface Feature {
  id: string;
  epicId: string;
  name: string;
  description: string;
  priority: Priority;
  notes?: string;
}

export interface EndpointConfig {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  headers?: Record<string, string>;
}

export interface FunctionItem {
  id: string;
  epicId: string;
  featureId: string;
  name: string;
  shortDescription: string;
  longDescription?: string;
  functionType: FunctionType;
  devStatus: DevStatus;
  testStatus: TestStatus;
  acceptanceStatus: AcceptanceStatus;
  priority: Priority;
  owner?: string;
  tags?: string[];
  screenPath?: string;
  endpointConfig?: EndpointConfig;
  expectedBehavior: string;
  knownRisks?: string;
  notes?: string;
}

export interface TestCase {
  id: string;
  functionId: string;
  name: string;
  description: string;
  testType: TestType;
  executionType: ExecutionType;
  lastResult?: TestCaseResult;
  lastRunAt?: string;
}

export interface ProjectSeed {
  epics: Epic[];
  features: Feature[];
  functions: FunctionItem[];
  testCases: TestCase[];
}

export interface ReleaseState {
  readyForCommit: ReadyForCommit;
  totalFunctions: number;
  requiredFunctions: number;
  acceptedFunctions: number;
  blockingFunctions: number;
  highPriorityBlocking: number;
  optionalPending: number;
  readinessScorePercent: number;
  readinessReason: string;
}

export interface ScopeReadinessItem {
  scopeLevel: ScopeLevel;
  scopeId: string;
  scopeName: string;
  totalHighPriorityFunctions: number;
  readyHighPriorityFunctions: number;
  blockingHighPriorityFunctions: number;
  readinessScorePercent: number;
  ready: boolean;
}

export interface ScopeReadiness {
  function: ScopeReadinessItem[];
  feature: ScopeReadinessItem[];
  epic: ScopeReadinessItem[];
  product: ScopeReadinessItem;
}

export interface RuntimeState {
  approvedForRelease: boolean;
  functions: FunctionItem[];
  testCases: TestCase[];
  runHistory: TestRunRecord[];
}

export interface TestRunRecord {
  id: string;
  testCaseId: string;
  functionId: string;
  executedAt: string;
  result: TestCaseResult;
  statusCode?: number;
  details: string;
}

export interface DiscoveryEpic {
  id: string;
  name: string;
  description: string;
  productGoal: string;
  userValue: string;
  priority: Priority;
  lifecyclePhase: DiscoveryLifecyclePhase;
  planningStatus: DiscoveryPlanningStatus;
  notes?: string;
  order: number;
}

export interface DiscoveryFeature {
  id: string;
  epicId: string;
  name: string;
  description: string;
  userOutcome: string;
  whyItMatters: string;
  priority: Priority;
  lifecyclePhase: DiscoveryLifecyclePhase;
  planningStatus: DiscoveryPlanningStatus;
  origin: DiscoveryOrigin;
  candidateFunctionHints: string[];
  notes?: string;
  order: number;
}

export interface DiscoveryDependency {
  fromFeatureId: string;
  toFeatureId: string;
  reason: string;
}

export interface DiscoveryScaffoldSeed {
  seedType: "proofdesk.discovery.scaffold";
  seedVersion: string;
  generatedOn: string;
  product: {
    id: string;
    name: string;
    horizon: string;
    intent: string;
  };
  sourceOfTruth: string[];
  discoveryEpics: DiscoveryEpic[];
  discoveryFeatures: DiscoveryFeature[];
  dependencies?: DiscoveryDependency[];
  futureNotes?: string[];
}
