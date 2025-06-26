import React, { useState } from "react";
import {
  PredictRequest,
  PredictResponse,
  TrainRequest,
  predictHMMRegimes,
  trainHMMModel,
} from "../../../../../shared/services/HMMService";

const HMM_BACKEND_URL = "http://127.0.0.1:5001";

interface HMMControlsProps {
  hmmServiceStatus: "checking" | "connected" | "not_running";
  combinedData: { data: string; filename: string } | null;
  hmmMarketDataFile: File | null;
  onPrediction: (data: PredictResponse) => void;
}

const HMMControls: React.FC<HMMControlsProps> = ({
  hmmServiceStatus,
  combinedData,
  hmmMarketDataFile,
  onPrediction,
}) => {
  const [hmmSymbol, setHmmSymbol] = useState("SPY");
  const [hmmStartDate, setHmmStartDate] = useState("2024-12-01");
  const [hmmEndDate, setHmmEndDate] = useState("2024-12-30");
  const [includeVix, setIncludeVix] = useState(false);
  const [hmmLoading, setHmmLoading] = useState(false);
  const [hmmError, setHmmError] = useState<string | null>(null);
  const [hmmTrainStatus, setHmmTrainStatus] = useState<string | null>(null);

  const handleTrainHMM = async () => {
    if (!hmmMarketDataFile && !combinedData) {
      setHmmError(
        "Please select a market data file or ensure combined data is available."
      );
      return;
    }
    setHmmLoading(true);
    setHmmError(null);
    setHmmTrainStatus("Training initiated...");

    try {
      const request: TrainRequest = {
        symbol: hmmSymbol,
        startDate: hmmStartDate,
        endDate: hmmEndDate,
        includeVix: includeVix,
      };

      const status = await trainHMMModel(request);
      setHmmTrainStatus(status.message);
    } catch (error: any) {
      setHmmError(`Training failed: ${error.message || "Unknown error"}`);
      setHmmTrainStatus("Training failed.");
    } finally {
      setHmmLoading(false);
    }
  };

  const handlePredictHMM = async () => {
    if (!hmmMarketDataFile && !combinedData) {
      setHmmError(
        "Please select a market data file or ensure combined data is available for prediction."
      );
      return;
    }
    setHmmLoading(true);
    setHmmError(null);

    try {
      const request: PredictRequest = {
        symbol: hmmSymbol,
        startDate: hmmStartDate,
        endDate: hmmEndDate,
        includeVix: includeVix,
      };

      const result = await predictHMMRegimes(request);
      onPrediction(result);
    } catch (error: any) {
      setHmmError(`Prediction failed: ${error.message || "Unknown error"}`);
    } finally {
      setHmmLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-semibold mb-4 border-b pb-2">
        HMM Regime Analysis
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Symbol
          </label>
          <input
            type="text"
            value={hmmSymbol}
            onChange={(e) => setHmmSymbol(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            value={hmmStartDate}
            onChange={(e) => setHmmStartDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            value={hmmEndDate}
            onChange={(e) => setHmmEndDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={includeVix}
            onChange={(e) => setIncludeVix(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Include VIX Data
          </label>
        </div>
      </div>

      <div className="mt-4 flex space-x-2">
        <button
          onClick={handleTrainHMM}
          disabled={hmmLoading || hmmServiceStatus !== "connected"}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        >
          {hmmLoading ? "Training..." : "Train HMM"}
        </button>
        <button
          onClick={handlePredictHMM}
          disabled={hmmLoading || hmmServiceStatus !== "connected"}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        >
          {hmmLoading ? "Predicting..." : "Predict Regimes"}
        </button>
      </div>

      {hmmTrainStatus && (
        <div className="mt-4 p-2 bg-gray-100 rounded">
          <p>
            <strong>Training Status:</strong> {hmmTrainStatus}
          </p>
        </div>
      )}
      {hmmError && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
          <p>
            <strong>Error:</strong> {hmmError}
          </p>
        </div>
      )}
    </div>
  );
};

export default HMMControls;
