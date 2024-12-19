import { BaseNodeData, NodeData } from "../tree/types";

export function flattenNodeData(node: NodeData): BaseNodeData[] {
  // Initialize result array with current node
  const result: BaseNodeData[] = [
    {
      name: node.name,
      description: node.description,
      specId: node.specId,
      currentFunctionality: node.currentFunctionality,
    },
  ];

  // Recursively process children if they exist
  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      result.push(...flattenNodeData(child));
    });
  }

  return result;
}
