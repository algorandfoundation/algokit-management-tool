import { DataTable } from "@/components/table/data-table";
import { Dependency } from "@/types/dependencies";
import { ColumnDef } from "@tanstack/react-table";

const compareVersions = (
  current: string,
  target: string
): "major" | "minor" | "small" | "none" => {
  const [currentMajor, currentMinor] = current.split(".").map(Number);
  const [targetMajor, targetMinor] = target.split(".").map(Number);

  if (targetMajor > currentMajor) return "major";
  if (targetMajor === currentMajor && targetMinor - currentMinor > 2)
    return "minor";
  if (targetMajor === currentMajor && targetMinor > currentMinor)
    return "small";
  return "none";
};

const VersionWithIcon = ({
  current,
  version,
}: {
  current: string;
  version: string;
  type: "wanted" | "latest";
}) => {
  const difference = compareVersions(current, version);

  return (
    <div className="flex items-center gap-2">
      {difference === "major" && <span className="text-red-500">⬤</span>}
      {difference === "minor" && <span className="text-orange-500">⬤</span>}
      {difference === "small" && <span className="text-yellow-500">⬤</span>}
      {difference === "none" && <span className="text-green-500">⬤</span>}
      {version}
    </div>
  );
};

const columnDefs: ColumnDef<Dependency & { id: string }>[] = [
  {
    id: "repoName",
    header: "Repository Name",
    accessorKey: "repoName",
    size: 250,
  },
  {
    id: "packageName",
    header: "Dependency Name",
    accessorKey: "packageName",
    size: 250,
  },
  {
    id: "current",
    header: "Current Version",
    accessorKey: "packageCurrent",
    size: 150,
  },
  {
    id: "packageWanted",
    header: "Wanted Version",
    accessorKey: "packageWanted",
    size: 150,
    cell: ({ row }) => (
      <VersionWithIcon
        current={row.original.packageCurrent}
        version={row.original.packageWanted}
        type="wanted"
      />
    ),
  },
  {
    id: "latest",
    header: "Latest Version",
    accessorKey: "packageLatest",
    size: 150,
    cell: ({ row }) => (
      <VersionWithIcon
        current={row.original.packageCurrent}
        version={row.original.packageLatest}
        type="latest"
      />
    ),
  },
];

interface OutdatedDependenciesTableProps {
  data: Dependency[];
}
export function OutdatedDependenciesTable({
  data,
}: OutdatedDependenciesTableProps) {
  return (
    <DataTable<Dependency & { id: string }>
      columnDefs={columnDefs}
      data={data.map((d) => ({
        ...d,
        id: d.repoName + d.packageName,
        name: d.packageName,
      }))}
    />
  );
}
