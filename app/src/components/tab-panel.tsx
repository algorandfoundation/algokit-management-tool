import { useState } from "react";

interface TabPanelProps {
  tabs: {
    label: string | React.ReactNode;
    content: React.ReactNode;
  }[];
  hideBorder?: boolean;
}

export function TabPanel({ tabs, hideBorder = false }: TabPanelProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="h-full flex flex-col">
      <div className="flex">
        {tabs.map((tab, index) => (
          <button
            key={typeof tab.label === "string" ? tab.label : index}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 ${
              activeTab === index
                ? "border-primary text-primary"
                : "border-transparent"
            } ${hideBorder ? "border-b-0" : "border-b-2"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="h-full overflow-auto">{tabs[activeTab].content}</div>
    </div>
  );
}
