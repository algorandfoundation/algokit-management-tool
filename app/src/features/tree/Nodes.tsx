import { Group } from "@visx/group";
import { motion, AnimatePresence } from "framer-motion";
import Node from "./Node";
import { HierarchyPointNode } from "@visx/hierarchy/lib/types";
import { NodeData } from "./types";

interface NodesProps {
  nodes: HierarchyPointNode<NodeData>[];
  onNodeClick: (
    event: React.MouseEvent<Element>,
    node: HierarchyPointNode<NodeData>
  ) => void;
  onMouseOver: (
    event: React.MouseEvent,
    node: HierarchyPointNode<NodeData>
  ) => void;
  onMouseLeave: () => void;
}

function Nodes({ nodes, onMouseOver, onMouseLeave, onNodeClick }: NodesProps) {
  return (
    <Group>
      <AnimatePresence>
        {nodes.map((node) => {
          const parentTopLeft = node.parent
            ? { top: node.parent.x, left: node.parent.y }
            : { top: 0, left: 0 };
          return (
            <motion.g
              key={node.data.name}
              initial={{
                translateY: parentTopLeft.top,
                translateX: parentTopLeft.left,
                opacity: 0,
              }}
              animate={{
                translateY: node.x,
                translateX: node.y,
                opacity: 1,
              }}
              exit={{
                translateY: node.parent?.data.x0 ?? 0,
                translateX: node.parent?.data.y0 ?? 0,
                opacity: 0,
              }}
              transition={{ duration: 0.3 }}
            >
              <Node
                node={node}
                onMouseOver={onMouseOver}
                onMouseLeave={onMouseLeave}
                onClick={onNodeClick}
              />
            </motion.g>
          );
        })}
      </AnimatePresence>
    </Group>
  );
}

export default Nodes;
