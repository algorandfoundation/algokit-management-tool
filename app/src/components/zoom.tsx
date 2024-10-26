import { Zoom } from "@visx/zoom";
import { RectClipPath } from "@visx/clip-path";
import { PropsWithChildren } from "react";
import { TransformMatrix } from "@visx/zoom/lib/types";

export type ZoomState = {
  initialTransformMatrix: TransformMatrix;
  transformMatrix: TransformMatrix;
  isDragging: boolean;
};

type ZoomableContainerProps = {
  width: number;
  height: number;
};

const ZoomableContainer = ({
  width,
  height,
  children,
}: PropsWithChildren<ZoomableContainerProps>) => (
  <Zoom<SVGSVGElement>
    width={width}
    height={height}
    scaleXMin={1}
    scaleXMax={4}
    scaleYMin={1}
    scaleYMax={4}
    initialTransformMatrix={{
      scaleX: 1,
      scaleY: 1,
      translateX: 100,
      translateY: 0,
      skewX: 0,
      skewY: 0,
    }}
  >
    {(zoom) => (
      <svg
        width={width}
        height={height}
        ref={zoom.containerRef}
        style={{
          cursor: zoom.isDragging ? "grabbing" : "default",
          touchAction: "none",
        }}
      >
        <RectClipPath id="zoom-clip" width={width} height={height} />

        <g transform={zoom.toString()} clipPath="url(#zoom-clip)">
          {children}
        </g>
      </svg>
    )}
  </Zoom>
);

export default ZoomableContainer;
