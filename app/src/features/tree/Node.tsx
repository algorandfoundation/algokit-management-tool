import { HierarchyPointNode } from "@visx/hierarchy/lib/types";
import { Fragment } from "react";
import { NodeData } from "./types";

interface NodeProps {
  node: HierarchyPointNode<NodeData>;
  onClick: (
    event: React.MouseEvent<Element>,
    node: HierarchyPointNode<NodeData>
  ) => void;
  onMouseOver?: (
    event: React.MouseEvent<Element>,
    node: HierarchyPointNode<NodeData>
  ) => void;
  onMouseLeave?: (event: React.MouseEvent<Element>) => void;
}

const width = 50;
const height = 30;

function Node({
  node,
  onClick,
  onMouseOver,
  onMouseLeave,
}: NodeProps): JSX.Element {
  return (
    <Fragment>
      {node.depth === 0 ? (
        <circle
          r={12}
          fill="red"
          onClick={(event) => onClick(event, node)}
          onMouseOver={(event) => onMouseOver?.(event, node)}
          onMouseLeave={onMouseLeave}
        />
      ) : (
        <foreignObject
          x={-width / 2}
          y={-height / 2}
          width={width}
          // height="auto"
          dominantBaseline="middle"
          className="overflow-visible"
        >
          <div
            onClick={(event) => onClick(event, node)}
            onMouseOver={(event) => onMouseOver?.(event, node)}
            onMouseLeave={onMouseLeave}
            className={`
            h-[30px] w-[50px] bg-[#272b4d] overflow-hidden rounded-[2px]
            ${
              node.data.children
                ? "border border-solid border-[#03c0dc] cursor-pointer"
                : "border border-dashed border-[#26deb0] rounded-[5px] opacity-60"
            }
          `}
          >
            <p
              className={`
              m-0 text-[10px] font-arial text-center pointer-events-none
              ${node.children ? "text-white" : "text-[#26deb0]"}
            `}
            >
              {node.data.name}
            </p>
          </div>
        </foreignObject>
      )}
    </Fragment>
  );
}

export default Node;
