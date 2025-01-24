import { flexRender, Table as ReactTable } from "@tanstack/react-table";

export interface TablePropTypes<TData> {
  table: ReactTable<TData>;
}

export const Table = <TData,>({ table }: TablePropTypes<TData>) => {
  const rows = table.getRowModel().rows;
  const hasRows = rows.length > 0;

  return (
    <table className="table p-0">
      <thead className="sticky top-0 bg-base-200">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const columnDefSize = header.column.columnDef.size;
              return header.isPlaceholder ? null : (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{
                    width: columnDefSize === -1 ? "auto" : columnDefSize,
                  }}
                >
                  <div className="flex items-center gap-2">
                    {header.column.getCanSort() ? (
                      <button
                        className="flex items-center gap-1"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <span>
                          {header.column.getIsSorted() === "asc" && "▲"}
                          {header.column.getIsSorted() === "desc" && "▼"}
                          {!header.column.getIsSorted() && "▲▼"}
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
        {hasRows ? (
          rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => {
                const columnDefSize = cell.column.columnDef.size;
                return (
                  <td
                    key={cell.id}
                    style={{
                      width:
                        columnDefSize === -1 ? "auto" : cell.column.getSize(),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={table.getLeafHeaders().length} className="text-center">
              No records to display
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default Table;
