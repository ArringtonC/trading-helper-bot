import React, { useRef, useState } from "react";

interface DataDownloaderProps {
  spyData: { data: string; filename: string; dateRange?: any } | null;
  vixData: { data: string; filename: string; dateRange?: any } | null;
  onVixDataDownloaded: (data: string, filename: string, dateRange: any) => void;
  onSpyDataDownloaded: (data: string, filename: string, dateRange: any) => void;
  onMarketDataFileChange: (file: File) => void;
  onCombineData: () => void;
}

const DataDownloader: React.FC<DataDownloaderProps> = ({
  spyData,
  vixData,
  onVixDataDownloaded,
  onSpyDataDownloaded,
  onMarketDataFileChange,
  onCombineData,
}) => {
  const marketDataFileInputRef = useRef<HTMLInputElement>(null);
  const HMM_BACKEND_URL = "http://127.0.0.1:5001";
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadVIXDataIBKR = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const response = await fetch(`${HMM_BACKEND_URL}/download/ibkr/vix`);
      if (!response.ok)
        throw new Error(`Failed to download VIX data: ${response.statusText}`);
      const data = await response.json();
      onVixDataDownloaded(data.data, data.filename, data.date_range);
    } catch (error: any) {
      setDownloadError(error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSpyDataIBKR = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const response = await fetch(`${HMM_BACKEND_URL}/download/ibkr/spy`);
      if (!response.ok)
        throw new Error(`Failed to download SPY data: ${response.statusText}`);
      const data = await response.json();
      onSpyDataDownloaded(data.data, data.filename, data.date_range);
    } catch (error: any) {
      setDownloadError(error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSpyDataAlphaVantage = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const response = await fetch(
        `${HMM_BACKEND_URL}/download/alpha_vantage/spy`
      );
      if (!response.ok)
        throw new Error(`Failed to download SPY data: ${response.statusText}`);
      const data = await response.json();
      onSpyDataDownloaded(data.data, data.filename, data.date_range);
    } catch (error: any) {
      setDownloadError(error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSpyDataYahoo = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const response = await fetch(`${HMM_BACKEND_URL}/download/yahoo/spy`);
      if (!response.ok)
        throw new Error(`Failed to download SPY data: ${response.statusText}`);
      const data = await response.json();
      onSpyDataDownloaded(data.data, data.filename, data.date_range);
    } catch (error: any) {
      setDownloadError(error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSpyDataPolygon = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const response = await fetch(`${HMM_BACKEND_URL}/download/polygon/spy`);
      if (!response.ok)
        throw new Error(`Failed to download SPY data: ${response.statusText}`);
      const data = await response.json();
      onSpyDataDownloaded(data.data, data.filename, data.date_range);
    } catch (error: any) {
      setDownloadError(error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onMarketDataFileChange(file);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-semibold mb-4 border-b pb-2">
        Data Management
      </h3>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <h4 className="font-semibold text-md mb-2">Download SPY Data</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadSpyDataIBKR}
              disabled={isDownloading}
              className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded disabled:bg-gray-400"
            >
              from IBKR
            </button>
            <button
              onClick={handleDownloadSpyDataAlphaVantage}
              disabled={isDownloading}
              className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded disabled:bg-gray-400"
            >
              from AlphaVantage
            </button>
            <button
              onClick={handleDownloadSpyDataYahoo}
              disabled={isDownloading}
              className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded disabled:bg-gray-400"
            >
              from Yahoo
            </button>
            <button
              onClick={handleDownloadSpyDataPolygon}
              disabled={isDownloading}
              className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded disabled:bg-gray-400"
            >
              from Polygon
            </button>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-md mb-2">Download VIX Data</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadVIXDataIBKR}
              disabled={isDownloading}
              className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded disabled:bg-gray-400"
            >
              from IBKR (VIX)
            </button>
          </div>
        </div>
        <button
          onClick={onCombineData}
          disabled={!spyData || !vixData}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        >
          Combine SPY & VIX Data
        </button>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Or Upload Market Data (CSV)
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            ref={marketDataFileInputRef}
          />
        </div>
      </div>
      {downloadError && (
        <p className="text-red-500 text-sm mt-2">{downloadError}</p>
      )}
    </div>
  );
};

export default DataDownloader;
