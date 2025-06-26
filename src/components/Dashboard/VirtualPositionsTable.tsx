import React, { useMemo, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnDef,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Position {
  id: number;
  symbol: string;
  description: string;
  quantity: number;
  price: number;
  marketValue: number;
  costBasis: number;
  gainDollar: number;
  gainPercent: number;
  type: 'stock' | 'option' | 'future';
  status: 'open' | 'closed';
}

interface VirtualPositionsTableProps {
  data: Position[];
  onRowSelect?: (position: Position) => void;
  selectedRows?: Set<number>;
}

export const VirtualPositionsTable: React.FC<VirtualPositionsTableProps> = ({
  data,
  onRowSelect,
  selectedRows = new Set(),
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const parentRef = useRef<HTMLDivElement>(null);

  const columns = useMemo<ColumnDef<Position, any>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="rounded border-gray-300"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedRows.has(row.original.id)}
            onChange={() => onRowSelect?.(row.original)}
            className="rounded border-gray-300"
          />
        ),
        size: 50,
      },
      {
        accessorKey: 'symbol',
        header: 'Symbol',
        cell: (info) => (
          <span className="font-medium text-gray-900">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: (info) => (
          <span className="text-sm text-gray-600 truncate max-w-xs">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: (info) => (
          <span className="text-right font-mono">
            {(info.getValue() as number).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Avg Price',
        cell: (info) => (
          <span className="text-right font-mono">
            ${(info.getValue() as number).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'marketValue',
        header: 'Market Value',
        cell: (info) => (
          <span className="text-right font-mono">
            ${(info.getValue() as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ),
      },
      {
        accessorKey: 'gainDollar',
        header: 'P&L ($)',
        cell: (info) => {
          const value = info.getValue() as number;
          return (
            <span className={`text-right font-mono ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {value >= 0 ? '+' : ''}${value.toFixed(2)}
            </span>
          );
        },
      },
      {
        accessorKey: 'gainPercent',
        header: 'P&L (%)',
        cell: (info) => {
          const value = info.getValue() as number;
          // Handle edge cases for percentage calculation
          if (!isFinite(value) || isNaN(value)) {
            return <span className="text-gray-400">—</span>;
          }
          return (
            <span className={`text-right font-mono ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {value >= 0 ? '+' : ''}{value.toFixed(2)}%
            </span>
          );
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: (info) => (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeBadgeColor(info.getValue() as string)}`}>
            {(info.getValue() as string).toUpperCase()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(info.getValue() as string)}`}>
            {(info.getValue() as string).toUpperCase()}
          </span>
        ),
      },
    ],
    [selectedRows, onRowSelect]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimated row height
    overscan: 10,
  });

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        {table.getHeaderGroups().map(headerGroup => (
          <div key={headerGroup.id} className="flex">
            {headerGroup.headers.map(header => (
              <div
                key={header.id}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                style={{ width: header.getSize() }}
                onClick={header.column.getToggleSortingHandler()}
              >
                {header.isPlaceholder ? null : (
                  <div className="flex items-center space-x-1">
                    <span>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </span>
                    <span className="text-gray-400">
                      {{
                        asc: '↑',
                        desc: '↓',
                      }[header.column.getIsSorted() as string] ?? '↕'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Virtualized Table Body */}
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto"
        style={{ contain: 'strict' }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={row.id}
                className="flex items-center border-b border-gray-100 hover:bg-gray-50 absolute w-full"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                role="row"
                tabIndex={0}
              >
                {row.getVisibleCells().map(cell => (
                  <div
                    key={cell.id}
                    className="px-4 py-2 text-sm"
                    style={{ width: cell.column.getSize() }}
                    role="cell"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Table Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {rows.length} of {data.length} positions
          </div>
          <div className="text-sm text-gray-500">
            {selectedRows.size} selected
          </div>
        </div>
      </div>
    </div>
  );
};

function getTypeBadgeColor(type: string): string {
  switch (type) {
    case 'stock':
      return 'bg-blue-100 text-blue-800';
    case 'option':
      return 'bg-purple-100 text-purple-800';
    case 'future':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'open':
      return 'bg-green-100 text-green-800';
    case 'closed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
} 
 
 
 