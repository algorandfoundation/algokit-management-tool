import { createLazyFileRoute } from "@tanstack/react-router";
import { ConfigContextProvider } from "../config-context";
import { Legend } from "../features/legend";
import { RepoNetwork } from "../features/repo-network";
import { Drawer } from "../features/drawer";

export const Route = createLazyFileRoute("/deps-viz")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ConfigContextProvider>
      <div className="h-dvh">
        <div className="absolute top-0 left-0 z-10">
          <Legend />
        </div>
        <div className="h-full w-full">
          <RepoNetwork />
        </div>
        <div className="absolute top-2 right-2 z-10">
          <Drawer />
        </div>
      </div>
    </ConfigContextProvider>
  );
}
