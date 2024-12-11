import { MouseEvent } from "react";
import {
  Column,
  flexRender,
  Table as ReactTable,
  SortDirection,
} from "@tanstack/react-table";
// import { TableFilter } from "./TableFilter";
import { TableOptionsType } from "./types";

const defaultOptions = {
  rowStyle: {
    verticalAlign: "top",
    whiteSpace: "nowrap",
  },
};

const getSortDirection = (
  isSorted: SortDirection | false,
  nextSortingOrder: SortDirection | false
) => isSorted || nextSortingOrder || undefined;

export interface TablePropTypes<TData> {
  onRowClick?: (e: MouseEvent, row: TData) => void;
  //   options?: TableOptionsType;
  selectedRowId?: string | null;
  table: ReactTable<TData>;
}

export const Table = <TData,>({
  onRowClick,
  options = defaultOptions,
  selectedRowId,
  table,
}: TablePropTypes<TData>) => {
  const showFilters = !table.options.manualFiltering;
  const { sorting } = table.getState();
  const rows = table.getRowModel().rows;
  console.log(rows);
  const hasRows = rows.length > 0;

  return (
    <div className="overflow-x-auto h-full w-full">
      <table className="table">
        <thead className="text-sm sticky top-0 z-10 bg-base-200">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                console.log({ headerSize: header.getSize() });
                return header.isPlaceholder ? null : (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{
                      //   width: header.getSize(),
                      width: "100px",
                      border: "2px solid cyan",
                    }}
                  >
                    <div
                      className="flex items-center gap-2"
                      style={{ border: "2px solid cyan" }}
                    >
                      {header.column.getCanSort() ? (
                        <button
                          className="flex items-center gap-1"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          <span
                            className="tooltip"
                            data-tip={`Sort ${header.column.getIsSorted() ? "direction" : ""}`}
                          >
                            {header.column.getIsSorted() === "asc" && "↑"}
                            {header.column.getIsSorted() === "desc" && "↓"}
                            {!header.column.getIsSorted() && "↕"}
                          </span>
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {/* {showFilters && (
            <tr>
              {table.getLeafHeaders().map(header =>
                header.column.getCanFilter() ? (
                  <td
                    key={`${header.id}-filter`}
                    colSpan={header.colSpan}
                    style={{ width: header.column.getSize() }}
                  >
                    <TableFilter column={header.column} table={table} />
                  </td>
                ) : (
                  <td key={`${header.id}-filter`} />
                )
              )}
            </tr>
          )} */}
          {hasRows ? (
            rows.map((row) => (
              <tr
                key={row.id}
                onClick={(e: MouseEvent) => onRowClick?.(e, row.original)}
                className={`
                  ${onRowClick ? "cursor-pointer hover:bg-base-200" : ""}
                  ${selectedRowId === row.id ? "bg-primary text-primary-content" : ""}
                `}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="whitespace-nowrap"
                    style={{
                      width: cell.column.getSize(),
                      //   ...(cell.column.columnDef.meta?.cellStyle as any),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={table.getLeafHeaders().length}
                className="text-center"
              >
                No records to display
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
