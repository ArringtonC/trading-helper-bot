import React, { useState, useEffect } from 'react';
import {
  Filter,
  Sliders,
  Shield,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  TrendingUp,
  Settings,
  RefreshCw
} from 'lucide-react';

interface Position {
  symbol: string;
  name: string;
  sector: string;
  weight: number;
  beta: number;
  debtToEquity: number;
  currentRatio: number;
  price: number;
  risk: 'low' | 'medium' | 'high';
}

interface RiskFilteringEngineProps {
  positions: Position[];
  onFiltersApplied: (filteredPositions: Position[]) => void;
}

interface FilterCriteria {
  maxBeta: number;
  minBeta: number;
  maxDebtToEquity: number;
  minCurrentRatio: number;
  allowedRiskLevels: string[];
  maxSectorConcentration: number;
  accountType: 'conservative' | 'moderate' | 'aggressive';
}

const RiskFilteringEngine: React.FC<RiskFilteringEngineProps> = ({
  positions,
  onFiltersApplied
}) => {
  const [filters, setFilters] = useState<FilterCriteria>({
    maxBeta: 1.5,
    minBeta: 0.0,
    maxDebtToEquity: 1.5,
    minCurrentRatio: 1.5,
    allowedRiskLevels: ['low', 'medium', 'high'],
    maxSectorConcentration: 40,
    accountType: 'moderate'
  });

  const [filteredPositions, setFilteredPositions] = useState<Position[]>(positions);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterStats, setFilterStats] = useState({
    totalPositions: 0,
    passedPositions: 0,
    rejectedPositions: 0,
    rejectionReasons: [] as string[]
  });

  const accountTypePresets = {
    conservative: {
      maxBeta: 1.2,
      minBeta: 0.0,
      maxDebtToEquity: 1.0,
      minCurrentRatio: 2.0,
      allowedRiskLevels: ['low', 'medium'],
      maxSectorConcentration: 25
    },
    moderate: {
      maxBeta: 1.5,
      minBeta: 0.0,
      maxDebtToEquity: 1.5,
      minCurrentRatio: 1.5,
      allowedRiskLevels: ['low', 'medium', 'high'],
      maxSectorConcentration: 40
    },
    aggressive: {
      maxBeta: 2.5,
      minBeta: 0.0,
      maxDebtToEquity: 2.0,
      minCurrentRatio: 1.0,
      allowedRiskLevels: ['low', 'medium', 'high'],
      maxSectorConcentration: 50
    }
  };

  useEffect(() => {
    applyFilters();
  }, [filters, positions]);

  const applyFilters = () => {
    const rejectionReasons: string[] = [];
    
    // Apply individual position filters
    const passedPositions = positions.filter(position => {
      // Beta filter
      if (position.beta > filters.maxBeta || position.beta < filters.minBeta) {
        rejectionReasons.push(`${position.symbol}: Beta (${position.beta.toFixed(2)}) outside range`);
        return false;
      }

      // Debt-to-equity filter
      if (position.debtToEquity > filters.maxDebtToEquity) {
        rejectionReasons.push(`${position.symbol}: High debt-to-equity ratio (${position.debtToEquity.toFixed(2)})`);
        return false;
      }

      // Current ratio filter
      if (position.currentRatio < filters.minCurrentRatio) {
        rejectionReasons.push(`${position.symbol}: Low current ratio (${position.currentRatio.toFixed(2)})`);
        return false;
      }

      // Risk level filter
      if (!filters.allowedRiskLevels.includes(position.risk)) {
        rejectionReasons.push(`${position.symbol}: Risk level (${position.risk}) not allowed`);
        return false;
      }

      return true;
    });

    // Check sector concentration
    const sectorWeights: { [sector: string]: number } = {};
    const totalWeight = passedPositions.reduce((sum, pos) => sum + pos.weight, 0);
    
    passedPositions.forEach(pos => {
      const normalizedWeight = totalWeight > 0 ? (pos.weight / totalWeight) * 100 : 0;
      sectorWeights[pos.sector] = (sectorWeights[pos.sector] || 0) + normalizedWeight;
    });

    // Filter out positions from over-concentrated sectors
    const finalFilteredPositions = passedPositions.filter(position => {
      const sectorWeight = sectorWeights[position.sector] || 0;
      if (sectorWeight > filters.maxSectorConcentration) {
        rejectionReasons.push(`${position.symbol}: Sector concentration (${sectorWeight.toFixed(1)}%) exceeds limit`);
        return false;
      }
      return true;
    });

    setFilteredPositions(finalFilteredPositions);
    setFilterStats({
      totalPositions: positions.length,
      passedPositions: finalFilteredPositions.length,
      rejectedPositions: positions.length - finalFilteredPositions.length,
      rejectionReasons: rejectionReasons.slice(0, 10) // Limit to first 10 reasons
    });

    onFiltersApplied(finalFilteredPositions);
  };

  const handleAccountTypeChange = (accountType: 'conservative' | 'moderate' | 'aggressive') => {
    const preset = accountTypePresets[accountType];
    setFilters({
      ...filters,
      ...preset,
      accountType
    });
  };

  const handleFilterChange = (key: keyof FilterCriteria, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRiskLevelToggle = (riskLevel: string) => {
    const currentLevels = filters.allowedRiskLevels;
    const newLevels = currentLevels.includes(riskLevel)
      ? currentLevels.filter(level => level !== riskLevel)
      : [...currentLevels, riskLevel];
    
    handleFilterChange('allowedRiskLevels', newLevels);
  };

  const resetFilters = () => {
    handleAccountTypeChange('moderate');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="h-5 w-5 text-indigo-500" />
              Risk Filtering Engine
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Automated screening based on risk tolerance and financial health criteria
            </p>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-4 w-4" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Filter Results Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{filterStats.totalPositions}</div>
            <div className="text-sm text-blue-600">Total Positions</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{filterStats.passedPositions}</div>
            <div className="text-sm text-green-600">Passed Filters</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{filterStats.rejectedPositions}</div>
            <div className="text-sm text-red-600">Filtered Out</div>
          </div>
        </div>

        {/* Account Type Selector */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Account Risk Profile</h4>
          <div className="flex gap-2">
            {Object.keys(accountTypePresets).map((type) => (
              <button
                key={type}
                onClick={() => handleAccountTypeChange(type as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filters.accountType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-6 mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              Advanced Filter Settings
            </h4>

            {/* Beta Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beta Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min Beta</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="3"
                    value={filters.minBeta}
                    onChange={(e) => handleFilterChange('minBeta', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Beta</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="3"
                    value={filters.maxBeta}
                    onChange={(e) => handleFilterChange('maxBeta', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Financial Health Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Debt-to-Equity Ratio
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={filters.maxDebtToEquity}
                  onChange={(e) => handleFilterChange('maxDebtToEquity', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Current Ratio
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={filters.minCurrentRatio}
                  onChange={(e) => handleFilterChange('minCurrentRatio', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Risk Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Risk Levels
              </label>
              <div className="flex gap-2">
                {['low', 'medium', 'high'].map((level) => (
                  <button
                    key={level}
                    onClick={() => handleRiskLevelToggle(level)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filters.allowedRiskLevels.includes(level)
                        ? level === 'low' ? 'bg-green-600 text-white' :
                          level === 'medium' ? 'bg-yellow-600 text-white' :
                          'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Sector Concentration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Sector Concentration (%)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={filters.maxSectorConcentration}
                onChange={(e) => handleFilterChange('maxSectorConcentration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Reset to Defaults
              </button>
            </div>
          </div>
        )}

        {/* Rejection Reasons */}
        {filterStats.rejectionReasons.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-red-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Filter Violations
            </h4>
            <ul className="space-y-1 text-sm text-red-800">
              {filterStats.rejectionReasons.map((reason, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                  {reason}
                </li>
              ))}
              {filterStats.rejectionReasons.length >= 10 && (
                <li className="text-red-600 italic">
                  ... and {filterStats.rejectedPositions - 10} more violations
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Filtered Positions Preview */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Positions Passing Risk Filters
          </h4>
          
          {filteredPositions.length > 0 ? (
            <div className="space-y-2">
              {filteredPositions.slice(0, 5).map((position) => (
                <div key={position.symbol} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-green-700">{position.symbol}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{position.symbol}</div>
                      <div className="text-sm text-gray-600">{position.sector}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium">β {position.beta.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Beta</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{position.debtToEquity.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">D/E</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{position.currentRatio.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Current</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      position.risk === 'low' ? 'text-green-600 bg-green-100' :
                      position.risk === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                      'text-red-600 bg-red-100'
                    }`}>
                      {position.risk.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredPositions.length > 5 && (
                <div className="text-center text-gray-500 text-sm py-2">
                  And {filteredPositions.length - 5} more positions passing all filters...
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Filter className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No positions pass the current filter criteria.</p>
              <p className="text-sm mt-1">Consider adjusting your filter settings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskFilteringEngine; 