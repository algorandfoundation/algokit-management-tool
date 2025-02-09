import { createLazyFileRoute } from "@tanstack/react-router";
import Tree from "../features/tree/Tree";
import { useScreenSize } from "@visx/responsive";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FuncSpecsDetailsDrawer } from "@/features/func-specs-details-drawer/func-specs-details-drawer";
import { NodeData } from "@/features/tree/types";
import { HierarchyPointNode } from "@visx/hierarchy/lib/types";
import { useState } from "react";

export const Route = createLazyFileRoute("/func-specs")({
  component: RouteComponent,
});

const FUNC_SPECS_URL = 
  "https://storage.googleapis.com/algokit-management-tool/site/functional_specs/latest.json";

const fetchFuncSpecs = async () => {
  const response = await fetch(FUNC_SPECS_URL);
  const {results} = await response.json();
  return results;
};

function RouteComponent() {
  const { width, height } = useScreenSize();
  const { data } = useSuspenseQuery({
    queryKey: ["func-specs-data"],
    queryFn: fetchFuncSpecs,
  });
  const [selectedNode, setSelectedNode] =
    useState<HierarchyPointNode<NodeData> | null>(null);

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
