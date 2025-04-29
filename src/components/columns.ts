// src/components/columns.ts
import { GridColDef, GridCellParams, GridValueFormatter } from '@mui/x-data-grid';
import { fmtUsd, fmtDate } from '../utils/formatters';

// helper for "–" when value === null || value === undefined
const dash = (v: unknown) => (v === null || v === undefined ? '–' : v);

export const TRADE_COLUMNS: GridColDef[] = [
  { field: 'id',        headerName: 'ID',        type: 'number', width: 70 },
  { field: 'symbol',    headerName: 'Symbol',                     flex: 1.4 },
  { field: 'dateTime',  headerName: 'Date / Time',
    flex: 1.2,
    valueFormatter: ((value) => dash(fmtDate(value as string))) as GridValueFormatter
  },
  { field: 'quantity',  headerName: 'Qty',       type: 'number', width: 80 },
  { field: 'proceeds',  headerName: 'Proceeds',  type: 'number',
    flex: 1,
    valueFormatter: ((value) => dash(fmtUsd(value as number))) as GridValueFormatter
  },
  { field: 'basis',     headerName: 'Basis',     type: 'number',
    flex: 1,
    valueFormatter: ((value) => dash(fmtUsd(value as number))) as GridValueFormatter
  },
  { field: 'commissionFee', headerName: 'Commission', type: 'number',
    flex: 1,
    valueFormatter: ((value) => dash(fmtUsd(value as number))) as GridValueFormatter
  },
  { field: 'realizedPL', headerName: 'Realized P&L', type: 'number',
    flex: 1,
    cellClassName: (params: GridCellParams) => ((params.value as number) ?? 0) >= 0 ? 'pnl-green' : 'pnl-red',
    valueFormatter: ((value) => dash(fmtUsd(value as number))) as GridValueFormatter
  },
  { field: 'tradePL',  headerName: 'Trade P&L', type: 'number',
    flex: 1,
    cellClassName: (params: GridCellParams) => ((params.value as number) ?? 0) >= 0 ? 'pnl-green' : 'pnl-red',
    valueFormatter: ((value) => dash(fmtUsd(value as number))) as GridValueFormatter
  }
]; 