import { createLazyFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table";
import { Release, ReleasesApiResponse, RepositoryReleases } from "@/types/releases";
import { PRMetricsCards } from "@/components/pr-metrics-cards";
import { PRMetricsDetails } from "@/components/pr-metrics-details";
import { ErrorBoundary } from "react-error-boundary";
import { useState } from "react";

import { HiChevronDown, HiChevronUp } from "react-icons/hi2";

export const Route = createLazyFileRoute("/overview")({
  component: RouteComponent,
});

const RELEASES_URL =
  "https://storage.googleapis.com/algokit-management-tool/site/releases/latest.json";

const fetchReleases = async () => {
  const response = await fetch(RELEASES_URL);
  const data: ReleasesApiResponse = await response.json();
  
  // Transform data to add required id field and extract just repository name
  const transformedData: RepositoryReleases[] = data.results.map((repo, index) => ({
    ...repo,
    id: `repo-${index}`, // Add required id field for DataTable
    repository: repo.repository.split('/')[1] || repo.repository, // Extract just the repo name
  }));
  
  return transformedData;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const isReleaseNew = (publishedAt: string, daysThreshold: number): boolean => {
  const publishedDate = new Date(publishedAt);
  const now = new Date();
  const diffInMs = now.getTime() - publishedDate.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  return diffInDays <= daysThreshold;
};

const ReleaseLink = ({ release, releaseType }: { release: Release | null; releaseType: 'main' | 'beta' }) => {
  if (!release) {
    return <span className="text-gray-400">No release</span>;
  }
  
  const daysThreshold = releaseType === 'main' ? 3 : 1;
  const isNew = isReleaseNew(release.published_at, daysThreshold);
  
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1">
        <a 
          href={release.html_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline font-medium"
        >
          {release.tag_name}
        </a>
        {isNew && <span className="text-sm">🆕</span>}
      </div>
      <span className="text-xs text-gray-500">
        {formatDate(release.published_at)}
      </span>
    </div>
  );
};

const columns: ColumnDef<RepositoryReleases>[] = [
  {
    accessorKey: "repository",
    header: "Repository",
    size: 300,
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("repository")}</span>
    ),
  },
  {
    accessorKey: "latest_main_release",
    header: "Latest Release",
    size: 200,
    cell: ({ row }) => (
      <ReleaseLink release={row.getValue("latest_main_release")} releaseType="main" />
    ),
  },
  {
    accessorKey: "latest_beta_release", 
    header: "Latest Beta",
    size: 200,
    cell: ({ row }) => (
      <ReleaseLink release={row.getValue("latest_beta_release")} releaseType="beta" />
    ),
  },
];

function RouteComponent() {
  const [showPRDetails, setShowPRDetails] = useState(false);
  
  const { data } = useSuspenseQuery({
    queryKey: ["releases-data"],
    queryFn: fetchReleases,
  });

  return (
    <div className="h-dvh p-2 px-12 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Repository Overview</h1>
        <p className="text-muted-foreground">
          Latest releases and pull request metrics for AlgoKit repositories
        </p>
      </div>

      {/* PR Metrics Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Pull Request Activity</h2>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowPRDetails(!showPRDetails)}
          >
            {showPRDetails ? (
              <>
                <HiChevronUp className="h-4 w-4 mr-2" />
                Hide Details
              </>
            ) : (
              <>
                <HiChevronDown className="h-4 w-4 mr-2" />
                Show Details
              </>
            )}
          </button>
        </div>
        <ErrorBoundary fallback={<div>Error loading PR metrics</div>}>
          <PRMetricsCards />
          {showPRDetails && (
            <div className="mt-6">
              <PRMetricsDetails />
            </div>
          )}
        </ErrorBoundary>
      </div>

      {/* Releases Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Latest Releases</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Showing latest releases for {data?.length || 0} repositories
        </p>
        <div className="shadow-sm overflow-auto bg-base rounded-sm">
          <DataTable columnDefs={columns} data={data || []} />
        </div>
      </div>
    </div>
  );
} 