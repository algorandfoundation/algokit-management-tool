import {
  ColumnDef,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Table } from "./table";

export interface DataTablePropTypes<TData> {
  columnDefs: ColumnDef<TData>[];
  data: TData[];
}

export const DataTable = <TData extends { id: string }>({
  columnDefs,
  data,
}: DataTablePropTypes<TData>) => {
  const table = useReactTable({
    data,
    getRowId: (row) => row.id,
    columns: columnDefs,
    enableSorting: true,
    enableMultiSort: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
  });

  return (
    <div className="flex flex-col ">
      <Table table={table} />
    </div>
  );
};
