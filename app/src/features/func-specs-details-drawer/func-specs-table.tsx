import { DataTable } from "@/components/table/data-table";
import { BaseNodeData } from "../tree/types";

interface FuncSpecsTableProps {
  data: BaseNodeData[];
}

const columnDefs = [
  { id: "specId", header: "ID", accessorKey: "specId", size: 100 },
  { id: "name", header: "Name", accessorKey: "name", size: 250 },
  {
    id: "description",
    header: "Description",
    accessorKey: "description",
    size: -1,
  },
  {
    id: "currentFunctionality",
    header: "Current Functionality",
    accessorKey: "currentFunctionality",
    size: 150,
  },
];

export function FuncSpecsTable({ data }: FuncSpecsTableProps) {
  return (
    <DataTable<BaseNodeData & { id: string }>
      columnDefs={columnDefs}
      data={data.map((item) => ({ ...item, id: item.specId }))}
    />
  );
}
