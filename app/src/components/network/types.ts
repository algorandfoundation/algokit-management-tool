type Version = {
  repo_name: string;
  version: string;
};
export interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  version: Version[];
  owner: string;
  language: string;
  type: string;
  // type: "dependency" | "dev-dependency" | "peer-dependency";
}

export interface Link extends d3.SimulationLinkDatum<Node> {
  language: string;
  type: string;
  // type: "dependency" | "dev-dependency" | "peer-dependency";
}

export type Data = {
  nodes: Node[];
  links: Link[];
};

export type GraphData = {
  nodes: Node[];
  links: Link[];
};
