import { describe, expect, it } from "vitest";
import {
  loadDiscoverySeed,
  loadExecutionSeed,
  mergeDiscoveryAndExecutionGraph,
  type DiscoverySeed,
  type ExecutionSeed
} from "@proofdesk/domain";
import { computeReleaseState } from "@proofdesk/release";

describe("domain seed pipeline", () => {
  it("loads discovery seed from discovery folder", () => {
    const discovery = loadDiscoverySeed();

    expect(discovery.discoveryEpics.length).toBeGreaterThan(0);
    expect(discovery.discoveryFeatures.length).toBeGreaterThan(0);
  });

  it("loads execution seed from execution folder", () => {
    const execution = loadExecutionSeed();

    expect(execution.epics.length).toBeGreaterThan(0);
    expect(execution.features.length).toBeGreaterThan(0);
    expect(execution.functions.length).toBeGreaterThan(0);
    expect(execution.testCases.length).toBeGreaterThan(0);
  });

  it("builds a merged graph that includes discovery and execution layers", () => {
    const graph = mergeDiscoveryAndExecutionGraph(loadDiscoverySeed(), loadExecutionSeed());

    expect(graph.epics.length).toBeGreaterThan(0);
    expect(graph.epics.some((epic) => epic.discoveryEpic !== null)).toBe(true);
    expect(graph.epics.some((epic) => epic.executionEpic !== null)).toBe(true);
    expect(graph.epics.some((epic) => epic.features.some((feature) => feature.layer === "discovery"))).toBe(true);
    expect(graph.epics.some((epic) => epic.features.some((feature) => feature.functions.length > 0))).toBe(true);
  });

  it("links discovery and execution features when names align", () => {
    const discovery: DiscoverySeed = {
      metadata: {
        seedType: "proofdesk.discovery.scaffold",
        seedVersion: "1.0.0",
        generatedOn: "2026-03-22",
        product: {
          id: "proofdesk",
          name: "ProofDesk",
          horizon: "v1",
          intent: "test"
        },
        sourceOfTruth: [],
        dependencies: [],
        futureNotes: []
      },
      discoveryEpics: [
        {
          id: "discovery_epic_a",
          name: "Shared Epic",
          description: "Discovery epic",
          productGoal: "goal",
          userValue: "value",
          priority: "high",
          lifecyclePhase: "in_progress",
          planningStatus: "selected",
          order: 1
        }
      ],
      discoveryFeatures: [
        {
          id: "discovery_feature_a",
          epicId: "discovery_epic_a",
          name: "Shared Feature",
          description: "Discovery feature",
          userOutcome: "outcome",
          whyItMatters: "matters",
          priority: "high",
          lifecyclePhase: "in_progress",
          planningStatus: "scoped",
          origin: "planned",
          candidateFunctionHints: [],
          order: 1
        }
      ]
    };

    const execution: ExecutionSeed = {
      epics: [
        {
          id: "execution_epic_a",
          name: "Shared Epic",
          description: "Execution epic",
          priority: "high"
        }
      ],
      features: [
        {
          id: "execution_feature_a",
          epicId: "execution_epic_a",
          name: "Shared Feature",
          description: "Execution feature",
          priority: "high"
        }
      ],
      functions: [
        {
          id: "function_a",
          epicId: "execution_epic_a",
          featureId: "execution_feature_a",
          name: "Function A",
          shortDescription: "Function A",
          functionType: "ui",
          devStatus: "built",
          testStatus: "passed",
          acceptanceStatus: "accepted",
          priority: "high",
          expectedBehavior: "Works"
        }
      ],
      testCases: []
    };

    const graph = mergeDiscoveryAndExecutionGraph(discovery, execution);

    expect(graph.epics).toHaveLength(1);
    expect(graph.epics[0].layer).toBe("mixed");
    expect(graph.epics[0].features).toHaveLength(1);
    expect(graph.epics[0].features[0].layer).toBe("mixed");
    expect(graph.epics[0].features[0].implementationState).toBe("implemented");
    expect(graph.epics[0].features[0].functions).toHaveLength(1);
  });

  it("keeps release state computation execution-only", () => {
    const execution = loadExecutionSeed();
    const discovery = loadDiscoverySeed();
    const before = computeReleaseState(execution.functions, false);

    mergeDiscoveryAndExecutionGraph(discovery, execution);
    const after = computeReleaseState(execution.functions, false);

    expect(after).toEqual(before);
  });
});
