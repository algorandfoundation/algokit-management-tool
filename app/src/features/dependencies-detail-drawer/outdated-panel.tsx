import OutdatedDependenciesGraph from "./outdated-dependencies-graph";
import { TabPanel } from "@/components/tab-panel";
import { IoBarChart } from "react-icons/io5";
import { FaTable } from "react-icons/fa";
import { OutdatedDependenciesTable } from "./outdated-dependencies-table";
import { Dependency } from "@/types/dependencies";

interface OutdatedPanelProps {
  data: Dependency[];
}

function OutdatedPanel({ data }: OutdatedPanelProps) {
  const tabs = [
    {
      label: <IoBarChart className="h-full w-full" />,
      content: <OutdatedDependenciesGraph data={data} />,
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
