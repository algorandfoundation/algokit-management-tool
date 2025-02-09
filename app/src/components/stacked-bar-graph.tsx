import { useMemo, useState } from "react";
import { Bar } from "@visx/shape";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { useTooltip, Tooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import { FaArrowRight, FaRegListAlt } from "react-icons/fa";

export interface StackedBarConfig<T> {
  // Key to group data by (e.g., repository name or package name)
  groupByKey: keyof T | ((item: T) => string);
  // Array of categories to stack (e.g., ["bug", "feature"] or ["major", "minor"])
  categories: string[];
  // Function to determine if an item belongs to a category
  categoryMatchers: Record<string, (item: T) => boolean>;
  // Optional color map for categories
  colors?: Record<string, string>;
  // Labels for axes
  xAxisLabel?: string;
  yAxisLabel?: string;
}

const defaultColors: Record<string, string> = {
  first: "rgba(239, 68, 68, 0.7)", // red
  second: "rgba(249, 115, 22, 0.7)", // orange
  third: "rgba(234, 179, 8, 0.7)", // yellow
  fourth: "rgba(34, 197, 94, 0.7)", // green
};

// axis margins
const margin = { top: 20, right: 20, bottom: 90, left: 70 };

export interface StackedBarGraphProps<T> {
  data: T[];
  config: StackedBarConfig<T>;
  TooltipComponent?: React.ComponentType;
}

interface StackedBarGraphInnerProps<T> extends StackedBarGraphProps<T> {
  width: number;
  height: number;
}

// Inner component just for the graph
function StackedBarGraphInner<T>({
  width,
  height,
  data,
  config,
  TooltipComponent,
}: StackedBarGraphInnerProps<T>) {
  const {
    tooltipData,
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    showTooltip,
    hideTooltip,
  } = useTooltip();

  const groupedData = useMemo(() => {
    const groups: Record<string, T[]> = {};
    data.forEach((item) => {
      const key =
        typeof config.groupByKey === "function"
          ? config.groupByKey(item)
          : String(item[config.groupByKey]);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [data, config]);

  // bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // scales
  const xScale = useMemo(
    () =>
      scaleBand<string>({
        range: [0, xMax],
        round: true,
        domain: Object.keys(groupedData),
        padding: 0.4,
      }),
    [xMax, groupedData]
  );

  const yScale = useMemo(() => {
    const maxCount = Math.max(
      ...Object.values(groupedData).map((items) => items.length)
    );
    return scaleLinear<number>({
      range: [yMax, 0],
      round: true,
      domain: [0, maxCount],
    });
  }, [yMax, groupedData]);

  const handleMouseOver = (event: React.MouseEvent, groupKey: string) => {
    const point = localPoint(event);
    if (!point) return;

    const tooltipData = {
      groupKey,
      counts: config.categories.reduce(
        (acc, category) => ({
          ...acc,
          [category]: groupedData[groupKey].filter(
            config.categoryMatchers[category]
          ).length,
        }),
        {}
      ),
    };

    showTooltip({
      tooltipData,
      tooltipLeft: point.x,
      tooltipTop: point.y,
    });
  };

  const colors = config.colors || defaultColors;

  return width < 10 ? null : (
    <>
      <svg width={width} height={height}>
        <rect width={width} height={height} fill="url(#teal)" rx={14} />
        <Group left={margin.left} top={margin.top}>
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
            label={config.yAxisLabel}
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
            tickValues={[]}
          />

          {/* TODO: Rotated labels but need more configurability here */}
          {xScale.domain().map((value, index) => (
            <g
              key={`tick-${index}`}
              transform={`translate(${
                (xScale(value) ?? 0) + xScale.bandwidth() / 2
              }, ${yMax + 20}) rotate(-45)`}
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
          ))}

          {/* Bars */}
          {Object.entries(groupedData).map(([groupKey, items]) => {
            const barX = xScale(groupKey);
            const barWidth = xScale.bandwidth();
            let currentHeight = 0;

            return (
              <g key={`bar-group-${groupKey}`}>
                {config.categories.map((category, index) => {
                  const count = items.filter(
                    config.categoryMatchers[category]
                  ).length;
                  const barHeight = yMax - (yScale(count) ?? 0);

                  const bar = (
                    <Bar
                      key={`bar-${category}`}
                      x={barX}
                      y={yMax - currentHeight - barHeight}
                      width={barWidth}
                      height={barHeight}
                      fill={colors[category] || defaultColors[`${index + 1}`]}
                      onMouseMove={(event) => handleMouseOver(event, groupKey)}
                      onMouseLeave={() => hideTooltip()}
                    />
                  );

                  currentHeight += barHeight;
                  return bar;
                })}
              </g>
            );
          })}
        </Group>
      </svg>

      {tooltipOpen && tooltipData && TooltipComponent && (
        <Tooltip top={tooltipTop} left={tooltipLeft} className="z-30">
          <TooltipComponent {...tooltipData} />
        </Tooltip>
      )}
    </>
  );
}

// Main export component that handles legend and responsive sizing
export default function StackedBarGraph<T>({
  data,
  config,
  TooltipComponent,
}: StackedBarGraphProps<T>) {
  const [showLegend, setShowLegend] = useState(false);

  return (
    <div className="flex relative w-full h-full">
      <AnimatePresence>
        <ParentSize className="flex-grow min-w-0 h-full">
          {({ width, height }) => (
            <StackedBarGraphInner
              width={width}
              height={height}
              data={data}
              config={config}
              TooltipComponent={TooltipComponent}
            />
          )}
        </ParentSize>
      </AnimatePresence>
      <AnimatePresence>
        {showLegend && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            style={{ width: "auto" }}
            className={`h-full bg-gray-900/50`}
          >
            <div className="flex h-full">
              <button
                className="btn btn-ghost h-full rounded-none px-1"
                onClick={() => setShowLegend(false)}
              >
                <FaArrowRight />
              </button>
              <div className="flex flex-col gap-1 px-6 py-4">
                {config.categories.map((category) => (
                  <div key={category} className="flex items-center">
                    <span
                      className="h-[10px] w-[10px] rounded-sm mr-3"
                      style={{
                        backgroundColor:
                          config.colors?.[category] || defaultColors.first,
                      }}
                    />
                    <span className="text-xs text-white">{category}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!showLegend && (
        <div className="absolute top-0 right-0">
          <button
            className="btn btn-square btn-ghost p-2 tooltip tooltip-left"
            data-tip="Show legend"
            onClick={() => setShowLegend(true)}
          >
            <FaRegListAlt className="w-full h-full" />
          </button>
        </div>
      )}
    </div>
  );
}
