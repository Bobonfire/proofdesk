import type { ProjectSeed } from "./types";

export const seedProject: ProjectSeed = {
  epics: [
    {
      id: "epic_proofdesk_core",
      name: "ProofDesk Core",
      description: "Core acceptance cockpit capabilities.",
      featureIds: ["feature_function_validation"]
    }
  ],
  features: [
    {
      id: "feature_function_validation",
      epicId: "epic_proofdesk_core",
      name: "Function Validation Flow",
      description: "Track function status, tests and acceptance in one cockpit.",
      functionIds: ["function_manage_testcases", "function_release_readiness"]
    }
  ],
  functions: [
    {
      id: "function_manage_testcases",
      featureId: "feature_function_validation",
      name: "Manage function testcases",
      description: "Create and maintain testcases for function-level validation.",
      priority: "high",
      devStatus: "in_progress",
      testStatus: "ready_to_test",
      acceptanceStatus: "under_review",
      qualityFlags: {
        needs_refactor: false,
        needs_clarification: false
      },
      notes: "Baseline for testcase editing flow."
    },
    {
      id: "function_release_readiness",
      featureId: "feature_function_validation",
      name: "Compute release readiness",
      description: "Determine release eligibility from status and acceptance state.",
      priority: "high",
      devStatus: "not_started",
      testStatus: "not_tested",
      acceptanceStatus: "in_scope",
      qualityFlags: {
        needs_refactor: false,
        needs_clarification: false
      }
    }
  ],
  testCases: [
    {
      id: "tc_testcase_crud_happy",
      functionId: "function_manage_testcases",
      name: "Create testcase from UI",
      type: "happy_path",
      executionType: "api",
      expectedOutcome: "API test should pass and be logged in run history.",
      apiConfig: {
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/todos/1",
        expectedStatus: 200,
        expectedBodyIncludes: "\"id\": 1"
      }
    },
    {
      id: "tc_release_panel_negative",
      functionId: "function_release_readiness",
      name: "Block release when acceptance is missing",
      type: "negative_case",
      executionType: "api",
      expectedOutcome: "System must keep READY state blocked when acceptance is incomplete.",
      apiConfig: {
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/todos/2",
        expectedStatus: 200,
        expectedBodyIncludes: "\"id\": 2"
      }
    }
  ]
};
