import { useState } from "react";
import { MdOutlineAnalytics } from "react-icons/md";
import { MotionDrawer } from "@/components/motion-drawer";
import { TabPanel } from "@/components/tab-panel";
import OutdatedPanel from "./outdated-panel";
import { Dependency } from "@/types/dependencies";

interface DependenciesDetailsDrawerProps {
  data: Dependency[];
}

export function DependenciesDetailsDrawer({
  data,
}: DependenciesDetailsDrawerProps) {
  const [open, setOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const tabs = [
    {
      label: "Outdated",
      content: <OutdatedPanel data={data} />,
    },
  ];

  return (
    <>
      <MotionDrawer
        open={open}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        onClose={() => setOpen(false)}
      >
        {open && (
          <div className="p-2 h-full w-full">
            <TabPanel tabs={tabs} />
          </div>
        )}
      </MotionDrawer>
      <div
        className="absolute bottom-2 right-2 z-0 btn btn-square btn-ghost"
        onClick={() => setOpen(!open)}
      >
        <MdOutlineAnalytics style={{ height: "80%", width: "80%" }} />
      </div>
    </>
  );
}
