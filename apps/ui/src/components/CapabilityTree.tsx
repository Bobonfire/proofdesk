import type { Epic, Feature, FunctionItem } from "@proofdesk/domain";
import { StatusChip } from "./StatusChip";

export interface CapabilityTreeNode {
  epic: Epic;
  features: Array<{
    feature: Feature;
    functions: FunctionItem[];
  }>;
}

interface CapabilityTreeProps {
  nodes: CapabilityTreeNode[];
  selectedFunctionId: string;
  onSelectFunction: (functionId: string) => void;
}

export function CapabilityTree({ nodes, selectedFunctionId, onSelectFunction }: CapabilityTreeProps) {
  if (nodes.length === 0) {
    return <p className="empty-state">No functions match the active search/filter.</p>;
  }

  return (
    <div className="capability-tree">
      {nodes.map((node) => (
        <section key={node.epic.id} className="tree-epic">
          <header className="tree-epic-header">
            <h3>{node.epic.name}</h3>
            <p>{node.epic.description}</p>
          </header>
          {node.features.map((featureNode) => (
            <div key={featureNode.feature.id} className="tree-feature">
              <h4>{featureNode.feature.name}</h4>
              <ul className="tree-function-list">
                {featureNode.functions.map((functionItem) => (
                  <li key={functionItem.id}>
                    <button
                      type="button"
                      className={selectedFunctionId === functionItem.id ? "function-row selected" : "function-row"}
                      onClick={() => onSelectFunction(functionItem.id)}
                    >
                      <span className="function-row-main">
                        <strong>{functionItem.name}</strong>
                        <small>{functionItem.shortDescription}</small>
                      </span>
                      <span className="function-row-status">
                        <StatusChip kind="dev" value={functionItem.devStatus} />
                        <StatusChip kind="test" value={functionItem.testStatus} />
                        <StatusChip kind="acceptance" value={functionItem.acceptanceStatus} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
