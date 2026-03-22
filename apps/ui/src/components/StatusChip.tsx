import type { AcceptanceStatus, DevStatus, Priority, TestCaseResult, TestStatus } from "@proofdesk/domain";

type StatusKind = "dev" | "test" | "acceptance" | "priority" | "result";

const statusLabelMap: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  built: "Built",
  partial: "Partial",
  blocked: "Blocked",
  not_tested: "Not tested",
  ready_to_test: "Ready to test",
  passed: "Passed",
  failed: "Failed",
  in_scope: "In scope",
  under_review: "Under review",
  accepted: "Accepted",
  rejected: "Rejected",
  high: "High",
  medium: "Medium",
  low: "Low",
  error: "Error"
};

function classSuffix(kind: StatusKind, value: string): string {
  return `${kind}-${value}`;
}

export function StatusChip(props: {
  kind: StatusKind;
  value: DevStatus | TestStatus | AcceptanceStatus | Priority | TestCaseResult;
}) {
  const label = statusLabelMap[props.value] ?? props.value;
  return <span className={`status-chip ${classSuffix(props.kind, props.value)}`}>{label}</span>;
}
