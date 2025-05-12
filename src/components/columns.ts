// src/components/columns.ts
import { GridColDef } from '@mui/x-data-grid';

// Robust currency formatter with type‑safety
const formatCurrency = (value: unknown, decimals = 2): string => {
  if (value === null || value === undefined) return '$0.00';
  const numeric = typeof value === 'string' ? parseFloat(value) : Number(value);
  return Number.isFinite(numeric) ? `$${numeric.toFixed(decimals)}` : '$0.00';
};

// Data shape for one trade row
export interface TradeRow {
  id: string | number;
  symbol: string;
  dateTime: string;
  quantity: number;
  proceeds: number;
  basis: number;
  commissionFee: number;
  realizedPL: number;
  unrealizedPL: number;
  tradePL: number;
}

// Helper to colour positive vs negative values in the grid
const profitClass = (params: { value?: any }) =>
  Number(params.value) >= 0 ? 'positive-value' : 'negative-value';

export const TRADE_COLUMNS: GridColDef<TradeRow>[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'symbol', headerName: 'Symbol', width: 180 },
  {
    field: 'dateTime',
    headerName: 'Date / Time',
    width: 180,
    valueFormatter: (p: { value?: any }) =>
      new Date(String(p.value ?? '').replace(',', '')).toLocaleString()
  },
  { field: 'quantity', headerName: 'Qty', width: 90, type: 'number' },
  {
    field: 'proceeds',
    headerName: 'Proceeds',
    width: 120,
    type: 'number',
    valueFormatter: (p: { value?: any }) => formatCurrency(p.value)
  },
  {
    field: 'basis',
    headerName: 'Basis',
    width: 120,
    type: 'number',
    valueFormatter: (p: { value?: any }) => formatCurrency(p.value)
  },
  {
    field: 'commissionFee',
    headerName: 'Commission Fee',
    width: 140,
    type: 'number',
    valueFormatter: (p: { value?: any }) => formatCurrency(p.value)
  },
  {
    field: 'realizedPL',
    headerName: 'Realized P&L',
    width: 140,
    type: 'number',
    valueFormatter: (p: { value?: any }) => formatCurrency(p.value),
    cellClassName: profitClass
  },
  {
    field: 'unrealizedPL',
    headerName: 'Unrealized P&L',
    width: 140,
    type: 'number',
    valueFormatter: (p: { value?: any }) => formatCurrency(p.value),
    cellClassName: profitClass
  },
  {
    field: 'tradePL',
    headerName: 'Trade P&L',
    width: 120,
    type: 'number',
    valueFormatter: (p: { value?: any }) => formatCurrency(p.value),
    cellClassName: profitClass
  }
]; 