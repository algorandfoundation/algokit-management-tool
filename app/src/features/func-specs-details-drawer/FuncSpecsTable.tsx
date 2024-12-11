import { DataTable } from "@/components/table/data-table";
import { BaseNodeData } from "../tree/types";

interface FuncSpecsTableProps {
  data: BaseNodeData[];
}

export function FuncSpecsTable({ data }: FuncSpecsTableProps) {
  const columnDefs = [
    { id: "specId", header: "ID", accessorKey: "specId", size: 100 },
    { id: "name", header: "Name", accessorKey: "name", size: 200 },
    {
      id: "description",
      header: "Description",
      accessorKey: "description",
      //   width: "auto",
      size: "auto",
    },
  ];
  return (
    <DataTable
      columnDefs={columnDefs}
      data={data.map((item) => ({ ...item, id: item.specId }))}
    />
  );
}
