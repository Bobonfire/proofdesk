import type { FunctionItem, ReleaseState } from "@proofdesk/domain";

function isEligibleFunction(func: FunctionItem): boolean {
  if (func.priority !== "high") {
    return false;
  }

  const isBuilt = func.devStatus === "built" || func.devStatus === "partial";
  const isTested = func.testStatus === "passed";
  const isAccepted = func.acceptanceStatus === "accepted";

  return isBuilt && isTested && isAccepted;
}

export function computeReleaseState(functions: FunctionItem[], approvedForRelease: boolean): ReleaseState {
  const required = functions.filter((func) => func.priority === "high");
  const accepted = required.filter(isEligibleFunction);
  const blocking = required.length - accepted.length;

  if (blocking === 0 && approvedForRelease) {
    return {
      readyForCommit: "READY",
      totalFunctions: functions.length,
      requiredFunctions: required.length,
      acceptedFunctions: accepted.length,
      blockingFunctions: blocking,
      readinessReason: "All required functions are accepted and approval flag is set."
    };
  }

  if (blocking === 0 && !approvedForRelease) {
    return {
      readyForCommit: "ALMOST_READY",
      totalFunctions: functions.length,
      requiredFunctions: required.length,
      acceptedFunctions: accepted.length,
      blockingFunctions: blocking,
      readinessReason: "All required functions accepted. Waiting for approval trigger."
    };
  }

  return {
    readyForCommit: "NOT_READY",
    totalFunctions: functions.length,
    requiredFunctions: required.length,
    acceptedFunctions: accepted.length,
    blockingFunctions: blocking,
    readinessReason: "Some required high-priority functions are not accepted yet."
  };
}
