import { Link } from "@tanstack/react-router";
import { PropsWithChildren, useState } from "react";
import { IoMenu } from "react-icons/io5";

export function Layout({ children }: PropsWithChildren) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <div className="drawer">
      <input
        id="my-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isMenuOpen}
        onChange={(e) => setIsMenuOpen(e.target.checked)}
      />
      <div className="drawer-content">
        <button
          style={{
            visibility: isMenuOpen ? "hidden" : "visible",
          }}
          onClick={() => setIsMenuOpen(true)}
          className="fixed top-4 left-4 text-2xl z-[2]"
          aria-label="Open menu"
        >
          <IoMenu />
        </button>

        <main>{children}</main>
      </div>
      <div className="drawer-side" style={{ zIndex: 1 }}>
        <label
          htmlFor="my-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <ul className="menu bg-base-200 text-base-content min-h-full w-80 p-4 gap-2">
          <li>
            <Link to="/overview">Overview</Link>
          </li>
          <li>
            <Link to="/metrics">Metrics</Link>
          </li>
          <li>
            <Link to="/func-specs">Functional Specifications</Link>
          </li>
          <li>
            <Link to="/dependencies">Dependencies</Link>
          </li>
          <li>
            <Link to="/issues">Issues</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
