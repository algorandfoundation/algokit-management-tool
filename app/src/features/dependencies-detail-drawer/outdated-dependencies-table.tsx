import { DataTable } from "@/components/table/data-table";
import { OutdatedDependenciesData } from "./types";

export interface TableData {
  packageName: string;
  id: string;
  name: string;
  current: string;
  wanted: string;
  latest: string;
}

const transformToTableData = (data: OutdatedDependenciesData): TableData[] => {
  return data.flatMap((packageData) =>
    packageData.outdated_dependencies.map((dependency) => ({
      packageName: packageData.name,
      id: `${packageData.name}-${dependency.name}`,
      name: dependency.name,
      current: dependency.current,
      wanted: dependency.wanted,
      latest: dependency.latest,
    }))
  );
};

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

const columnDefs = [
  {
    id: "packageName",
    header: "Package Name",
    accessorKey: "packageName",
    size: 250,
  },
  {
    id: "name",
    header: "Dependency Name",
    accessorKey: "name",
    size: 250,
  },
  {
    id: "current",
    header: "Current Version",
    accessorKey: "current",
    size: 150,
  },
  {
    id: "wanted",
    header: "Wanted Version",
    accessorKey: "wanted",
    size: 150,
    cell: ({ row }) => (
      <VersionWithIcon
        current={row.original.current}
        version={row.original.wanted}
        type="wanted"
      />
    ),
  },
  {
    id: "latest",
    header: "Latest Version",
    accessorKey: "latest",
    size: 150,
    cell: ({ row }) => (
      <VersionWithIcon
        current={row.original.current}
        version={row.original.latest}
        type="latest"
      />
    ),
  },
];

interface OutdatedDependenciesTableProps {
  data: OutdatedDependenciesData;
}
export function OutdatedDependenciesTable({
  data,
}: OutdatedDependenciesTableProps) {
  const tableData = transformToTableData(data);
  return <DataTable<TableData> columnDefs={columnDefs} data={tableData} />;
}
