# Sprint Checklist

| Epic | Task | File(s) | Owner | Est |
|------|------|---------|-------|-----|
| Layout | Hero + KPI cards | `HeroStrip.tsx`, `KpiCards.tsx` | FE | 1 d |
| Table | Virtualised positions | `VirtualPositionsTable.tsx` | FE | 2 d |
| Charts | Heat-map component | `StrategyHeatMap.tsx` | FE | 1 d |
| Perf | Lazy-load charts | dynamic imports | FE | 0.5 d |
| Finance | FIFO + Kelly utils | `fifo.ts`, `kelly.ts` | Shared | 1 d |
| A11y | ARIA grid keyboard | table hooks | FE | 1 d |
| QA | Drag-and-drop E2E | `upload.spec.ts` | QA | 1 d |

## Definition of Done
- Bundle ≤ 850 kB gzipped  
- Lighthouse ≥ 90 performance & accessibility  
- P&L % never NaN / Infinity  
- 50 000 rows scroll @ 60 fps desktop  

## Current Status
- [x] Audit existing dashboard architecture
- [x] Identify performance bottlenecks
- [x] Document component structure
- [ ] Implement virtualized table
- [ ] Add notification system with toggle
- [ ] Optimize bundle size
- [ ] Add comprehensive testing 
 
 
 