import { HierarchyNode } from "@visx/hierarchy/lib/types";

export interface BaseNodeData {
  name: string;
  description: string;
  specId: string;
}

export interface NodeData extends BaseNodeData {
  isExpanded?: boolean;
  children?: NodeData[];
  //   Data added hierarchy
  x0?: number;
  y0?: number;
  parent?: HierarchyNode<NodeData>;
}
