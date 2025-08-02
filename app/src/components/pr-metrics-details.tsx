import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePRMetrics } from "@/hooks/use-pr-metrics";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

interface RepositoryMetricRow {
  id: string;
  repository: string;
  closed_24hr: number;
  merged_24hr: number;
  dependabot_24hr: number;
  closed_7day: number;
  merged_7day: number;
  dependabot_7day: number;
}

const columns: ColumnDef<RepositoryMetricRow>[] = [
  {
    accessorKey: "repository",
    header: "Repository",
    cell: ({ row }) => {
      const repoName = row.original.repository.split("/")[1] || row.original.repository;
      return <span className="font-medium">{repoName}</span>;
    },
  },
  {
    accessorKey: "closed_24hr",
    header: "Closed (24hr)",
  },
  {
    accessorKey: "merged_24hr",
    header: "Merged (24hr)",
  },
  {
    accessorKey: "dependabot_24hr",
    header: "Dependabot (24hr)",
  },
  {
    accessorKey: "closed_7day",
    header: "Closed (7d)",
  },
  {
    accessorKey: "merged_7day",
    header: "Merged (7d)",
  },
  {
    accessorKey: "dependabot_7day",
    header: "Dependabot (7d)",
  },
];

export function PRMetricsDetails() {
  const { data } = usePRMetrics();

  if (!data || !data.metrics) {
    return null;
  }

  const { metrics } = data;

  // Transform metrics by repository into table rows
  const allRepos = new Set([
    ...Object.keys(metrics["24_hours"].by_repository),
    ...Object.keys(metrics["7_days"].by_repository),
  ]);

  const tableData: RepositoryMetricRow[] = Array.from(allRepos).map((repo, index) => ({
    id: `repo-${index}`,
    repository: repo,
    closed_24hr: metrics["24_hours"].by_repository[repo]?.closed || 0,
    merged_24hr: metrics["24_hours"].by_repository[repo]?.merged || 0,
    dependabot_24hr: metrics["24_hours"].by_repository[repo]?.dependabot || 0,
    closed_7day: metrics["7_days"].by_repository[repo]?.closed || 0,
    merged_7day: metrics["7_days"].by_repository[repo]?.merged || 0,
    dependabot_7day: metrics["7_days"].by_repository[repo]?.dependabot || 0,
  }));

  // Sort by most active repositories (7-day closed count)
  tableData.sort((a, b) => b.closed_7day - a.closed_7day);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pull Request Metrics by Repository</CardTitle>
        <CardDescription>
          Breakdown of closed and merged pull requests per repository
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={tableData} />
      </CardContent>
    </Card>
  );
}