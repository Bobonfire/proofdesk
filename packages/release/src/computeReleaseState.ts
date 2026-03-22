import type { Epic, Feature, FunctionItem, ReleaseState, ScopeReadiness, ScopeReadinessItem } from "@proofdesk/domain";

function toPercent(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 100;
  }

  return Math.round((numerator / denominator) * 100);
}

function isFunctionLifecycleReady(func: FunctionItem): boolean {
  const isBuilt = func.devStatus === "built" || func.devStatus === "partial";
  const isTested = func.testStatus === "passed";
  const isAccepted = func.acceptanceStatus === "accepted";

  return isBuilt && isTested && isAccepted;
}

export function isHighPriorityFunctionReady(func: FunctionItem): boolean {
  if (func.priority !== "high") {
    return false;
  }

  return isFunctionLifecycleReady(func);
}

function buildScopeItem(
  scopeLevel: ScopeReadinessItem["scopeLevel"],
  scopeId: string,
  scopeName: string,
  scopedFunctions: FunctionItem[]
): ScopeReadinessItem {
  const highPriorityFunctions = scopedFunctions.filter((func) => func.priority === "high");
  const readyHighPriorityFunctions = highPriorityFunctions.filter(isHighPriorityFunctionReady).length;
  const totalHighPriorityFunctions = highPriorityFunctions.length;
  const blockingHighPriorityFunctions = totalHighPriorityFunctions - readyHighPriorityFunctions;

  return {
    scopeLevel,
    scopeId,
    scopeName,
    totalHighPriorityFunctions,
    readyHighPriorityFunctions,
    blockingHighPriorityFunctions,
    readinessScorePercent: toPercent(readyHighPriorityFunctions, totalHighPriorityFunctions),
    ready: blockingHighPriorityFunctions === 0
  };
}

export function computeScopeReadiness(functions: FunctionItem[], features: Feature[], epics: Epic[]): ScopeReadiness {
  const functionItems = functions.map((func) => {
    if (func.priority !== "high") {
      return {
        scopeLevel: "Function" as const,
        scopeId: func.id,
        scopeName: func.name,
        totalHighPriorityFunctions: 0,
        readyHighPriorityFunctions: 0,
        blockingHighPriorityFunctions: 0,
        readinessScorePercent: 100,
        ready: isFunctionLifecycleReady(func)
      };
    }

    return buildScopeItem("Function", func.id, func.name, [func]);
  });

  const featureItems = features.map((feature) => {
    const scopedFunctions = functions.filter((func) => func.featureId === feature.id);
    return buildScopeItem("Feature", feature.id, feature.name, scopedFunctions);
  });

  const epicItems = epics.map((epic) => {
    const featureIds = new Set(features.filter((feature) => feature.epicId === epic.id).map((feature) => feature.id));
    const scopedFunctions = functions.filter((func) => featureIds.has(func.featureId));

    return buildScopeItem("Epic", epic.id, epic.name, scopedFunctions);
  });

  const productItem = buildScopeItem("Product", "product", "Product", functions);

  return {
    function: functionItems,
    feature: featureItems,
    epic: epicItems,
    product: productItem
  };
}

export function computeReleaseState(functions: FunctionItem[], approvedForRelease: boolean): ReleaseState {
  const required = functions.filter((func) => func.priority === "high");
  const accepted = required.filter(isHighPriorityFunctionReady);
  const highPriorityBlocking = required.length - accepted.length;
  const optionalPending = functions.filter((func) => func.priority !== "high" && !isFunctionLifecycleReady(func)).length;
  const readinessScorePercent = toPercent(accepted.length, required.length);

  if (highPriorityBlocking === 0 && approvedForRelease) {
    return {
      readyForCommit: "READY",
      totalFunctions: functions.length,
      requiredFunctions: required.length,
      acceptedFunctions: accepted.length,
      blockingFunctions: highPriorityBlocking,
      highPriorityBlocking,
      optionalPending,
      readinessScorePercent,
      readinessReason: "All required functions are accepted and approval flag is set."
    };
  }

  if (highPriorityBlocking === 0 && !approvedForRelease) {
    return {
      readyForCommit: "ALMOST_READY",
      totalFunctions: functions.length,
      requiredFunctions: required.length,
      acceptedFunctions: accepted.length,
      blockingFunctions: highPriorityBlocking,
      highPriorityBlocking,
      optionalPending,
      readinessScorePercent,
      readinessReason: "All required functions accepted. Waiting for approval trigger."
    };
  }

  return {
    readyForCommit: "NOT_READY",
    totalFunctions: functions.length,
    requiredFunctions: required.length,
    acceptedFunctions: accepted.length,
    blockingFunctions: highPriorityBlocking,
    highPriorityBlocking,
    optionalPending,
    readinessScorePercent,
    readinessReason: "Some required high-priority functions are not accepted yet."
  };
}
