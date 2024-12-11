import { HierarchyPointNode } from "@visx/hierarchy/lib/types";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";
import { IoChevronUpOutline, IoChevronDownOutline } from "react-icons/io5";
import { BaseNodeData, NodeData } from "../tree/types";
import { TabPanel } from "@/components/tab-panel";
import { FuncSpecsTable } from "./FuncSpecsTable";

interface FuncSpecsDetailsDrawerProps {
  selectedNode: HierarchyPointNode<NodeData> | null;
  close: () => void;
}

export function flattenNodeData(node: NodeData): BaseNodeData[] {
  // Initialize result array with current node
  const result: BaseNodeData[] = [
    {
      name: node.name,
      description: node.description,
      specId: node.specId,
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
      content: <div>Markdown</div>,
    },
  ];

  return (
    <motion.div
      initial={{ y: "100vh" }}
      animate={{
        y: open ? "0vh" : "100vh",
        height: isExpanded ? "100vh" : "60vh",
      }}
      transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
      className="fixed bottom-0 left-0 right-0 p-2 rounded-t-sm shadow-lg z-[1000] bg-base-100"
      style={{ boxShadow: "0 -2px 10px rgba(0,0,0,0.1)" }}
    >
      <TabPanel tabs={tabs} />

      <div className="absolute top-2 right-2 flex gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn btn-ghost"
          aria-label={isExpanded ? "Collapse drawer" : "Expand drawer"}
        >
          {isExpanded ? (
            <IoChevronDownOutline className="h-6 w-6" />
          ) : (
            <IoChevronUpOutline className="h-6 w-6" />
          )}
        </button>

        <button
          onClick={close}
          className="btn btn-ghost"
          aria-label="Close drawer"
        >
          <IoClose className="h-6 w-6" />
        </button>
      </div>
    </motion.div>
  );
}
