import { useState } from "react";

interface TabPanelProps {
  tabs: {
    label: string;
    content: React.ReactNode;
  }[];
}

export function TabPanel({ tabs }: TabPanelProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="h-full flex flex-col">
      <div className="flex">
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 border-b-2 ${
              activeTab === index
                ? "border-primary text-primary"
                : "border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="h-full overflow-auto">{tabs[activeTab].content}</div>
    </div>
  );
}
