import { saveAs } from "file-saver";
import Papa from "papaparse";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Tooltip as ReactTooltip } from "react-tooltip";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Bar as InsightsBar,
  BarChart as InsightsBarChart,
  CartesianGrid as InsightsCartesianGrid,
  ResponsiveContainer as InsightsResponsiveContainer,
  Tooltip as InsightsTooltip,
  XAxis as InsightsXAxis,
  YAxis as InsightsYAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { computeFeaturesForBatch } from "../../../features";
import TradeTable from "../../../features/trading/components/TradeTable";
import CumulativePnlChart from "../../../shared/components/visualizations/CumulativePnlChart";
import { getDb, getTrades } from "../../../shared/services/DatabaseService";
import { PredictResponse } from "../../../shared/services/HMMService"; // Import HMM service functions and types
import {
  VolatilityRegime,
  calculateCurrentVolatilityRegime,
} from "../../../shared/services/MarketAnalysisService";
import { OptionStrategy, OptionTrade } from "../../../types/options";

// Define a type for summary metrics
interface TradeSummaryMetrics {
  totalTrades: number;
  totalPL: number;
  winRate: number;
  winningTrades: number;
  losingTrades: number;
  averageProfit: number;
  averageLoss: number;
  pnlByStrategy: Record<string, { totalPL: number; count: number }>;
}

const HMM_BACKEND_URL = "http://127.0.0.1:5001";

// Modal for trade details
function TradeDetailModal({
  open,
  onClose,
  trade,
  features,
}: {
  open: boolean;
  onClose: () => void;
  trade: any;
  features: any;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  // Focus trap and ESC close
  useEffect(() => {
    if (open && modalRef.current) {
      modalRef.current.focus();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      window.addEventListener("keydown", handleKey);
    }
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);
  if (!open || !trade) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      role="dialog"
      aria-modal="true"
      aria-label="Trade details"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded shadow-lg p-6 max-w-lg w-full relative outline-none"
      >
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close details"
        >
          ×
        </button>
        <h3 className="text-lg font-semibold mb-2">Trade Details</h3>
        <div className="mb-2 text-sm text-gray-700">
          <div>
            <b>ID:</b> {trade.id}
          </div>
          <div>
            <b>Symbol:</b> {trade.symbol}
          </div>
          <div>
            <b>Status:</b> {trade.status}
          </div>
          <div>
            <b>P&L:</b> {trade.tradePL}
          </div>
          <div>
            <b>Streak:</b> {features?.streak}
          </div>
          <div>
            <b>Market Regime:</b> {features?.marketRegime}
          </div>
        </div>
        <h4 className="font-semibold mt-4 mb-1">Feature Breakdown</h4>
        <table className="min-w-full text-xs border">
          <tbody>
            {features &&
              Object.entries(features).map(([k, v]) => (
                <tr key={k}>
                  <td className="border px-2 py-1 font-medium">{k}</td>
                  <td className="border px-2 py-1">{String(v)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const AITradeAnalysis: React.FC = () => {
  const [trades, setTrades] = useState<OptionTrade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMarketRegime, setCurrentMarketRegime] =
    useState<VolatilityRegime>(VolatilityRegime.UNKNOWN);
  const [regimeHistory, setRegimeHistory] = useState<
    { date: string; regimeValue: number; regimeLabel: string }[]
  >([]);

  const [hmmMarketDataFile, setHmmMarketDataFile] = useState<File | null>(null);

  // State for evaluation
  const [evaluationResults, setEvaluationResults] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // State for ML Ensemble
  const [mlEnsembleStatus, setMlEnsembleStatus] = useState<any>(null);
  const [mlTraining, setMlTraining] = useState(false);
  const [mlTrainingResults, setMlTrainingResults] = useState<any>(null);
  const [mlPredictions, setMlPredictions] = useState<any>(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState<string | null>(null);

  // State for HMM outputs and status
  const [hmmPredictedRegimes, setHmmPredictedRegimes] =
    useState<PredictResponse | null>(null);

  // State for downloaded data preview
  const [downloadedData, setDownloadedData] = useState<{
    source: string;
    data: any[];
    filename: string;
    dateRange?: any;
  } | null>(null);

  // State for managing multiple datasets
  const [spyData, setSpyData] = useState<{
    data: string;
    filename: string;
    dateRange?: any;
  } | null>(null);
  const [vixData, setVixData] = useState<{
    data: string;
    filename: string;
    dateRange?: any;
  } | null>(null);
  const [combinedData, setCombinedData] = useState<{
    data: string;
    filename: string;
  } | null>(null);

  // New state for market data file path
  const marketDataFileInputRef = useRef<HTMLInputElement>(null);

  const [hmmServiceStatus, setHmmServiceStatus] = useState<
    "checking" | "connected" | "not_running"
  >("checking");
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Compute features for all trades (batch)
  const [features, setFeatures] = useState<any[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [featuresError, setFeaturesError] = useState<string | null>(null);
  useEffect(() => {
    setFeaturesLoading(true);
    setFeaturesError(null);
    if (trades.length > 0) {
      computeFeaturesForBatch(trades as any)
        .then(setFeatures)
        .catch((e) => setFeaturesError("Failed to compute features."))
        .finally(() => setFeaturesLoading(false));
    } else {
      setFeatures([]);
      setFeaturesLoading(false);
    }
  }, [trades]);

  // Win Zone: trades with win streak >= 2
  const winZoneTrades = useMemo(
    () => features.filter((f) => typeof f.streak === "number" && f.streak >= 2),
    [features]
  );

  // Feature importances (from model, if available)
  const [featureImportances, setFeatureImportances] = useState<any[]>([]);
  useEffect(() => {
    // Try to load feature importances from data/features.json or model output
    fetch("/data/features.json")
      .then((r) => r.json())
      .then((data) => {
        if (
          Array.isArray(data) &&
          data.length > 0 &&
          data[0].featureImportances
        ) {
          setFeatureImportances(data[0].featureImportances);
        } else {
          setFeatureImportances([]);
        }
      })
      .catch(() => setFeatureImportances([]));
  }, []);

  useEffect(() => {
    const loadTradesAndAnalyseRegime = async () => {
      try {
        setLoading(true);
        await getDb();
        const fetchedTrades = await getTrades();

        const formattedTrades = fetchedTrades.map((t: any) => ({
          ...t,
          id: String(t.id),
          symbol: String(t.symbol),
          putCall: t.putCall as "PUT" | "CALL",
          strike: Number(t.strikePrice),
          expiry: new Date(t.expiryDate),
          quantity: Number(t.quantity),
          premium: Number(t.tradePrice),
          openDate: new Date(t.tradeDate),
          closeDate: t.closeDate ? new Date(t.closeDate) : undefined,
          closePremium: t.closePremium ? Number(t.closePremium) : undefined,
          strategy: (t.strategy as OptionStrategy) || OptionStrategy.OTHER,
          commission: Number(t.commission) || 0,
          tradePL: Number(t.netAmount) || 0,
          status: t.openCloseIndicator === "C" ? "Closed" : "Open",
        })) as OptionTrade[];

        setTrades(formattedTrades);

        // Prepare data for regime analysis
        const priceSeriesForRegime = formattedTrades
          .filter(
            (t) =>
              t.status === "Closed" &&
              t.closeDate != null &&
              typeof t.closePremium === "number"
          )
          .map((t) => ({
            date: new Date(t.closeDate!),
            price: t.closePremium!,
          }))
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        if (priceSeriesForRegime.length > 0) {
          // Calculate current regime
          const currentRegimeCalc =
            calculateCurrentVolatilityRegime(priceSeriesForRegime);
          setCurrentMarketRegime(currentRegimeCalc);

          // Calculate regime history (last 30 data points)
          const historyPoints = 30;
          const regimeConfig = {
            windowSize: 20,
            lowPercentile: 25,
            highPercentile: 75,
            minDataForPercentile: 30,
          };
          const calculatedHistory: {
            date: string;
            regimeValue: number;
            regimeLabel: string;
          }[] = [];

          // Ensure we have enough data for at least one calculation plus history
          const startCalcIndex = Math.max(
            regimeConfig.windowSize,
            priceSeriesForRegime.length - historyPoints
          );

          for (let k = startCalcIndex; k < priceSeriesForRegime.length; k++) {
            const historicalPricesUpToK = priceSeriesForRegime.slice(0, k + 1);
            if (historicalPricesUpToK.length >= regimeConfig.windowSize + 1) {
              const regimeAtK = calculateCurrentVolatilityRegime(
                historicalPricesUpToK,
                regimeConfig
              );
              calculatedHistory.push({
                date: priceSeriesForRegime[k].date.toISOString().split("T")[0],
                regimeValue: regimeToNumericValue(regimeAtK),
                regimeLabel: regimeAtK,
              });
            }
          }
          // If history is longer than 30 points due to startCalcIndex logic, take the last 30.
          setRegimeHistory(calculatedHistory.slice(-historyPoints));
        } else {
          setCurrentMarketRegime(VolatilityRegime.UNKNOWN);
          setRegimeHistory([]);
        }
        setError(null);
      } catch (err) {
        console.error("Error loading trades or calculating regime:", err);
        setError("Failed to load trade data or calculate market regime.");
        setCurrentMarketRegime(VolatilityRegime.UNKNOWN);
        setRegimeHistory([]);
      } finally {
        setLoading(false);
      }
    };
    loadTradesAndAnalyseRegime();
  }, []);

  useEffect(() => {
    // Check backend status on mount
    const checkBackend = async () => {
      try {
        const resp = await fetch(`${HMM_BACKEND_URL}/`, { method: "GET" });
        if (resp.ok || resp.status === 404) {
          setHmmServiceStatus("connected");
        } else {
          setHmmServiceStatus("not_running");
        }
      } catch {
        setHmmServiceStatus("not_running");
      }
    };
    checkBackend();
  }, []);

  // Handlers for file input changes
  const handleMarketDataFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setHmmMarketDataFile(file);
    } else {
      setHmmMarketDataFile(null);
    }
  };

  const handlePrediction = (data: PredictResponse) => {
    setHmmPredictedRegimes(data);
  };

  const summaryMetrics = useMemo((): TradeSummaryMetrics | null => {
    if (trades.length === 0) return null;

    let totalPL = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    const pnlByStrategy: Record<string, { totalPL: number; count: number }> =
      {};

    const closedTrades = trades.filter(
      (t) => t.status === "Closed" && t.tradePL !== undefined
    );

    closedTrades.forEach((trade) => {
      const pl = trade.tradePL!;
      totalPL += pl;
      if (pl > 0) {
        winningTrades++;
        totalProfit += pl;
      } else if (pl < 0) {
        losingTrades++;
        totalLoss += pl;
      }

      const strategyKey = trade.strategy || OptionStrategy.OTHER;
      if (!pnlByStrategy[strategyKey]) {
        pnlByStrategy[strategyKey] = { totalPL: 0, count: 0 };
      }
      pnlByStrategy[strategyKey].totalPL += pl;
      pnlByStrategy[strategyKey].count++;
    });

    const totalClosedTrades = winningTrades + losingTrades;
    const winRate =
      totalClosedTrades > 0 ? (winningTrades / totalClosedTrades) * 100 : 0;
    const averageProfit = winningTrades > 0 ? totalProfit / winningTrades : 0;
    const averageLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;

    return {
      totalTrades: trades.length,
      totalPL,
      winRate,
      winningTrades,
      losingTrades,
      averageProfit,
      averageLoss,
      pnlByStrategy,
    };
  }, [trades]);

  // Helper for regime styling
  const getRegimeClasses = (regime: VolatilityRegime): string => {
    switch (regime) {
      case VolatilityRegime.HIGH:
        return "text-red-700 bg-red-100 border-red-300";
      case VolatilityRegime.MEDIUM:
        return "text-yellow-700 bg-yellow-100 border-yellow-300";
      case VolatilityRegime.LOW:
        return "text-green-700 bg-green-100 border-green-300";
      default:
        return "text-gray-700 bg-gray-100 border-gray-300";
    }
  };

  const regimeToNumericValue = (regime: VolatilityRegime): number => {
    switch (regime) {
      case VolatilityRegime.HIGH:
        return 3;
      case VolatilityRegime.MEDIUM:
        return 2;
      case VolatilityRegime.LOW:
        return 1;
      default:
        return 0;
    }
  };

  // Helper to map HMM regime labels to numeric values for chart
  const hmmRegimeLabelToNumericValue = (label: string): number => {
    switch (label) {
      case "HighVol":
        return 3;
      case "MediumVol":
        return 2;
      case "LowVol":
        return 1;
      default:
        return 0; // Map unknown or other labels to 0
    }
  };

  // Function to combine SPY and VIX data for enhanced HMM training
  const combineSpyAndVixData = () => {
    if (!spyData || !vixData) {
      setCombinedData(null);
      return;
    }

    try {
      // Parse both datasets
      const spyRows = spyData.data.split("\n").filter((row) => row.trim());
      const vixRows = vixData.data.split("\n").filter((row) => row.trim());

      // Extract headers and data
      const spyHeader = spyRows[0].split(",");
      const vixHeader = vixRows[0].split(",");

      // Create combined header: SPY columns + VIX columns (prefixed with VIX_)
      const combinedHeader = [
        ...spyHeader,
        ...vixHeader.slice(1).map((col) => `VIX_${col}`), // Skip VIX Date column, prefix others
      ].join(",");

      // Create a map of VIX data by date for efficient lookup
      const vixDataMap = new Map();
      for (let i = 1; i < vixRows.length; i++) {
        const vixCols = vixRows[i].split(",");
        if (vixCols.length >= 2 && vixCols[0].trim()) {
          const date = vixCols[0].trim();
          // Skip any rows with invalid or empty dates
          if (date && !date.includes("undefined") && date.length >= 8) {
            vixDataMap.set(date, vixCols.slice(1)); // Store all VIX columns except date
          }
        }
      }

      // Combine data row by row
      const combinedRows = [combinedHeader];
      let matchedRows = 0;

      for (let i = 1; i < spyRows.length; i++) {
        const spyCols = spyRows[i].split(",");
        if (spyCols.length >= 2 && spyCols[0].trim()) {
          const date = spyCols[0].trim();
          // Skip any rows with invalid or empty dates
          if (!date || date.includes("undefined") || date.length < 8) {
            continue;
          }

          const vixCols = vixDataMap.get(date);

          if (
            vixCols &&
            vixCols.length > 0 &&
            !vixCols[0].includes("undefined")
          ) {
            // Combine SPY and VIX data for this date
            const combinedRow = [...spyCols, ...vixCols].join(",");
            combinedRows.push(combinedRow);
            matchedRows++;
          } else {
            // If no VIX data for this date, fill with empty values
            const emptyVixCols = new Array(vixHeader.length - 1).fill("");
            const combinedRow = [...spyCols, ...emptyVixCols].join(",");
            combinedRows.push(combinedRow);
          }
        }
      }

      const combinedCsv = combinedRows.join("\n");
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `SPY_VIX_Combined_${timestamp}.csv`;

      setCombinedData({
        data: combinedCsv,
        filename: filename,
      });

      // Show preview of combined data
      const parsedCombined = Papa.parse(combinedCsv, { header: true }).data;
      setDownloadedData({
        source: "Combined SPY + VIX",
        data: parsedCombined.slice(0, 20),
        filename: filename,
        dateRange: {
          start: spyData.dateRange?.start || "Historical",
          end: spyData.dateRange?.end || "Recent",
        },
      });

      // Download the combined file
      const blob = new Blob([combinedCsv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, filename);

      alert(
        `✅ Combined dataset created successfully!\n\n📊 ${matchedRows} rows with both SPY and VIX data\n📁 File: ${filename}\n\n🚀 Ready for enhanced HMM training with volatility analysis!`
      );
    } catch (error) {
      console.error("Error combining SPY and VIX data:", error);
      alert(`Error combining data: ${(error as Error).message}`);
    }
  };

  // Prepare HMM prediction data for the chart
  const hmmChartData = useMemo(() => {
    if (!hmmPredictedRegimes || !hmmPredictedRegimes.regimeHistory) return [];
    return hmmPredictedRegimes.regimeHistory.map((item) => ({
      date: item.date,
      regimeLabel: item.regime,
      regimeValue: hmmRegimeLabelToNumericValue(item.regime),
    }));
  }, [hmmPredictedRegimes]);

  // Export trades as CSV
  const handleExportTrades = () => {
    const csv = Papa.unparse(trades);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "trades_export.csv");
  };

  // Helper to download VIX data from IBKR (VOLATILITY INDEX)
  const handleDownloadVIXDataIBKR = async () => {
    try {
      if ((window as any).electronAPI?.downloadIBKRVIXData) {
        console.log("Using IBKR API to download VIX historical data...");
        const result = await (window as any).electronAPI.downloadIBKRVIXData({
          duration: "2 Y", // 2 years of data
          barSize: "1 day", // Daily bars
        });

        console.log("VIX IBKR API result:", result);
        console.log("VIX IBKR API result success:", result.success);
        console.log("VIX IBKR API result data exists:", !!result.data);
        console.log("VIX IBKR API result keys:", Object.keys(result));

        if (result.success && result.data) {
          console.log("Raw VIX CSV data length:", result.data.length);
          console.log(
            "Raw VIX CSV data preview:",
            result.data.substring(0, 500)
          );

          // Store VIX data for potential combination
          setVixData({
            data: result.data,
            filename: result.filename || "VIX_IBKR_data.csv",
            dateRange: result.dateRange,
          });

          // Parse CSV data for preview
          const parsedData = Papa.parse(result.data, { header: true }).data;
          console.log("Parsed VIX data:", parsedData.slice(0, 5));
          console.log("Parsed VIX data length:", parsedData.length);

          setDownloadedData({
            source: result.source || "IBKR VIX",
            data: parsedData.slice(0, 20), // Show first 20 rows
            filename: result.filename || "VIX_IBKR_data.csv",
            dateRange: result.dateRange,
          });
          console.log("VIX State set! Data preview should show now.");

          const blob = new Blob([result.data], {
            type: "text/csv;charset=utf-8;",
          });
          saveAs(blob, result.filename || "VIX_IBKR_data.csv");
          alert(
            `VIX data downloaded successfully from ${result.source}! ${result.dataPoints} data points from ${result.dateRange?.start} to ${result.dateRange?.end}`
          );
        } else {
          console.error("VIX download failed:", result.error);
          alert(`Failed to download VIX data: ${result.error}`);
        }
      } else {
        alert(
          "VIX download function not available. Please ensure IBKR is connected."
        );
      }
    } catch (error) {
      console.error("Error downloading VIX data:", error);
      alert(`Error downloading VIX data: ${(error as Error).message}`);
    }
  };

  // Helper to download SPY data from IBKR (PROFESSIONAL)
  const handleDownloadSpyDataIBKR = async () => {
    try {
      if ((window as any).electronAPI?.downloadIBKRHistoricalData) {
        console.log("Using IBKR API to download SPY historical data...");
        const result = await (
          window as any
        ).electronAPI.downloadIBKRHistoricalData({
          symbol: "SPY",
          duration: "2 Y", // 2 years of data
          barSize: "1 day", // Daily bars
        });

        console.log("IBKR API result:", result);
        console.log("IBKR API result success:", result.success);
        console.log("IBKR API result data exists:", !!result.data);
        console.log("IBKR API result keys:", Object.keys(result));

        if (result.success && result.data) {
          console.log("Raw CSV data length:", result.data.length);
          console.log("Raw CSV data preview:", result.data.substring(0, 500));

          // Store SPY data for potential combination
          setSpyData({
            data: result.data,
            filename: result.filename || "SPY_IBKR_data.csv",
            dateRange: result.dateRange,
          });

          // Parse CSV data for preview
          const parsedData = Papa.parse(result.data, { header: true }).data;
          console.log("Parsed data:", parsedData.slice(0, 5));
          console.log("Parsed data length:", parsedData.length);
          console.log("About to set downloadedData state...");

          setDownloadedData({
            source: result.source || "IBKR",
            data: parsedData.slice(0, 20), // Show first 20 rows
            filename: result.filename || "SPY_IBKR_data.csv",
            dateRange: result.dateRange,
          });
          console.log("State set! Data preview should show now.");

          const blob = new Blob([result.data], {
            type: "text/csv;charset=utf-8;",
          });
          saveAs(blob, result.filename || "SPY_IBKR_data.csv");
          alert(
            `SPY data downloaded successfully from ${result.source}! ${result.dataPoints} data points from ${result.dateRange?.start} to ${result.dateRange?.end}`
          );
        } else {
          console.error("IBKR download failed:", result);
          alert(
            `Failed to download SPY data from IBKR: ${
              result.error || "Unknown error"
            }`
          );
        }
      } else {
        alert(
          "IBKR download not available. Make sure Electron is running and IBKR is connected."
        );
      }
    } catch (error) {
      console.error("Error downloading SPY data from IBKR:", error);
      alert("Error downloading SPY data from IBKR. Check console for details.");
    }
  };

  // Helper to download SPY data from Alpha Vantage (RELIABLE)
  const handleDownloadSpyDataAlphaVantage = async () => {
    try {
      if ((window as any).electronAPI?.downloadAlphaVantageData) {
        console.log(
          "Using Electron API to download SPY data from Alpha Vantage..."
        );
        const result = await (
          window as any
        ).electronAPI.downloadAlphaVantageData({
          symbol: "SPY",
          outputsize: "full", // Get full historical data
        });

        if (result.success && result.data) {
          // Store SPY data for potential combination
          setSpyData({
            data: result.data,
            filename: result.filename || "SPY_alpha_vantage_data.csv",
            dateRange: result.dateRange,
          });

          // Parse CSV data for preview
          const parsedData = Papa.parse(result.data, { header: true }).data;
          setDownloadedData({
            source: result.source || "Alpha Vantage",
            data: parsedData.slice(0, 20), // Show first 20 rows
            filename: result.filename || "SPY_alpha_vantage_data.csv",
            dateRange: result.dateRange,
          });

          const blob = new Blob([result.data], {
            type: "text/csv;charset=utf-8;",
          });
          saveAs(blob, result.filename || "SPY_alpha_vantage_data.csv");
          alert(
            `SPY data downloaded successfully from ${result.source}! Historical data through ${result.dateRange?.end}`
          );
        } else {
          console.error("Alpha Vantage download failed:", result.error);
          alert(
            `Failed to download SPY data from Alpha Vantage: ${
              result.error || "Unknown error"
            }`
          );
        }
      } else {
        alert(
          "Alpha Vantage download not available. Make sure Electron is running."
        );
      }
    } catch (error) {
      console.error("Error downloading SPY data from Alpha Vantage:", error);
      alert(
        "Error downloading SPY data from Alpha Vantage. Check console for details."
      );
    }
  };

  // Helper to download SPY data from Yahoo Finance (FREE and current)
  const handleDownloadSpyDataYahoo = async () => {
    try {
      // Use Electron API to bypass CORS
      if ((window as any).electronAPI?.downloadSpyData) {
        console.log("Using Electron API to download SPY data...");
        const result = await (window as any).electronAPI.downloadSpyData({
          symbol: "SPY",
          years: 2, // Get 2 years of data
        });

        if (result.success && result.data) {
          // Store SPY data for potential combination
          setSpyData({
            data: result.data,
            filename: result.filename || "SPY_data.csv",
            dateRange: result.dateRange,
          });

          // Parse CSV data for preview
          const parsedData = Papa.parse(result.data, { header: true }).data;
          setDownloadedData({
            source: "Yahoo Finance",
            data: parsedData.slice(0, 20), // Show first 20 rows
            filename: result.filename || "SPY_data.csv",
            dateRange: result.dateRange,
          });

          const blob = new Blob([result.data], {
            type: "text/csv;charset=utf-8;",
          });
          saveAs(blob, result.filename || "SPY_data.csv");
          alert(
            `SPY data downloaded successfully! Range: ${result.dateRange?.start} to ${result.dateRange?.end}`
          );
        } else {
          console.error("Download failed:", result.error);
          alert(
            `Failed to download SPY data: ${result.error || "Unknown error"}`
          );
        }
      } else {
        // Fallback to fetch (will still have CORS issues in browser)
        console.warn(
          "Electron API not available, falling back to fetch (may have CORS issues)"
        );
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 2);
        const endDate = new Date();

        const period1 = Math.floor(startDate.getTime() / 1000);
        const period2 = Math.floor(endDate.getTime() / 1000);

        const url = `https://query1.finance.yahoo.com/v7/finance/download/SPY?period1=${period1}&period2=${period2}&interval=1d&events=history&includeAdjustedClose=true`;

        const response = await fetch(url);
        if (!response.ok) {
          alert("Failed to download SPY data from Yahoo Finance.");
          return;
        }

        const csvText = await response.text();
        const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
        saveAs(
          blob,
          `SPY_${startDate.toISOString().split("T")[0]}_to_${
            endDate.toISOString().split("T")[0]
          }.csv`
        );
        alert(
          `SPY data downloaded successfully! Range: ${
            startDate.toISOString().split("T")[0]
          } to ${endDate.toISOString().split("T")[0]}`
        );
      }
    } catch (error) {
      console.error("Error downloading SPY data:", error);
      alert("Error downloading SPY data. Check console for details.");
    }
  };

  // Helper to download SPY data from Polygon.io
  const handleDownloadSpyDataPolygon = async () => {
    const apiKey = "wSrCptEsGIDm3TywC0AT0P7Bk_ooreDR";
    const symbol = "SPY";
    const from = "2021-01-01";
    const to = "2024-12-31";
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${from}/${to}?adjusted=true&sort=asc&apiKey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      alert("Failed to download SPY data from Polygon.");
      return;
    }
    const json = await response.json();
    if (!json.results) {
      alert("No results from Polygon API.");
      return;
    }
    const header = "date,open,high,low,close,volume\n";
    const rows = json.results.map((row: any) => {
      const date = new Date(row.t).toISOString().split("T")[0];
      return [date, row.o, row.h, row.l, row.c, row.v].join(",");
    });
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "SPY_history_polygon.csv");
  };

  const [insightsFilter, setInsightsFilter] = useState("");
  const [insightsSort, setInsightsSort] = useState<"asc" | "desc">("desc");
  const [selectedTradeIdx, setSelectedTradeIdx] = useState<number | null>(null);

  // Filter and sort features for Strategy Insights
  const filteredFeatures = features
    .filter(
      (f) =>
        !insightsFilter ||
        (f.symbol &&
          f.symbol.toLowerCase().includes(insightsFilter.toLowerCase()))
    )
    .sort((a, b) =>
      insightsSort === "asc"
        ? (a.streak ?? 0) - (b.streak ?? 0)
        : (b.streak ?? 0) - (a.streak ?? 0)
    );

  // ML Ensemble Functions
  const fetchMLStatus = async () => {
    try {
      const response = await fetch(`${HMM_BACKEND_URL}/ml/status`);
      const data = await response.json();
      setMlEnsembleStatus(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch ML status:", error);
      setMlError("Failed to fetch ML ensemble status");
      return null;
    }
  };

  const handleTrainMLEnsemble = async (optimizeHyperparams = false) => {
    setMlTraining(true);
    setMlError(null);
    setMlTrainingResults(null);

    try {
      const response = await fetch(`${HMM_BACKEND_URL}/ml/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: "SPY", // Default to SPY for now
          optimize_hyperparams: optimizeHyperparams,
          n_trials: optimizeHyperparams ? 20 : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMlTrainingResults(data);
        await fetchMLStatus(); // Refresh status
      } else {
        setMlError(data.error || "ML training failed");
      }
    } catch (error) {
      console.error("ML training error:", error);
      setMlError("Failed to train ML ensemble");
    } finally {
      setMlTraining(false);
    }
  };

  const handleMLPrediction = async () => {
    setMlLoading(true);
    setMlError(null);
    setMlPredictions(null);

    try {
      const requestBody: any = {
        symbol: "SPY", // Default to SPY for now
        n_predictions: 10,
      };

      // Use the latest model if available
      if (mlTrainingResults?.model_path) {
        requestBody.model_path = mlTrainingResults.model_path;
      }

      const response = await fetch(`${HMM_BACKEND_URL}/ml/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        setMlPredictions(data);
      } else {
        setMlError(data.error || "ML prediction failed");
      }
    } catch (error) {
      console.error("ML prediction error:", error);
      setMlError("Failed to get ML predictions");
    } finally {
      setMlLoading(false);
    }
  };

  // Load ML status on component mount
  useEffect(() => {
    fetchMLStatus();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">AI Trade Analysis</h1>

      {loading && (
        <div className="p-4 border rounded shadow-sm bg-white text-center">
          <p className="text-lg text-gray-500">Loading trade data...</p>
        </div>
      )}
      {error && (
        <div className="p-4 border rounded shadow-sm bg-red-100 text-red-700">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      <div className="flex items-center space-x-4 mb-2">
        <span className="text-lg font-semibold">HMM Service Status:</span>
        {hmmServiceStatus === "checking" && (
          <span className="px-2 py-1 rounded bg-gray-200 text-gray-700">
            Checking...
          </span>
        )}
        {hmmServiceStatus === "connected" && (
          <span className="px-2 py-1 rounded bg-green-200 text-green-800">
            🟢 Connected
          </span>
        )}
        {hmmServiceStatus === "not_running" && (
          <span className="px-2 py-1 rounded bg-red-200 text-red-800">
            🔴 Not Running
          </span>
        )}
        <button
          onClick={() => setShowTroubleshooting((v) => !v)}
          className="ml-4 text-blue-600 underline text-sm"
        >
          Troubleshooting
        </button>
      </div>
      {hmmServiceStatus === "not_running" && (
        <div className="p-3 border rounded bg-yellow-50 text-yellow-900 mb-4">
          <p className="mb-2">
            HMM Service is not running. To enable ML analysis, open a terminal
            and run:
          </p>
          <div className="flex items-center space-x-2">
            <code className="bg-gray-100 px-2 py-1 rounded">
              cd hmm-service &amp;&amp; python3 app.py
            </code>
            <CopyToClipboard text="cd hmm-service &amp;&amp; python3 app.py">
              <button className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
                Copy Command
              </button>
            </CopyToClipboard>
          </div>
        </div>
      )}
      {showTroubleshooting && (
        <div className="p-3 border rounded bg-gray-50 text-gray-800 mb-4">
          <h3 className="font-semibold mb-2">Troubleshooting HMM Service</h3>
          <ul className="list-disc pl-5 text-sm mb-2">
            <li>Make sure Python 3 is installed.</li>
            <li>Open a terminal in your project root.</li>
            <li>
              Run <code>cd hmm-service &amp;&amp; python3 app.py</code> to start
              the backend.
            </li>
            <li>
              Wait for the message:{" "}
              <code>Running on http://127.0.0.1:5001/</code>
            </li>
            <li>Refresh this page after starting the service.</li>
          </ul>
          <p className="text-xs text-gray-500">
            For more help, see <code>docs/hmm-service-setup.txt</code>.
          </p>
        </div>
      )}

      {/* HMM Controls Section - Temporarily Removed for Refactoring */}
      <div className="p-4 border rounded shadow-sm bg-white">
        <h2 className="text-xl font-semibold mb-3">
          🚧 HMM Controls (Under Development)
        </h2>
        <p className="text-gray-600">
          The HMM training and prediction controls are being refactored into
          modular components. This section will be restored with improved UI/UX
          shortly.
        </p>
        {/* HMM Status and Results Area */}
        {(hmmPredictedRegimes || isEvaluating || evaluationResults) && (
          <div className="mt-4 p-3 border rounded bg-gray-50">
            {isEvaluating && (
              <p className="text-purple-600">
                Evaluating VIX impact on model performance...
              </p>
            )}
            {/* Show training status after completion */}
            {/* VIX Evaluation Results */}
            {evaluationResults && evaluationResults.success && (
              <div className="mt-4 p-4 border rounded bg-white">
                <h3 className="text-lg font-semibold mb-3">
                  📊 VIX Integration Evaluation Results
                </h3>

                {/* Overall Improvement Summary */}
                <div className="mb-4 p-3 bg-blue-50 rounded">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Overall Performance Impact
                  </h4>
                  <div className="text-2xl font-bold text-blue-700">
                    {(evaluationResults.evaluation_summary
                      ?.overall_improvement || 0) > 0
                      ? "+"
                      : ""}
                    {(
                      evaluationResults.evaluation_summary
                        ?.overall_improvement || 0
                    ).toFixed(2)}
                    % Improvement
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    {evaluationResults.evaluation_summary
                      ?.statistical_significance?.is_significant
                      ? "✅ Statistically significant improvement"
                      : "⚠️ Improvement not statistically significant"}
                  </p>
                </div>

                {/* Metrics Comparison Table */}
                {evaluationResults.evaluation_summary?.metrics_comparison && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">
                      Performance Metrics Comparison
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="border px-3 py-2 text-left">
                              Metric
                            </th>
                            <th className="border px-3 py-2 text-center">
                              Without VIX
                            </th>
                            <th className="border px-3 py-2 text-center">
                              With VIX
                            </th>
                            <th className="border px-3 py-2 text-center">
                              Improvement
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {evaluationResults.evaluation_summary
                            .metrics_comparison?.no_vix &&
                            Object.entries(
                              evaluationResults.evaluation_summary
                                .metrics_comparison.no_vix
                            ).map(([metric, noVixValue]) => {
                              const withVixValue =
                                evaluationResults.evaluation_summary
                                  .metrics_comparison.with_vix[metric];
                              const improvement =
                                evaluationResults.evaluation_summary
                                  .metrics_comparison.improvement[metric];
                              const noVixNum =
                                typeof noVixValue === "number" ? noVixValue : 0;
                              const withVixNum =
                                typeof withVixValue === "number"
                                  ? withVixValue
                                  : 0;
                              const improvementNum =
                                typeof improvement === "number"
                                  ? improvement
                                  : 0;
                              return (
                                <tr key={metric} className="hover:bg-gray-50">
                                  <td className="border px-3 py-2 font-medium capitalize">
                                    {metric.replace("_", " ")}
                                  </td>
                                  <td className="border px-3 py-2 text-center">
                                    {noVixNum.toFixed(4)}
                                  </td>
                                  <td className="border px-3 py-2 text-center">
                                    {withVixNum.toFixed(4)}
                                  </td>
                                  <td
                                    className={`border px-3 py-2 text-center font-medium ${
                                      improvementNum > 0
                                        ? "text-green-600"
                                        : improvementNum < 0
                                        ? "text-red-600"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {improvementNum > 0 ? "+" : ""}
                                    {improvementNum.toFixed(2)}%
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Cross-Validation Results */}
                {evaluationResults.evaluation_summary
                  ?.cross_validation_summary && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">
                      Cross-Validation Results
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded">
                        <h5 className="font-medium text-gray-700">
                          Without VIX
                        </h5>
                        <div className="text-sm">
                          <div>
                            Accuracy:{" "}
                            {evaluationResults.evaluation_summary.cross_validation_summary.no_vix?.accuracy?.mean?.toFixed(
                              4
                            )}{" "}
                            (±
                            {evaluationResults.evaluation_summary.cross_validation_summary.no_vix?.accuracy?.std?.toFixed(
                              4
                            )}
                            )
                          </div>
                          <div>
                            F1 Score:{" "}
                            {evaluationResults.evaluation_summary.cross_validation_summary.no_vix?.f1_score?.mean?.toFixed(
                              4
                            )}{" "}
                            (±
                            {evaluationResults.evaluation_summary.cross_validation_summary.no_vix?.f1_score?.std?.toFixed(
                              4
                            )}
                            )
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded">
                        <h5 className="font-medium text-blue-700">With VIX</h5>
                        <div className="text-sm">
                          <div>
                            Accuracy:{" "}
                            {evaluationResults.evaluation_summary.cross_validation_summary.with_vix?.accuracy?.mean?.toFixed(
                              4
                            )}{" "}
                            (±
                            {evaluationResults.evaluation_summary.cross_validation_summary.with_vix?.accuracy?.std?.toFixed(
                              4
                            )}
                            )
                          </div>
                          <div>
                            F1 Score:{" "}
                            {evaluationResults.evaluation_summary.cross_validation_summary.with_vix?.f1_score?.mean?.toFixed(
                              4
                            )}{" "}
                            (±
                            {evaluationResults.evaluation_summary.cross_validation_summary.with_vix?.f1_score?.std?.toFixed(
                              4
                            )}
                            )
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Statistical Significance */}
                {evaluationResults.evaluation_summary
                  ?.statistical_significance && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <h4 className="font-semibold mb-2">
                      Statistical Significance Test
                    </h4>
                    <div className="text-sm">
                      <div>
                        McNemar's Test P-value:{" "}
                        {evaluationResults.evaluation_summary.statistical_significance.mcnemar_p_value?.toFixed(
                          6
                        )}
                      </div>
                      <div className="mt-2 font-medium">
                        {
                          evaluationResults.evaluation_summary
                            .statistical_significance.interpretation
                        }
                      </div>
                    </div>
                  </div>
                )}

                {/* Full Report Link */}
                <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">
                        Evaluation Complete
                      </h4>
                      <p className="text-sm text-green-700">
                        Detailed results and visualizations saved to:{" "}
                        {evaluationResults.output_directory}
                      </p>
                    </div>
                    <div className="text-xs text-green-600">
                      📁 Check evaluation_results/ folder for charts and full
                      report
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Placeholder for Predicted Regimes Visualization */}
            {hmmPredictedRegimes && hmmChartData.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">
                  🔮 HMM Predicted Regimes (Next 2 Weeks)
                </h3>
                {/* TODO: Add a chart or table to visualize hmmPredictedRegimes */}
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={hmmChartData}
                    margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis
                      tickFormatter={(value) => {
                        if (value === 3) return "HighVol";
                        if (value === 2) return "MediumVol";
                        if (value === 1) return "LowVol";
                        return "N/A";
                      }}
                      domain={[0, 3.5]} // Slightly above max value
                      ticks={[0, 1, 2, 3]}
                      tick={{ fontSize: 10 }}
                    />
                    {/* @ts-ignore - recharts types are strict, formatter is functionally correct */}
                    <Tooltip
                      formatter={(
                        value: number,
                        name: string,
                        props: {
                          payload: {
                            date: string;
                            regimeValue: number;
                            regimeLabel: string;
                          };
                        }
                      ) => [props.payload.regimeLabel, "Regime"]}
                    />
                    <Bar dataKey="regimeValue" name="Regime" fill="#8884d8">
                      {/* Add custom cell rendering for color if desired, later */}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ML Ensemble Section */}
      <div className="p-4 border rounded shadow-sm bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            🤖 ML Ensemble System (Random Forest + Gradient Boosting)
          </h2>
          {mlEnsembleStatus && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Status:</span>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  mlEnsembleStatus.status === "trained"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {mlEnsembleStatus.status === "trained"
                  ? "🟢 Trained"
                  : "🟡 Ready"}
              </span>
            </div>
          )}
        </div>

        {/* ML Status Display */}
        {mlEnsembleStatus && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Models Trained:</span>
                <span
                  className={`ml-2 ${
                    mlEnsembleStatus.models_trained
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {mlEnsembleStatus.models_trained ? "✅ Yes" : "❌ No"}
                </span>
              </div>
              <div>
                <span className="font-medium">Training History:</span>
                <span className="ml-2">
                  {mlEnsembleStatus.training_history_count || 0} sessions
                </span>
              </div>
              {mlEnsembleStatus.latest_performance && (
                <>
                  <div>
                    <span className="font-medium">Ensemble Accuracy:</span>
                    <span
                      className={`ml-2 font-bold ${
                        mlEnsembleStatus.latest_performance.ensemble
                          ?.accuracy >= 0.65
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {(
                        mlEnsembleStatus.latest_performance.ensemble?.accuracy *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">65% Target:</span>
                    <span
                      className={`ml-2 ${
                        mlEnsembleStatus.meets_65_percent_requirement
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {mlEnsembleStatus.meets_65_percent_requirement
                        ? "✅ Met"
                        : "❌ Not Met"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => handleTrainMLEnsemble(false)}
            disabled={mlTraining || mlLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mlTraining ? "🔄 Training..." : "🚀 Quick Train (Default Params)"}
          </button>
          <button
            onClick={() => handleTrainMLEnsemble(true)}
            disabled={mlTraining || mlLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mlTraining ? "🔄 Optimizing..." : "⚡ Train with Optimization"}
          </button>
          <button
            onClick={handleMLPrediction}
            disabled={
              mlLoading || mlTraining || !mlEnsembleStatus?.models_trained
            }
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mlLoading ? "🔮 Predicting..." : "🎯 Make Predictions"}
          </button>
        </div>

        {/* Error Display */}
        {mlError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700 text-sm">❌ {mlError}</p>
          </div>
        )}

        {/* Training Results */}
        {mlTrainingResults && (
          <div className="mb-4 p-4 bg-white border rounded">
            <h3 className="text-lg font-semibold mb-3">📊 Training Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">Model Performance</h4>
                <div className="text-sm space-y-1">
                  <div>
                    Random Forest:{" "}
                    <span className="font-mono">
                      {(
                        mlTrainingResults.performance?.random_forest * 100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div>
                    Gradient Boosting:{" "}
                    <span className="font-mono">
                      {(
                        mlTrainingResults.performance?.gradient_boosting * 100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="font-medium">
                    Ensemble:{" "}
                    <span
                      className={`font-mono ${
                        mlTrainingResults.performance?.ensemble >= 0.65
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {(mlTrainingResults.performance?.ensemble * 100).toFixed(
                        1
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">Training Info</h4>
                <div className="text-sm space-y-1">
                  <div>
                    Training Samples:{" "}
                    <span className="font-mono">
                      {mlTrainingResults.training_samples}
                    </span>
                  </div>
                  <div>
                    Features:{" "}
                    <span className="font-mono">
                      {mlTrainingResults.features_count}
                    </span>
                  </div>
                  <div>
                    Model Saved:{" "}
                    <span className="font-mono text-xs">
                      {mlTrainingResults.model_path}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {mlTrainingResults.meets_65_percent_requirement ? (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800 text-sm">
                  ✅ Model meets the 65% accuracy requirement!
                </p>
              </div>
            ) : (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Model accuracy below 65% target. Consider feature
                  engineering or more data.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Predictions Display */}
        {mlPredictions && (
          <div className="mb-4 p-4 bg-white border rounded">
            <h3 className="text-lg font-semibold mb-3">🎯 ML Predictions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border px-2 py-1 text-left">Date</th>
                    <th className="border px-2 py-1 text-center">Prediction</th>
                    <th className="border px-2 py-1 text-center">
                      Ensemble Confidence
                    </th>
                    <th className="border px-2 py-1 text-center">
                      Random Forest
                    </th>
                    <th className="border px-2 py-1 text-center">
                      Gradient Boosting
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mlPredictions.predictions
                    ?.slice(0, 10)
                    .map((pred: any, idx: number) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="border px-2 py-1 font-mono text-xs">
                          {pred.date.slice(0, 10)}
                        </td>
                        <td
                          className={`border px-2 py-1 text-center font-medium ${
                            pred.direction === "UP"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {pred.direction === "UP" ? "📈 UP" : "📉 DOWN"}
                        </td>
                        <td className="border px-2 py-1 text-center font-mono">
                          {(pred.ensemble_confidence * 100).toFixed(1)}%
                        </td>
                        <td className="border px-2 py-1 text-center font-mono">
                          {(pred.random_forest_confidence * 100).toFixed(1)}%
                        </td>
                        <td className="border px-2 py-1 text-center font-mono">
                          {(pred.gradient_boosting_confidence * 100).toFixed(1)}
                          %
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              📝 Showing {Math.min(10, mlPredictions.predictions?.length || 0)}{" "}
              of {mlPredictions.predictions?.length || 0} predictions
            </div>
          </div>
        )}
      </div>

      {/* Downloaded Data Preview Panel */}
      {downloadedData && (
        <div className="p-4 border rounded shadow-sm bg-white">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">Downloaded Data Preview</h2>
            <button
              onClick={() => setDownloadedData(null)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ✕ Close
            </button>
          </div>
          <div className="mb-3 text-sm text-gray-600">
            <span className="font-medium">Source:</span> {downloadedData.source}{" "}
            |<span className="font-medium ml-2">File:</span>{" "}
            {downloadedData.filename} |
            <span className="font-medium ml-2">Showing:</span> First{" "}
            {downloadedData.data.length} rows
            {downloadedData.dateRange && (
              <>
                {" | "}
                <span className="font-medium">Range:</span>{" "}
                {downloadedData.dateRange.start} to{" "}
                {downloadedData.dateRange.end}
              </>
            )}
          </div>

          {downloadedData.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(downloadedData.data[0]).map((header) => (
                      <th
                        key={header}
                        className="border px-2 py-1 font-medium text-left"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {downloadedData.data.map((row: any, index: number) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      {Object.values(row).map(
                        (value: any, cellIndex: number) => (
                          <td key={cellIndex} className="border px-2 py-1">
                            {String(value)}
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">
              No data rows found in the downloaded file.
            </p>
          )}

          <div className="mt-3 text-xs text-gray-500">
            ✅ Data downloaded successfully and saved to your Downloads folder
          </div>
        </div>
      )}

      {/* Data Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trade Data Summary Panel */}
        {summaryMetrics && !loading && !error && (
          <div className="p-4 border rounded shadow-sm bg-white">
            <h2 className="text-xl font-semibold mb-3">Trade Data Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <span className="font-medium">Total Trades:</span>{" "}
                {summaryMetrics.totalTrades}
              </div>
              <div>
                <span className="font-medium">Total P&L:</span> $
                {summaryMetrics.totalPL.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Win Rate:</span>{" "}
                {summaryMetrics.winRate.toFixed(1)}%
              </div>
              <div>
                <span className="font-medium">Winning Trades:</span>{" "}
                {summaryMetrics.winningTrades}
              </div>
              <div>
                <span className="font-medium">Losing Trades:</span>{" "}
                {summaryMetrics.losingTrades}
              </div>
              <div>
                <span className="font-medium">Avg Profit:</span> $
                {summaryMetrics.averageProfit.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Avg Loss:</span> $
                {summaryMetrics.averageLoss.toFixed(2)}
              </div>
            </div>
            <h3 className="text-lg font-semibold mt-4 mb-2">
              P&L by Strategy:
            </h3>
            <ul className="list-disc pl-5">
              {Object.entries(summaryMetrics.pnlByStrategy).map(
                ([strategy, data]) => (
                  <li key={strategy}>
                    {strategy}: ${data.totalPL.toFixed(2)} ({data.count} trades)
                  </li>
                )
              )}
            </ul>
          </div>
        )}

        {/* Market Regime Panel - Added */}
        {!loading && !error && (
          <div className="p-4 border rounded shadow-sm bg-white">
            <h2 className="text-xl font-semibold mb-3">
              Market Volatility Regime
            </h2>
            <div
              className={`p-3 rounded text-center border ${getRegimeClasses(
                currentMarketRegime
              )}`}
            >
              <span className="font-bold text-lg">{currentMarketRegime}</span>
            </div>
            {regimeHistory.length > 0 && (
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">
                  Regime History (Last {regimeHistory.length} Trade Points)
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={regimeHistory}
                    margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis
                      tickFormatter={(value) => {
                        if (value === 3) return "High";
                        if (value === 2) return "Medium";
                        if (value === 1) return "Low";
                        return "N/A";
                      }}
                      domain={[0, 3.5]} // Slightly above max value
                      ticks={[0, 1, 2, 3]}
                      tick={{ fontSize: 10 }}
                    />
                    {/* @ts-ignore - recharts types are strict, formatter is functionally correct */}
                    <Tooltip
                      formatter={(
                        value: number,
                        name: string,
                        props: {
                          payload: {
                            date: string;
                            regimeValue: number;
                            regimeLabel: string;
                          };
                        }
                      ) => [props.payload.regimeLabel, "Regime"]}
                    />
                    <Bar dataKey="regimeValue" name="Regime" fill="#8884d8">
                      {/* Add custom cell rendering for color if desired, later */}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {regimeHistory.length === 0 &&
              currentMarketRegime === VolatilityRegime.UNKNOWN && (
                <p className="text-gray-500 mt-3 text-sm">
                  Not enough historical trade data to determine regime or
                  history.
                </p>
              )}
          </div>
        )}
      </div>

      {/* Interactive Visualizations Panel */}
      <div className="p-4 border rounded shadow-sm bg-white mt-6">
        <h2 className="text-xl font-semibold mb-3">
          Visualizations & Insights
        </h2>
        {!loading && !error && trades.length > 0 && (
          <CumulativePnlChart trades={trades} />
        )}
        {!loading && !error && trades.length === 0 && (
          <p className="text-gray-500">
            No trade data available to display visualizations.
          </p>
        )}
        {/* Export Button */}
        <div className="mt-4 flex items-center space-x-4">
          <button
            onClick={handleExportTrades}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Export Trades as CSV
          </button>
          <ReactTooltip content="Download all trades in CSV format for further analysis." />
        </div>
      </div>

      {/* --- New: Strategy Insights Panel --- */}
      <div className="p-4 border rounded shadow-sm bg-white mt-6">
        <h2 className="text-xl font-semibold mb-3">Strategy Insights</h2>
        <div className="flex items-center gap-4 mb-2 flex-wrap">
          <input
            type="text"
            placeholder="Filter by symbol..."
            value={insightsFilter}
            onChange={(e) => setInsightsFilter(e.target.value)}
            className="border px-2 py-1 rounded text-xs"
            title="Filter trades by symbol"
            aria-label="Filter trades by symbol"
          />
          <button
            className="border px-2 py-1 rounded text-xs"
            onClick={() =>
              setInsightsSort((s) => (s === "asc" ? "desc" : "asc"))
            }
            title="Sort by streak"
            aria-label="Sort by streak"
          >
            Sort by Streak: {insightsSort === "asc" ? "↑" : "↓"}
          </button>
        </div>
        {featuresLoading && (
          <div className="py-4 text-center">
            <span
              className="animate-spin inline-block w-6 h-6 border-4 border-blue-300 border-t-transparent rounded-full"
              aria-label="Loading features"
            ></span>
          </div>
        )}
        {featuresError && (
          <div className="py-2 text-red-600 text-center">{featuresError}</div>
        )}
        {!featuresLoading && !featuresError && featureImportances.length > 0 ? (
          <InsightsResponsiveContainer width="100%" height={250}>
            <InsightsBarChart data={featureImportances} layout="vertical">
              <InsightsCartesianGrid strokeDasharray="3 3" />
              <InsightsXAxis type="number" />
              <InsightsYAxis dataKey="feature" type="category" width={120} />
              <InsightsTooltip />
              <InsightsBar dataKey="importance" fill="#2563EB" />
            </InsightsBarChart>
          </InsightsResponsiveContainer>
        ) : null}
        {!featuresLoading &&
          !featuresError &&
          featureImportances.length === 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4 rounded">
              <div className="font-semibold text-yellow-800 mb-1">
                No feature importances or explainability data found.
              </div>
              <div className="text-yellow-700 text-sm mb-2">
                To see advanced analytics (feature importance, SHAP values),
                please train a model and export results.
                <br />
                <span className="font-medium">
                  Run this command in your project root:
                </span>
              </div>
              <pre className="bg-gray-100 rounded px-2 py-1 text-xs text-gray-800 mb-2">
                npx tsx scripts/train_baseline_model.ts
              </pre>
              <div className="text-xs text-gray-600">
                After running, refresh this page to see updated analytics.
              </div>
            </div>
          )}
        {/* Model predictions per trade (e.g., win streak, regime) */}
        {!featuresLoading && !featuresError && filteredFeatures.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <h3 className="text-md font-semibold mb-2">
              Model Predictions (Win Streak, Regime)
            </h3>
            <table className="min-w-full text-xs border">
              <thead>
                <tr>
                  <th className="border px-2 py-1" title="Trade ID">
                    Trade ID
                  </th>
                  <th className="border px-2 py-1" title="Symbol">
                    Symbol
                  </th>
                  <th
                    className="border px-2 py-1"
                    title="Consecutive win/loss streak"
                  >
                    Streak{" "}
                    <span
                      title="Consecutive win/loss streak"
                      aria-label="Consecutive win/loss streak"
                    >
                      🛈
                    </span>
                  </th>
                  <th
                    className="border px-2 py-1"
                    title="Market regime classification"
                  >
                    Regime{" "}
                    <span
                      title="Market regime classification"
                      aria-label="Market regime classification"
                    >
                      🛈
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFeatures.slice(0, 20).map((f, i) => (
                  <tr
                    key={f.id || i}
                    className={f.streak >= 2 ? "bg-green-50" : ""}
                    onClick={() => setSelectedTradeIdx(i)}
                    style={{ cursor: "pointer" }}
                    title="Click for details"
                  >
                    <td className="border px-2 py-1">{f.id}</td>
                    <td className="border px-2 py-1">{trades[i]?.symbol}</td>
                    <td className="border px-2 py-1">{f.streak}</td>
                    <td className="border px-2 py-1">{f.marketRegime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TradeDetailModal
              open={selectedTradeIdx !== null}
              onClose={() => setSelectedTradeIdx(null)}
              trade={
                selectedTradeIdx !== null ? trades[selectedTradeIdx] : null
              }
              features={
                selectedTradeIdx !== null ? features[selectedTradeIdx] : null
              }
            />
          </div>
        )}
      </div>

      {/* --- New: Win Zone Panel --- */}
      <div className="p-4 border rounded shadow-sm bg-white mt-6">
        <h2 className="text-xl font-semibold mb-3">Win Zone</h2>
        <div className="flex items-center gap-4 mb-2">
          <input
            type="text"
            placeholder="Filter by symbol..."
            value={insightsFilter}
            onChange={(e) => setInsightsFilter(e.target.value)}
            className="border px-2 py-1 rounded text-xs"
            title="Filter trades by symbol"
          />
          <button
            className="border px-2 py-1 rounded text-xs"
            onClick={() =>
              setInsightsSort((s) => (s === "asc" ? "desc" : "asc"))
            }
            title="Sort by streak"
          >
            Sort by Streak: {insightsSort === "asc" ? "↑" : "↓"}
          </button>
        </div>
        <p className="mb-2 text-gray-600">
          Trades currently in a win streak (streak ≥ 2):
        </p>
        {winZoneTrades.length > 0 ? (
          <table className="min-w-full text-xs border">
            <thead>
              <tr>
                <th className="border px-2 py-1">Trade ID</th>
                <th className="border px-2 py-1">Symbol</th>
                <th className="border px-2 py-1">Streak</th>
                <th className="border px-2 py-1">P&L</th>
              </tr>
            </thead>
            <tbody>
              {winZoneTrades.map((f, i) => (
                <tr
                  key={f.id || i}
                  onClick={() => setSelectedTradeIdx(i)}
                  style={{ cursor: "pointer" }}
                  title="Click for details"
                >
                  <td className="border px-2 py-1">{f.id}</td>
                  <td className="border px-2 py-1">{trades[i]?.symbol}</td>
                  <td className="border px-2 py-1">{f.streak}</td>
                  <td className="border px-2 py-1">{f.tradePL}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No trades currently in a win streak.</p>
        )}
        <TradeDetailModal
          open={selectedTradeIdx !== null}
          onClose={() => setSelectedTradeIdx(null)}
          trade={selectedTradeIdx !== null ? trades[selectedTradeIdx] : null}
          features={
            selectedTradeIdx !== null ? features[selectedTradeIdx] : null
          }
        />
      </div>

      {/* --- New: Pattern Explorer Panel --- */}
      <div className="p-4 border rounded shadow-sm bg-white mt-6">
        <h2 className="text-xl font-semibold mb-3">Pattern Explorer</h2>
        <p className="mb-2 text-gray-600">
          Timeline of win/loss streaks and market regimes.
        </p>
        {features.length > 0 ? (
          <InsightsResponsiveContainer width="100%" height={250}>
            <InsightsBarChart
              data={features.map((f, i) => ({
                date:
                  trades[i]?.closeDate?.toISOString().split("T")[0] ||
                  trades[i]?.openDate?.toISOString().split("T")[0] ||
                  i,
                streak: f.streak,
                regime: f.marketRegime,
              }))}
            >
              <InsightsCartesianGrid strokeDasharray="3 3" />
              <InsightsXAxis dataKey="date" tick={{ fontSize: 10 }} />
              <InsightsYAxis
                yAxisId="left"
                orientation="left"
                label={{ value: "Streak", angle: -90, position: "insideLeft" }}
              />
              <InsightsYAxis
                yAxisId="right"
                orientation="right"
                label={{ value: "Regime", angle: 90, position: "insideRight" }}
              />
              <InsightsTooltip />
              <InsightsBar
                yAxisId="left"
                dataKey="streak"
                fill="#10B981"
                name="Streak"
              />
              {/* Regime as a bar with color coding */}
              <InsightsBar
                yAxisId="right"
                dataKey="regime"
                fill="#6366F1"
                name="Regime"
              />
            </InsightsBarChart>
          </InsightsResponsiveContainer>
        ) : (
          <p className="text-gray-500">No pattern data available.</p>
        )}
      </div>

      {/* Trade Table Panel */}
      <div className="p-4 border rounded shadow-sm bg-white mt-6">
        <h2 className="text-xl font-semibold mb-3">All Trades</h2>
        <TradeTable trades={trades} />
      </div>

      {/* How This Works Section */}
      <div className="p-4 border rounded shadow-sm bg-white mt-6">
        <button
          className="text-blue-600 underline text-sm mb-2"
          onClick={() => setShowHowItWorks((v) => !v)}
        >
          {showHowItWorks ? "Hide" : "Show"} How This Works
        </button>
        {showHowItWorks && (
          <div className="mt-2 text-sm text-gray-700">
            <h3 className="font-semibold mb-1">
              About the HMM Model & Regime Analysis
            </h3>
            <ul className="list-disc pl-5 mb-2">
              <li>
                The Hidden Markov Model (HMM) is trained on your trade and
                market data to identify market regimes (e.g., HighVol,
                MediumVol, LowVol).
              </li>
              <li>
                Regime predictions help you understand periods of high or low
                volatility, which can inform your trading strategy.
              </li>
              <li>
                All calculations are based on your imported trades and the
                selected market data range.
              </li>
              <li>
                For more details, see the project documentation or ask for help
                in the Troubleshooting section above.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AITradeAnalysis;
