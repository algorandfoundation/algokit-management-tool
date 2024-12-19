import { LinkHorizontal } from "@visx/shape";
import { NodeData } from "./types";
import { HierarchyPointLink } from "@visx/hierarchy/lib/types";

interface LinkProps {
  data: HierarchyPointLink<NodeData>;
  [key: string]: unknown;
}

const Link = ({ data, ...props }: LinkProps) => {
  return (
    <LinkHorizontal
      data={data}
      stroke="#374469"
      strokeWidth="1"
      fill="none"
      {...props}
    />
  );
};

export default Link;
