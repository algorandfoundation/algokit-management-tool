import { HierarchyNode } from "@visx/hierarchy/lib/types";

export interface NodeData {
  name: string;
  description: string;
  isExpanded?: boolean;
  children?: NodeData[];
  //   Data added hierarchy
  x0?: number;
  y0?: number;
  parent?: HierarchyNode<NodeData>;
}
