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
          onClick={() => setIsMenuOpen(true)}
          className="fixed top-4 left-4 text-2xl"
          aria-label="Open menu"
        >
          <IoMenu />
        </button>

        <main>{children}</main>
      </div>
      <div className="drawer-side">
        <label
          htmlFor="my-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <ul className="menu bg-base-200 text-base-content min-h-full w-80 p-4 gap-2">
          <li>
            <Link to="/func-specs">Functional Specifications</Link>
          </li>
          <li>
            <Link to="/deps-viz">Dependency Visualizer</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
