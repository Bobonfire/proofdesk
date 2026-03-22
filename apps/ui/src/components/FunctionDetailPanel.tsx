import type { Epic, Feature, FunctionItem, TestCase } from "@proofdesk/domain";
import { StatusChip } from "./StatusChip";

interface FunctionDetailPanelProps {
  functionItem: FunctionItem | null;
  epic: Epic | null;
  feature: Feature | null;
  testCases: TestCase[];
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return "No run yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function FunctionDetailPanel({ functionItem, epic, feature, testCases }: FunctionDetailPanelProps) {
  if (!functionItem) {
    return (
      <section className="detail-panel">
        <h2>Function Detail</h2>
        <p className="empty-state">Select a function from the capability map to inspect it.</p>
      </section>
    );
  }

  return (
    <section className="detail-panel">
      <h2>Function Detail</h2>
      <p className="breadcrumb">
        {epic?.name ?? "Unknown Epic"} / {feature?.name ?? "Unknown Feature"}
      </p>
      <h3>{functionItem.name}</h3>

      <div className="chip-row">
        <StatusChip kind="priority" value={functionItem.priority} />
        <StatusChip kind="dev" value={functionItem.devStatus} />
        <StatusChip kind="test" value={functionItem.testStatus} />
        <StatusChip kind="acceptance" value={functionItem.acceptanceStatus} />
      </div>

      <div className="detail-grid">
        <div>
          <h4>Short description</h4>
          <p>{functionItem.shortDescription}</p>
        </div>
        <div>
          <h4>Long description</h4>
          <p>{functionItem.longDescription || "No long description provided yet."}</p>
        </div>
        <div>
          <h4>Expected behavior</h4>
          <p>{functionItem.expectedBehavior}</p>
        </div>
        <div>
          <h4>Known risks</h4>
          <p>{functionItem.knownRisks || "No known risks recorded."}</p>
        </div>
        <div>
          <h4>Tags</h4>
          {functionItem.tags && functionItem.tags.length > 0 ? (
            <div className="chip-row">
              {functionItem.tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p>No tags assigned.</p>
          )}
        </div>
      </div>

      <div className="testcase-section">
        <h4>Associated test cases</h4>
        {testCases.length === 0 ? (
          <p className="empty-state">No test cases linked to this function yet.</p>
        ) : (
          <div className="testcase-list" role="table" aria-label="Associated test cases">
            <div className="testcase-list-header" role="row">
              <span>Name</span>
              <span>Test Type</span>
              <span>Execution</span>
              <span>Description</span>
              <span>Last Result</span>
              <span>Last Run</span>
            </div>
            {testCases.map((testCase) => (
              <div key={testCase.id} className="testcase-row" role="row">
                <strong>{testCase.name}</strong>
                <span>{testCase.testType}</span>
                <span>{testCase.executionType}</span>
                <span>{testCase.description}</span>
                <span>
                  {testCase.lastResult ? <StatusChip kind="result" value={testCase.lastResult} /> : "No result yet"}
                </span>
                <span>{formatDate(testCase.lastRunAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
