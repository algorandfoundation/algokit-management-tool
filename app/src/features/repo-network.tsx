import { useScreenSize } from "@visx/responsive";
import { useEffect, useRef, useState } from "react";
import { Link, Node } from "../components/network/types";
import * as d3 from "d3";
import { data } from "../components/network/data";
import ZoomableContainer from "../components/zoom";
import { NetworkVisx } from "../components/network/network-visx";
import { useTooltip, useTooltipInPortal } from "@visx/tooltip";
import { NodeTooltip } from "../components/network/node-tooltip";

export function RepoNetwork() {
  const [, forceUpdate] = useState(0);
  const { width, height } = useScreenSize();
  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } =
    useTooltip<Node>();
  const { containerRef, TooltipInPortal } = useTooltipInPortal();

  const forceRef = useRef<d3.Simulation<Node, Link>>();

  useEffect(() => {
    forceRef.current = d3
      .forceSimulation(data.nodes)
      .force("charge", d3.forceManyBody().strength(-10))
      .force("collide", d3.forceCollide().radius(2).iterations(3))
      .force(
        "link",
        d3.forceLink<Node, Link>(data.links).id((d) => d.name)
      )
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", () => {
        forceUpdate((updateCount) => updateCount + 1);
      })
      .velocityDecay(0.8)
      .on("end", () => {
        console.log("Simulation ended");
      });

    return () => {
      forceRef.current?.stop();
    };
  }, [width, height]);
  return width < 10 ? null : (
    <div ref={containerRef}>
      <ZoomableContainer width={width} height={height}>
        <NetworkVisx showTooltip={showTooltip} hideTooltip={hideTooltip} />;
      </ZoomableContainer>
      {tooltipData && (
        <TooltipInPortal
          key={Math.random()}
          top={tooltipTop}
          left={tooltipLeft}
        >
          <NodeTooltip node={tooltipData} />
        </TooltipInPortal>
      )}
    </div>
  );
}
