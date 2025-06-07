# Unified Positions Dashboard – Architecture Guide

## Overview
A high-performance, WCAG-AA compliant dashboard for multi-broker trading data.  
Optimised for ≤ 850 kB gzipped bundle and 60 fps on 50 000-row tables.

## Layout & Tailwind
* Hero grid: `lg:grid-cols-12` → copy in **HeroStrip.tsx**  
* KPI cards: `grid grid-cols-2 md:grid-cols-4 gap-4`  
* Drag-and-drop zone: flex-center, conditional `bg-blue-50 border-blue-500` on drag

## Component Decisions
| Need | Library | Why |
|------|---------|-----|
| Virtualised table + sort | **TanStack Table v8** | feature-rich, hooks-first |
| Smooth scroll 10 k+ | **@tanstack/react-virtual** | zero-jank windowing |
| Heat-map | **@nivo/heatmap** | theming, dark-mode ready |

## Performance Patterns
* **Route & component code-splitting** via `React.lazy()` + `<Suspense>`  
* Skeleton fallback uses fixed `w-h` to kill CLS  
* Bundle analysis goal: **< 850 kB** (gzipped, `npm run build`)

## Data & Finance Utils
* `fifoLots(trades): Position[]` – FIFO cost basis with splits & partials  
* `kellyFraction(mu, sigma): number` – default to **½ Kelly** if > 0.5

## Accessibility
* TanStack rows rendered as ARIA `role="row"`; keyboard: Arrow ↑ ↓, Home/End, Space select  
* Color palette: ColorBrewer **BrBG** diverging for P/L (hex values in `tailwind.config.js`)  
* Contrast: text 4.5 : 1 (normal), 3 : 1 (≥ 18.66 px)

## Risk Metrics (Greeks)
Tooltip template:  
`Δ = $ change per +$1 underlying`  
Precision: Δ ± 0.001 | Γ ± 0.0001 | Θ ± $0.01/day | Vega ± $0.01/vol pt

## Testing Matrix
* **RTL** unit tests for utils  
* **Playwright** E2E: CSV upload, 10 k row scroll, compare modal  
* Snapshot exclude virtualised positioning 
 
 
 