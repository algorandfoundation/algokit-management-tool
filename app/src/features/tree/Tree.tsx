import { Group } from "@visx/group";
import { Tree as VisxTree } from "@visx/hierarchy";
import { hierarchy } from "d3-hierarchy";
import Links from "./Links";
import Nodes from "./Nodes";
import { useState } from "react";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { NodeData } from "./types";
import { HierarchyPointNode } from "@visx/hierarchy/lib/types";

interface TreeProps {
  data: NodeData;
  width: number;
  height: number;
  margin?: {
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
  setSelectedNode: (node: HierarchyPointNode<NodeData>) => void;
}

function Tree({
  data: treeData,
  width,
  height,
  margin = {
    top: 30,
    left: 30,
    right: 100,
    bottom: 30,
  },
  setSelectedNode,
}: TreeProps) {
  const [renderCount, setRenderCount] = useState(0);
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip<NodeData>();

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const origin = { x: 0, y: 0 };
  const sizeWidth = innerHeight;
  const sizeHeight = innerWidth;

  const root = hierarchy(treeData, (d) => {
    if (d === treeData) {
      d.isExpanded = true;
    }
    return d.isExpanded ? d.children : null;
  });

  const handleNodeClick = (
    event: React.MouseEvent<Element>,
    node: HierarchyPointNode<NodeData>
  ) => {
    if (event.ctrlKey || event.metaKey) {
      setSelectedNode(node);
      return;
    }
    if (!node.data.isExpanded) {
      node.data.x0 = node.x ?? 0;
      node.data.y0 = node.y ?? 0;
    }
    node.data.isExpanded = !node.data.isExpanded;
    // Force re-render
    setRenderCount(renderCount + 1);
  };

  if (width < 10) return null;
  console.log({ tooltipData, tooltipTop, tooltipLeft });
  return (
    <div style={{ position: "relative" }}>
      <svg width={width} height={height}>
        <VisxTree
          top={margin.top}
          left={margin.left}
          root={root}
          size={[sizeWidth, sizeHeight]}
          separation={(a, b) => (a.parent == b.parent ? 1 : 0.5) / a.depth}
        >
          {(tree) => {
            return (
              <Group top={origin.y + margin.top} left={origin.x + margin.left}>
                <Links links={tree.links()} />
                <Nodes
                  nodes={tree.descendants()}
                  onNodeClick={handleNodeClick}
                  onMouseOver={(event, node) => {
                    const { clientX, clientY } = event;
                    console.log({ clientX, clientY });

                    showTooltip({
                      tooltipData: node.data,
                      tooltipLeft: clientX,
                      tooltipTop: clientY,
                    });
                  }}
                  onMouseLeave={() => hideTooltip()}
                />
              </Group>
            );
          }}
        </VisxTree>
      </svg>
      {tooltipData && (
        <TooltipWithBounds top={tooltipTop} left={tooltipLeft}>
          <div className="min-w-[200px] max-w-[400px] p-2 flex flex-col gap-1">
            <p>
              <strong>{tooltipData.name}</strong>
            </p>
            {tooltipData.description && (
              <p className="text-xs">{tooltipData.description}</p>
            )}
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
}

export default Tree;
