import type { CapabilityEpicNode, CapabilityFeatureNode, FunctionItem } from "@proofdesk/domain";
import { StatusChip } from "./StatusChip";

export interface CapabilityTreeFeatureNode extends Omit<CapabilityFeatureNode, "functions"> {
  functions: FunctionItem[];
}

export interface CapabilityTreeNode extends Omit<CapabilityEpicNode, "features"> {
  features: CapabilityTreeFeatureNode[];
}

interface CapabilityTreeProps {
  nodes: CapabilityTreeNode[];
  selectedFunctionId: string;
  onSelectFunction: (functionId: string) => void;
}

function layerLabel(layer: CapabilityTreeNode["layer"]): string {
  if (layer === "mixed") {
    return "Discovery + execution";
  }

  return layer === "discovery" ? "Discovery only" : "Execution only";
}

function implementationLabel(state: CapabilityTreeFeatureNode["implementationState"]): string {
  if (state === "implemented") {
    return "Implemented";
  }

  if (state === "in_progress") {
    return "In progress";
  }

  return "Planned";
}

export function CapabilityTree({ nodes, selectedFunctionId, onSelectFunction }: CapabilityTreeProps) {
  if (nodes.length === 0) {
    return <p className="empty-state">No discovery or execution scope matches the active search/filter.</p>;
  }

  return (
    <div className="capability-tree">
      {nodes.map((node) => (
        <section key={node.id} className="tree-epic">
          <header className="tree-epic-header">
            <div className="tree-epic-title-row">
              <h3>{node.name}</h3>
              <span className={`scope-chip scope-${node.layer}`}>{layerLabel(node.layer)}</span>
            </div>
            <p>{node.description}</p>
          </header>
          {node.features.map((featureNode) => (
            <div key={featureNode.id} className="tree-feature">
              <div className="tree-feature-header">
                <h4>{featureNode.name}</h4>
                <div className="tree-feature-badges">
                  <span className={`scope-chip scope-${featureNode.layer}`}>{layerLabel(featureNode.layer)}</span>
                  <span className={`scope-chip implementation-${featureNode.implementationState}`}>
                    {implementationLabel(featureNode.implementationState)}
                  </span>
                </div>
              </div>
              {featureNode.functions.length > 0 ? (
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
              ) : (
                <p className="tree-feature-empty">
                  {featureNode.layer === "discovery"
                    ? "Planned scope: no implemented execution functions yet."
                    : "Execution scope exists but no functions are linked yet."}
                </p>
              )}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
