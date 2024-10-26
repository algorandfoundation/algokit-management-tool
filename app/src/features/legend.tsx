import { LegendOrdinal } from "@visx/legend";
import { useConfigContext } from "../config-context";

export const Legend = () => {
  const { colorMap, colorBySelection } = useConfigContext();

  if (colorBySelection.toLowerCase() === "none") return null;

  return (
    <div style={{ padding: 20 }}>
      <p className="capitalize pb-3 text-xl">{colorBySelection}</p>
      <LegendOrdinal scale={colorMap} labelFormat={(label) => `${label}`}>
        {(labels) =>
          labels.map((label) => (
            <div key={label.text} className="flex items-center mb-2 capitalize">
              <span
                className={`h-[20px] w-[20px] rounded-full mr-3`}
                style={{
                  backgroundColor: label.value,
                }}
              />
              {label.text.replace(/_/g, " ")}
            </div>
          ))
        }
      </LegendOrdinal>
    </div>
  );
};
