import { DefaultNode, Graph } from "@visx/network";
import { useCallback } from "react";
import { LinkProvidedProps, NodeProvidedProps } from "@visx/network/lib/types";
import { GraphData, Link, Node } from "./types";
import { UseTooltipParams } from "@visx/tooltip/lib/hooks/useTooltip";
import { useConfigContext } from "../../config-context";

type NetworkProps = {
  showTooltip: UseTooltipParams<Node>["showTooltip"];
  hideTooltip: UseTooltipParams<Node>["hideTooltip"];
  tooltipData: UseTooltipParams<Node>["tooltipData"];
  data: GraphData;
};

export function NetworkVisx({
  data,
  showTooltip,
  hideTooltip,
  tooltipData,
}: NetworkProps) {
  const {
    showDevDependencies,
    showMismatchedVersions,
    colorBySelection,
    colorMap,
  } = useConfigContext();
  const hoverNodeId = tooltipData?.id;

  const nodeComponent = useCallback(
    ({ node }: NodeProvidedProps<Node>) => {
      if (!showDevDependencies && node.type !== "dependency") return null;
      const color =
        colorBySelection !== "none" ? colorMap(node[colorBySelection]) : "cyan";
      const shouldShowMismatched =
        showMismatchedVersions &&
        node.version.some((v, _, arr) =>
          arr.some((other) => other.version !== v.version)
        );
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
          strokeWidth={shouldShowMismatched ? 1 : 0}
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
      const linkSource = link.source as Node;
      const linkTarget = link.target as Node;
      const linkNodesDependency =
        linkSource.type === "dependency" && linkTarget.type === "dependency";
      if (!showDevDependencies && !linkNodesDependency) return null;
      const isEitherLinkNodeHoveredOver =
        linkSource.id === hoverNodeId || linkTarget.id === hoverNodeId;
      return (
        <line
          x1={linkSource.x}
          y1={linkSource.y}
          x2={linkTarget.x}
          y2={linkTarget.y}
          strokeWidth={1}
          stroke={isEitherLinkNodeHoveredOver ? "#ccc" : "#999"}
          strokeOpacity={isEitherLinkNodeHoveredOver ? 1 : 0.6}
        />
      );
    },
    [showDevDependencies, hoverNodeId]
  );
  return (
    <Graph
      graph={data}
      nodeComponent={nodeComponent}
      linkComponent={linkComponent}
    />
  );
}
