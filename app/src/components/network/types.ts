export interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  version: string[];
  owner: string;
  language: string;
  type: "dependency" | "dev-dependency" | "peer-dependency";
}

export interface Link extends d3.SimulationLinkDatum<Node> {
  language: string;
  type: "dependency" | "dev-dependency" | "peer-dependency";
}

export type Data = {
  nodes: Node[];
  links: Link[];
};
