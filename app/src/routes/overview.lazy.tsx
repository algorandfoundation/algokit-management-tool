import { createLazyFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table";
import { Release, ReleasesApiResponse, RepositoryReleases } from "@/types/releases";

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

const ReleaseLink = ({ release }: { release: Release | null }) => {
  if (!release) {
    return <span className="text-gray-400">No release</span>;
  }
  
  return (
    <div className="flex flex-col">
      <a 
        href={release.html_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline font-medium"
      >
        {release.tag_name}
      </a>
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
      <ReleaseLink release={row.getValue("latest_main_release")} />
    ),
  },
  {
    accessorKey: "latest_beta_release", 
    header: "Latest Beta",
    size: 200,
    cell: ({ row }) => (
      <ReleaseLink release={row.getValue("latest_beta_release")} />
    ),
  },
];

function RouteComponent() {
  const { data } = useSuspenseQuery({
    queryKey: ["releases-data"],
    queryFn: fetchReleases,
  });

  return (
    <div className="h-dvh p-2 px-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Repository Overview</h1>
        <p >
          Latest releases for AlgoKit repositories ({data?.length || 0} repositories)
        </p>
      </div>
      
      <div className="flex-1 min-h-0 shadow-sm overflow-auto bg-base rounded-sm">
        <DataTable columnDefs={columns} data={data || []} />
      </div>
    </div>
  );
} 