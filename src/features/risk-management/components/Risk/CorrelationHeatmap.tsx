import React from 'react';
import { Grid, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CorrelationHeatmapProps {
  correlationMatrix: { [key: string]: { [key: string]: number } };
  positions: Array<{
    symbol: string;
    name: string;
    sector: string;
  }>;
}

const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({
  correlationMatrix,
  positions
}) => {
  const getCorrelationColor = (correlation: number) => {
    if (correlation === 1.0) return 'bg-gray-300 text-gray-700'; // Self-correlation
    if (correlation >= 0.7) return 'bg-red-500 text-white';
    if (correlation >= 0.5) return 'bg-red-300 text-red-900';
    if (correlation >= 0.3) return 'bg-yellow-300 text-yellow-900';
    if (correlation >= 0.1) return 'bg-green-300 text-green-900';
    if (correlation >= -0.1) return 'bg-gray-200 text-gray-700';
    if (correlation >= -0.3) return 'bg-blue-300 text-blue-900';
    return 'bg-blue-500 text-white';
  };

  const getCorrelationIcon = (correlation: number) => {
    if (correlation > 0.3) return TrendingUp;
    if (correlation < -0.3) return TrendingDown;
    return Minus;
  };

  const getCorrelationLabel = (correlation: number) => {
    if (correlation === 1.0) return 'SELF';
    if (correlation >= 0.7) return 'HIGH+';
    if (correlation >= 0.5) return 'MOD+';
    if (correlation >= 0.3) return 'LOW+';
    if (correlation >= -0.1) return 'NONE';
    if (correlation >= -0.3) return 'LOW-';
    return 'MOD-';
  };

  // Limit to top positions for readability
  const displayPositions = positions.slice(0, 6);

  if (Object.keys(correlationMatrix).length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Grid className="h-5 w-5 text-purple-500" />
            Correlation Analysis
          </h3>
        </div>
        <div className="p-6 text-center text-gray-500">
          <Grid className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Correlation data loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Grid className="h-5 w-5 text-purple-500" />
          Correlation Analysis
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Position correlations on a scale from -1 (inverse) to +1 (perfect positive)
        </p>
      </div>

      <div className="p-6">
        {/* Correlation Matrix */}
        <div className="mb-6">
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Header row */}
              <div className="flex">
                <div className="w-20"></div> {/* Empty corner */}
                {displayPositions.map((pos) => (
                  <div key={pos.symbol} className="w-16 text-center">
                    <div className="text-xs font-medium text-gray-600 transform -rotate-45 origin-bottom-left">
                      {pos.symbol}
                    </div>
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {displayPositions.map((rowPos) => (
                <div key={rowPos.symbol} className="flex items-center mt-2">
                  <div className="w-20 text-right pr-2">
                    <div className="text-xs font-medium text-gray-900">{rowPos.symbol}</div>
                    <div className="text-xs text-gray-500">{rowPos.sector}</div>
                  </div>
                  {displayPositions.map((colPos) => {
                    const correlation = correlationMatrix[rowPos.symbol]?.[colPos.symbol] || 0;
                    const Icon = getCorrelationIcon(correlation);
                    
                    return (
                      <div key={colPos.symbol} className="w-16 px-1">
                        <div 
                          className={`h-12 rounded text-center flex flex-col items-center justify-center ${getCorrelationColor(correlation)}`}
                          title={`${rowPos.symbol} vs ${colPos.symbol}: ${correlation.toFixed(3)}`}
                        >
                          <Icon className="h-3 w-3 mb-1" />
                          <span className="text-xs font-bold">
                            {getCorrelationLabel(correlation)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Correlation Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>High Positive (0.7+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-300 rounded"></div>
              <span>Moderate Positive (0.5-0.7)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-300 rounded"></div>
              <span>Low Positive (0.3-0.5)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span>No Correlation (-0.1 to 0.3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-300 rounded"></div>
              <span>Low Negative (0.1-0.3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-300 rounded"></div>
              <span>Moderate Negative (-0.1 to -0.3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>High Negative (-0.3+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span>Self-Correlation (1.0)</span>
            </div>
          </div>
        </div>

        {/* High Correlation Warnings */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Diversification Insights</h4>
          
          {/* Find high correlations */}
          {(() => {
            const highCorrelations: Array<{pos1: string, pos2: string, correlation: number}> = [];
            displayPositions.forEach((pos1) => {
              displayPositions.forEach((pos2) => {
                if (pos1.symbol < pos2.symbol) { // Avoid duplicates
                  const correlation = correlationMatrix[pos1.symbol]?.[pos2.symbol] || 0;
                  if (correlation >= 0.6) {
                    highCorrelations.push({
                      pos1: pos1.symbol,
                      pos2: pos2.symbol,
                      correlation
                    });
                  }
                }
              });
            });

            if (highCorrelations.length > 0) {
              return (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="font-medium text-yellow-900 mb-2">High Correlation Alert</h5>
                  <p className="text-sm text-yellow-800 mb-3">
                    The following position pairs show high correlation, which may reduce diversification benefits:
                  </p>
                  <ul className="space-y-2">
                    {highCorrelations.map(({pos1, pos2, correlation}) => (
                      <li key={`${pos1}-${pos2}`} className="flex items-center justify-between text-sm">
                        <span className="text-yellow-900">
                          <strong>{pos1}</strong> and <strong>{pos2}</strong>
                        </span>
                        <span className="bg-yellow-200 text-yellow-900 px-2 py-1 rounded text-xs font-medium">
                          {correlation.toFixed(3)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            } else {
              return (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-900 mb-2">Good Diversification</h5>
                  <p className="text-sm text-green-800">
                    Your portfolio shows good diversification with no highly correlated position pairs. 
                    This helps reduce concentration risk and improve risk-adjusted returns.
                  </p>
                </div>
              );
            }
          })()}

          {/* Sector correlation insights */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">Correlation Tips</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Positions in the same sector typically show higher correlation</li>
              <li>• High correlation (0.7+) reduces diversification benefits</li>
              <li>• Negative correlation can provide portfolio protection during downturns</li>
              <li>• Monitor correlation changes during market stress periods</li>
              <li>• Consider adding uncorrelated assets to improve diversification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrelationHeatmap; 