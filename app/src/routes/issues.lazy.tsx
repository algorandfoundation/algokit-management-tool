import { createLazyFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import IssuesBarGraph from "@/features/issues/issues-bar-graph";
import { IssuesApiResponse } from "@/types/issues";
import { IssueTable } from "@/features/issues/issue-table";

export const Route = createLazyFileRoute("/issues")({
  component: RouteComponent,
});

const ISSUES_URL =
  "https://storage.googleapis.com/algokit-management-tool/site/issues/latest.json";

const fetchIssues = async () => {
  const response = await fetch(ISSUES_URL);
  const data: IssuesApiResponse = await response.json();
  return {
    issues: data["results"],
  };
};

function RouteComponent() {
  const { data } = useSuspenseQuery({
    queryKey: ["issues-data"],
    queryFn: fetchIssues,
  });

  return (
    <div className="h-dvh flex flex-col gap-4 p-4">
      <div className="flex-1 min-h-0 shadow-sm">
        <IssuesBarGraph data={data?.issues ?? []} />
      </div>
      <div className="flex-1 min-h-0 shadow-sm overflow-x-auto">
        <IssueTable data={data?.issues ?? []} />
      </div>
    </div>
  );
}
