export type DevStatus = "not_started" | "in_progress" | "built" | "partial" | "blocked";

export type TestStatus = "not_tested" | "ready_to_test" | "passed" | "failed";

export type AcceptanceStatus = "in_scope" | "under_review" | "accepted" | "rejected";

export type ReadyForCommit = "NOT_READY" | "ALMOST_READY" | "READY";

export type Priority = "high" | "medium" | "low";

export interface Epic {
  id: string;
  name: string;
  description: string;
  featureIds: string[];
}

export interface Feature {
  id: string;
  epicId: string;
  name: string;
  description: string;
  functionIds: string[];
}

export interface FunctionQualityFlags {
  needs_refactor?: boolean;
  needs_clarification?: boolean;
}

export interface FunctionItem {
  id: string;
  featureId: string;
  name: string;
  description: string;
  priority: Priority;
  devStatus: DevStatus;
  testStatus: TestStatus;
  acceptanceStatus: AcceptanceStatus;
  qualityFlags?: FunctionQualityFlags;
  notes?: string;
}

export interface TestCase {
  id: string;
  functionId: string;
  name: string;
  type: "smoke" | "happy_path" | "edge_case" | "negative_case";
  executionType: "api" | "ui";
  expectedOutcome: string;
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
  readinessReason: string;
}

export interface RuntimeState {
  approvedForRelease: boolean;
  functions: FunctionItem[];
}
