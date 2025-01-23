import { ParentSize } from "@visx/responsive";
import OutdatedDependenciesGraph from "./outdated-dependencies-graph";
import { OutdatedDependenciesData } from "./types";
import { TabPanel } from "@/components/tab-panel";
import { IoBarChart } from "react-icons/io5";
import { FaTable } from "react-icons/fa";
import { OutdatedDependenciesTable } from "./outdated-dependencies-table";

interface OutdatedPanelProps {
  data: OutdatedDependenciesData;
}

function OutdatedPanel({ data }: OutdatedPanelProps) {
  const tabs = [
    {
      label: <IoBarChart className="h-full w-full" />,
      content: (
        <ParentSize className="h-full w-full">
          {({ width, height }) => (
            <OutdatedDependenciesGraph
              width={width}
              height={height}
              data={data}
            />
          )}
        </ParentSize>
      ),
    },
    {
      label: <FaTable className="h-full w-full" />,
      content: <OutdatedDependenciesTable data={data} />,
    },
  ];
  return (
    <div className="h-full w-full">
      <TabPanel tabs={tabs} hideBorder={true} />
    </div>
  );
}

export default OutdatedPanel;
