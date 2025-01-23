import { HierarchyPointNode } from "@visx/hierarchy/lib/types";
import { useMemo, useState } from "react";
import { NodeData } from "../tree/types";
import { TabPanel } from "@/components/tab-panel";
import { FuncSpecsTable } from "./func-specs-table";
import { FuncSpecsMarkdown } from "./func-specs-markdown";
import { flattenNodeData } from "./utils";
import { MotionDrawer } from "@/components/motion-drawer";

interface FuncSpecsDetailsDrawerProps {
  selectedNode: HierarchyPointNode<NodeData> | null;
  close: () => void;
}

export function FuncSpecsDetailsDrawer({
  selectedNode,
  close,
}: FuncSpecsDetailsDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const open = Boolean(selectedNode);

  const funcSpecData = useMemo(() => {
    if (!selectedNode) return null;
    return flattenNodeData(selectedNode.data);
  }, [selectedNode]);

  const tabs = [
    {
      label: "Table",
      content: <FuncSpecsTable data={funcSpecData ?? []} />,
    },
    {
      label: "Markdown",
      content: <FuncSpecsMarkdown data={funcSpecData ?? []} />,
    },
  ];

  return (
    <MotionDrawer
      open={open}
      isExpanded={isExpanded}
      setIsExpanded={setIsExpanded}
      onClose={close}
    >
      <TabPanel tabs={tabs} />
    </MotionDrawer>
  );
}
