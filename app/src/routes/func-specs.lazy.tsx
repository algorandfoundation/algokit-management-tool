import { createLazyFileRoute } from "@tanstack/react-router";
import Tree from "../features/tree/Tree";
import { useScreenSize } from "@visx/responsive";
import { useEffect, useState } from "react";
import { FuncSpecsDetailsDrawer } from "@/features/func-specs-details-drawer/FuncSpecsDetailsDrawer";
import { NodeData } from "@/features/tree/types";
import { HierarchyPointNode } from "@visx/hierarchy/lib/types";

export const Route = createLazyFileRoute("/func-specs")({
  component: RouteComponent,
});

function RouteComponent() {
  const { width, height } = useScreenSize();
  const [data, setData] = useState(null);
  const [selectedNode, setSelectedNode] =
    useState<HierarchyPointNode<NodeData> | null>(null);

  useEffect(() => {
    import("./tree_data.json").then((m) => {
      // @ts-expect-error - imported JSON structure doesn't match expected type
      setData(m.default);
    });
  }, []);

  if (!data || width === 0 || height === 0) return null;
  return (
    <div>
      <Tree
        data={data}
        width={width}
        height={height + 100}
        setSelectedNode={setSelectedNode}
      />
      <FuncSpecsDetailsDrawer
        selectedNode={selectedNode}
        close={() => setSelectedNode(null)}
      />
    </div>
  );
}
