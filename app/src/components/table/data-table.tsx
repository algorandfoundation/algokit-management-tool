import { MouseEvent, ReactNode } from "react";

// Remove MUI imports
import {
  ColumnDef,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Table as TableType,
  useReactTable,
} from "@tanstack/react-table";

const defaultRowsPerPageOpts = [50, 100, 500, 1000];
const getColId = (column: ColumnDef<any>) => column.id;

// import { getColId } from "./helpers";
import { Table } from "./table";
// import { Action, TableActionType } from "./TableActions";
// import { TablePagination } from "./TablePagination";
import { TableToolbar } from "./table-toolbar";

export interface DataTablePropTypes<TData> {
  columnDefs: ColumnDef<TData>[];
  data: TData[];
  initialSort: ColumnDef<TData>[];
  initialVisibleColumns: ColumnDef<TData>[];
  onRowClick?: (e: MouseEvent, data: TData) => void;
  rowsPerPageOptions?: number[];
  selectedRowId?: string | null;
  // tableActions?: DataTableAction<TData>[];
  title: string | ReactNode;
}

export const DataTable = <TData extends { id: string }>({
  columnDefs,
  data,
  initialSort = [],
  initialVisibleColumns = [],
  onRowClick,
  rowsPerPageOptions = defaultRowsPerPageOpts,
  selectedRowId,
  tableActions = [],
  title,
}: DataTablePropTypes<TData>) => {
  console.log({ data });
  const table = useReactTable({
    data,
    getRowId: (row) => row.id,
    initialState: {
      pagination: { pageIndex: 0, pageSize: rowsPerPageOptions[0] },
      columnVisibility: columnDefs.reduce(
        (acc: Record<string, boolean>, col: ColumnDef<TData>) => {
          acc[getColId(col)] = !initialVisibleColumns.length
            ? true
            : initialVisibleColumns.findIndex(
                (column) => getColId(col) === getColId(column)
              ) >= 0;
          return acc;
        },
        {}
      ),
      sorting: initialSort.map((columnDef) => ({
        id: getColId(columnDef),
        desc: Boolean(columnDef.sortDescFirst),
      })),
      globalFilter: "",
    },
    columns: columnDefs,
    enableSorting: true,
    enableMultiSort: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
  });

  // const actions = tableActions.map((action) => (
  //   <Action
  //     data={table}
  //     key={action.icon}
  //     icon={action.icon}
  //     onClick={action.onClick}
  //     disabled={action.disabled}
  //     hidden={action.hidden}
  //   />
  // ));

  return (
    // Replace Stack with a div using DaisyUI classes
    <div
      className="flex flex-col h-full w-full min-h-0 min-w-0"
      style={{ border: "1px solid red" }}
    >
      {/* <TableToolbar table={table} title={title} /> */}
      {/* <TableToolbar table={table} tableActions={actions} title={title} /> */}
      <Table
        table={table}
        onRowClick={onRowClick}
        selectedRowId={selectedRowId}
      />
      {/* <TablePagination table={table} /> */}
    </div>
  );
};
