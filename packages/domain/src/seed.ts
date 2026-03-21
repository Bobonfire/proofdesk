import type { ProjectSeed } from "./types";

export const seedProject: ProjectSeed = {
  epics: [
    {
      id: "epic_activities",
      name: "Activities",
      description: "Ride data ingestion and inspection.",
      featureIds: ["feature_import"]
    }
  ],
  features: [
    {
      id: "feature_import",
      epicId: "epic_activities",
      name: "Import Flow",
      description: "Allow users to import and verify activities.",
      functionIds: ["function_import_file", "function_deduplicate"]
    }
  ],
  functions: [
    {
      id: "function_import_file",
      featureId: "feature_import",
      name: "Import activity file",
      description: "Ingest a FIT file and create an activity record.",
      priority: "high",
      devStatus: "in_progress",
      testStatus: "ready_to_test",
      acceptanceStatus: "under_review",
      qualityFlags: {
        needs_refactor: false,
        needs_clarification: false
      },
      notes: "Baseline for v1 test flow."
    },
    {
      id: "function_deduplicate",
      featureId: "feature_import",
      name: "Prevent duplicate activity import",
      description: "Reject duplicate import by external id.",
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
      id: "tc_import_happy",
      functionId: "function_import_file",
      name: "Import valid FIT file",
      type: "happy_path",
      executionType: "api",
      expectedOutcome: "API should return a successful response for baseline connectivity.",
      apiConfig: {
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/todos/1",
        expectedStatus: 200,
        expectedBodyIncludes: "\"id\": 1"
      }
    },
    {
      id: "tc_dedup_negative",
      functionId: "function_deduplicate",
      name: "Reject duplicate external id",
      type: "negative_case",
      executionType: "api",
      expectedOutcome: "API should return a successful response for baseline connectivity.",
      apiConfig: {
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/todos/2",
        expectedStatus: 200,
        expectedBodyIncludes: "\"id\": 2"
      }
    }
  ]
};
