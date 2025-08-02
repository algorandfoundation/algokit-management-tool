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
      <div className={`tabs ${hideBorder ? '' : 'tabs-bordered'}`}>
        {tabs.map((tab, index) => (
          <button
            key={typeof tab.label === "string" ? tab.label : index}
            onClick={() => setActiveTab(index)}
            className={`tab tab-lg ${activeTab === index ? 'tab-active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="h-full overflow-auto">{tabs[activeTab].content}</div>
    </div>
  );
}
