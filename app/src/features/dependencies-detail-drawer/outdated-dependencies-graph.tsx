import { useMemo } from "react";
import { Bar } from "@visx/shape";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { OutdatedDependenciesData, PackageData } from "./types";
import { useTooltip, Tooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { OutdatedDependencyTooltip } from "./outdated-dependency-tooltip";

export interface TooltipData {
  name: string;
  majorCount: number;
  minorCount: number;
  smallCount: number;
  outdatedPatchCount: number;
}

// data accessors
const getProjectName = (d: PackageData) => d.name;
const getOutdatedCount = (d: PackageData) => d.outdated_dependencies.length;
const getMajorCount = (d: PackageData) =>
  d.outdated_dependencies.filter(
    (dep) => compareVersions(dep.current, dep.latest) === "major"
  ).length;
const getMinorCount = (d: PackageData) =>
  d.outdated_dependencies.filter(
    (dep) => compareVersions(dep.current, dep.latest) === "minor"
  ).length;
const getSmallCount = (d: PackageData) =>
  d.outdated_dependencies.filter(
    (dep) => compareVersions(dep.current, dep.latest) === "small"
  ).length;
const getOutdatedPatchCount = (d: PackageData) =>
  d.outdated_dependencies.filter(
    (dep) => compareVersions(dep.current, dep.latest) === "none"
  ).length;

// axis margins
const margin = { top: 20, right: 20, bottom: 90, left: 70 };

// Import compareVersions function from the table file
const compareVersions = (
  current: string,
  target: string
): "major" | "minor" | "small" | "none" => {
  const [currentMajor, currentMinor] = current.split(".").map(Number);
  const [targetMajor, targetMinor] = target.split(".").map(Number);

  if (targetMajor > currentMajor) return "major";
  if (targetMajor === currentMajor && targetMinor - currentMinor > 2)
    return "minor";
  if (targetMajor === currentMajor && targetMinor > currentMinor)
    return "small";
  return "none";
};

const legendItems = [
  { label: "Major Updates", color: "rgba(239, 68, 68, 0.7)" },
  { label: "Minor Updates", color: "rgba(249, 115, 22, 0.7)" },
  { label: "Small Updates", color: "rgba(234, 179, 8, 0.7)" },
  { label: "Patch Updates", color: "rgba(34, 197, 94, 0.7)" },
];

export type OutdatedDependenciesGraphProps = {
  width: number;
  height: number;
  data: OutdatedDependenciesData;
  events?: boolean;
};

export default function OutdatedDependenciesGraph({
  width,
  height,
  data,
}: OutdatedDependenciesGraphProps) {
  const {
    tooltipData,
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    showTooltip,
    hideTooltip,
  } = useTooltip<TooltipData>();

  // Update bounds to account for margins
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const xScale = useMemo(
    () =>
      scaleBand<string>({
        range: [0, xMax],
        round: true,
        domain: data.map(getProjectName),
        padding: 0.4,
      }),
    [xMax, data]
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [yMax, 0],
        round: true,
        domain: [0, Math.max(...data.map(getOutdatedCount))],
      }),
    [yMax, data]
  );

  // Handle mouse events
  const handleMouseOver = (event: React.MouseEvent, datum: PackageData) => {
    const point = localPoint(event);
    if (!point) return;
    const { x, y } = point;
    showTooltip({
      tooltipData: {
        name: datum.name,
        majorCount: getMajorCount(datum),
        minorCount: getMinorCount(datum),
        smallCount: getSmallCount(datum),
        outdatedPatchCount: getOutdatedPatchCount(datum),
      },
      tooltipLeft: x,
      tooltipTop: y,
    });
  };

  return width < 10 ? null : (
    <div>
      <svg width={width} height={height}>
        <rect width={width} height={height} fill="url(#teal)" rx={14} />
        <Group left={margin.left} top={margin.top}>
          {/* Add axes */}
          <AxisLeft
            scale={yScale}
            stroke="#fff"
            tickStroke="#fff"
            tickLabelProps={{
              fill: "#fff",
              fontSize: 11,
              textAnchor: "end",
              dx: -4,
            }}
            label="Outdated Dependencies Count"
            labelProps={{
              fill: "#fff",
              fontSize: 12,
              textAnchor: "middle",
            }}
          />
          <AxisBottom
            top={yMax}
            scale={xScale}
            stroke="#fff"
            tickStroke="#fff"
            label="Packages"
            labelProps={{
              fill: "#fff",
              fontSize: 16,
              textAnchor: "middle",
              dy: 40,
            }}
            tickValues={[]}
          />

          {xScale.domain().map((value, index) => {
            const x = xScale(value) ?? 0;
            const y = yMax + 20;
            return (
              <g
                key={`tick-group-${index}`}
                transform={`translate(${x + xScale.bandwidth() / 2}, ${y}) rotate(-45)`}
              >
                <foreignObject
                  width={margin.bottom - 20}
                  height={50}
                  x={-margin.bottom / 2}
                  y={0}
                >
                  <div
                    style={{
                      color: "#fff",
                      fontSize: 11,
                      textAlign: "center",
                      lineHeight: "1.2",
                    }}
                  >
                    {value}
                  </div>
                </foreignObject>
              </g>
            );
          })}

          {data.map((d) => {
            const projectName = getProjectName(d);
            const barWidth = xScale.bandwidth();
            const barX = xScale(projectName);

            // Calculate heights for each category
            const majorCount = getMajorCount(d);
            const minorCount = getMinorCount(d);
            const smallCount = getSmallCount(d);
            const outDatedPatchCount = getOutdatedPatchCount(d);

            const majorHeight = yMax - (yScale(majorCount) ?? 0);
            const minorHeight = yMax - (yScale(minorCount) ?? 0);
            const smallHeight = yMax - (yScale(smallCount) ?? 0);
            const outDatedPatchHeight =
              yMax - (yScale(outDatedPatchCount) ?? 0);

            return (
              <g key={`bar-group-${projectName}`}>
                {/* Outdated Patch - Green */}
                <Bar
                  x={barX}
                  y={
                    yMax -
                    majorHeight -
                    minorHeight -
                    smallHeight -
                    outDatedPatchHeight
                  }
                  width={barWidth}
                  height={outDatedPatchHeight}
                  fill="rgba(34, 197, 94, 0.7)"
                  onMouseMove={(event) => handleMouseOver(event, d)}
                  onMouseLeave={() => hideTooltip()}
                />
                {/* Major updates - Red */}
                <Bar
                  x={barX}
                  y={yMax - majorHeight}
                  width={barWidth}
                  height={majorHeight}
                  fill="rgba(239, 68, 68, 0.7)"
                  onMouseMove={(event) => handleMouseOver(event, d)}
                  onMouseLeave={() => hideTooltip()}
                />
                {/* Minor updates - Orange */}
                <Bar
                  x={barX}
                  y={yMax - majorHeight - minorHeight}
                  width={barWidth}
                  height={minorHeight}
                  fill="rgba(249, 115, 22, 0.7)"
                  onMouseMove={(event) => handleMouseOver(event, d)}
                  onMouseLeave={() => hideTooltip()}
                />
                {/* Small updates - Yellow */}
                <Bar
                  x={barX}
                  y={yMax - majorHeight - minorHeight - smallHeight}
                  width={barWidth}
                  height={smallHeight}
                  fill="rgba(234, 179, 8, 0.7)"
                  onMouseMove={(event) => handleMouseOver(event, d)}
                  onMouseLeave={() => hideTooltip()}
                />
              </g>
            );
          })}
        </Group>

        {/* legend */}
        <foreignObject x={width - 200} y={margin.top} width={180} height={150}>
          <div className="flex flex-col gap-1">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center">
                <span
                  className="h-[10px] w-[10px] rounded-sm mr-3"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
                <span className="text-xs text-white">{item.label}</span>
              </div>
            ))}
          </div>
        </foreignObject>
      </svg>

      {tooltipOpen && tooltipData && (
        <Tooltip top={tooltipTop} left={tooltipLeft} className="z-30">
          <OutdatedDependencyTooltip {...tooltipData} />
        </Tooltip>
      )}
    </div>
  );
}
