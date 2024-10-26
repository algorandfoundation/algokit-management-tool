import { DefaultNode, Graph } from "@visx/network";
import { data } from "./data";
import { useCallback } from "react";
import { LinkProvidedProps, NodeProvidedProps } from "@visx/network/lib/types";
import { Link, Node } from "./types";
import { UseTooltipParams } from "@visx/tooltip/lib/hooks/useTooltip";
import { useConfigContext } from "../../config-context";

type NetworkProps = {
  showTooltip: UseTooltipParams<Node>["showTooltip"];
  hideTooltip: UseTooltipParams<Node>["hideTooltip"];
};

export function NetworkVisx({ showTooltip, hideTooltip }: NetworkProps) {
  const {
    showDevDependencies,
    showMismatchedVersions,
    colorBySelection,
    colorMap,
  } = useConfigContext();

  const nodeComponent = useCallback(
    ({ node }: NodeProvidedProps<Node>) => {
      if (!showDevDependencies && node.type !== "dependency") return null;
      const color =
        colorBySelection !== "none" ? colorMap(node[colorBySelection]) : "cyan";
      const shouldShowMismatched =
        showMismatchedVersions && node.version.length > 1;
      return (
        <DefaultNode
          onMouseOver={(event) => {
            const { pageX, pageY } = event;
            showTooltip({
              tooltipData: node,
              tooltipLeft: pageX,
              tooltipTop: pageY,
            });
          }}
          onMouseOut={hideTooltip}
          stroke={shouldShowMismatched ? "red" : "none"}
          stroke-width={shouldShowMismatched ? 1 : 0}
          fill={color}
          r={2.5}
        />
      );
    },
    [
      showDevDependencies,
      hideTooltip,
      showTooltip,
      colorBySelection,
      colorMap,
      showMismatchedVersions,
    ]
  );
  const linkComponent = useCallback(
    ({ link }: LinkProvidedProps<Link>) => {
      if (!showDevDependencies && link.type !== "dependency") return null;
      const linkSource = link.source as Node;
      const linkTarget = link.target as Node;
      return (
        <line
          x1={linkSource.x}
          y1={linkSource.y}
          x2={linkTarget.x}
          y2={linkTarget.y}
          strokeWidth={1}
          stroke="#999"
          strokeOpacity={0.6}
        />
      );
    },
    [showDevDependencies]
  );
  return (
    <Graph
      graph={data}
      nodeComponent={nodeComponent}
      linkComponent={linkComponent}
    />
  );
}
