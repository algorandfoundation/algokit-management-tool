import { IoSettings } from "react-icons/io5";
import { DrawerConfig } from "./drawer-config";
import { useState } from "react";

export function Drawer() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <div className="drawer drawer-end">
        <input
          id="config-drawer"
          type="checkbox"
          className="drawer-toggle"
          checked={isOpen}
        />
        <div className="drawer-content" onClick={() => setIsOpen(!isOpen)}>
          <label
            htmlFor="config-drawer"
            className="drawer-button btn btn-ghost p-0"
          >
            <IoSettings
              style={{ height: "80%", width: "80%" }}
              title="Open Settings"
            />
          </label>
        </div>
        <div className="drawer-side">
          <label
            htmlFor="config-drawer"
            aria-label="close sidebar"
            className="drawer-overlay"
            onClick={() => setIsOpen(false)}
          ></label>
          <DrawerConfig closeDrawer={() => setIsOpen(false)} />
        </div>
      </div>
    </>
  );
}
