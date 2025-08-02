import { createLazyFileRoute } from "@tanstack/react-router";
import { ConfigContextProvider } from "../config-context";
import { Legend } from "../features/legend";
import { RepoNetwork } from "../features/repo-network";
import { Drawer } from "../features/drawer";
import { useSuspenseQuery } from "@tanstack/react-query";
import { DependenciesDetailsDrawer } from "@/features/dependencies-detail-drawer";
import { flattenDependencies } from "@/features/dependencies-detail-drawer/data-transform";

export const Route = createLazyFileRoute("/dependencies")({
  component: RouteComponent,
});

const DEPENDENCIES_URL =
  "https://storage.googleapis.com/algokit-management-tool/site/dependencies/latest.json";

const OUTDATED_DEPENDENCIES_URL =
  "https://storage.googleapis.com/algokit-management-tool/site/outdated/latest.json";

const fetchDeps = async () => {
  const dependencies_response = await fetch(DEPENDENCIES_URL);
  const outdated_response = await fetch(OUTDATED_DEPENDENCIES_URL);
  const dependencies = await dependencies_response.json();
  const outdated = await outdated_response.json();

  return {
    dependencies: dependencies["results"],
    outdated: flattenDependencies(outdated["results"]),
  };
};

function RouteComponent() {
  const { data } = useSuspenseQuery({
    queryKey: ["deps-data"],
    queryFn: fetchDeps,
  });

  return (
    <ConfigContextProvider data={data?.dependencies ?? []}>
      <div className="h-dvh">
        <div className="absolute top-0 left-0 z-10">
          <Legend />
        </div>
        <div className="h-full w-full">
          <RepoNetwork data={data?.dependencies ?? []} />
        </div>
        <div className="absolute top-2 right-2 z-10">
          <Drawer />
        </div>
        <DependenciesDetailsDrawer data={data?.outdated ?? []} />
      </div>
    </ConfigContextProvider>
  );
}
