// ... imports ...
// Remove all MUI imports and replace with:
import { Column, Table } from '@tanstack/react-table';
import { useMemo, useState } from 'react';

const getHeaderForColumn = (column: Column<any>) => column.columnDef.header;
const ROW_ACTIONS = 'rowActions'

export const ColumnVisibility = <TData,>({ table }: { table: Table<TData> }) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortedVisibleColumns = useMemo(() => {
    const allLeafColumns = table.getAllLeafColumns();
    return allLeafColumns
      .filter(c => c.getCanHide() || c.id !== ROW_ACTIONS)
      .sort((a, b) => getHeaderForColumn(a).localeCompare(getHeaderForColumn(b)));
  }, [table]);

  return (
    <div className="dropdown dropdown-end">
      <button className="btn btn-ghost btn-circle" onClick={() => setIsOpen(!isOpen)}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>
      {isOpen && (
        <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
          <li className="menu-title flex justify-between p-2">
            <button className="btn btn-sm" onClick={table.getToggleAllColumnsVisibilityHandler()}>
              Toggle All
            </button>
            <button className="btn btn-circle btn-sm" onClick={() => table.resetColumnVisibility()}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </li>
          {sortedVisibleColumns.map(col => (
            <li key={col.id}>
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={col.getIsVisible()}
                  onChange={col.getToggleVisibilityHandler()}
                  disabled={!col.getCanHide()}
                />
                <span className="label-text">{getHeaderForColumn(col)}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const SearchField = <TData,>({ table }: { table: Table<TData> }) => {
  // ... existing state logic ...

  return (
    <div className="form-control">
      <div className="input-group">
        <span className="btn btn-ghost btn-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search"
          className="input input-bordered input-sm w-full max-w-xs"
          value={value}
          onChange={e => handleChange(trimTabs(e.target.value))}
        />
        {table.getState().globalFilter && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setValue('');
              table.resetGlobalFilter();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export const TableToolbar = <TData,>({
  children,
  table,
  tableActions,
  title
}: TableToolbarPropTypes<TData>) => (
  <div className="sticky top-0 bg-base-100">
    <div className="navbar">
      <div className="flex-1">
        {typeof title === 'string' ? (
          <h2 className="text-xl font-semibold">{title}</h2>
        ) : (
          title
        )}
      </div>
      <div className="flex-none gap-2">
        <SearchField table={table} />
        <ColumnVisibility table={table} />
        {tableActions}
      </div>
    </div>
    {children && (
      <div className="divider m-0"></div>
      <div className="p-4">
        {children}
      </div>
    )}
  </div>
);