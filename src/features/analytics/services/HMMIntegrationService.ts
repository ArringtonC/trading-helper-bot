import { 
  trainHMMModel, 
  predictHMMRegimes, 
  TrainRequest, 
  PredictRequest, 
  PredictResponse 
} from '../../../shared/services/HMMService';
import { format, subDays } from 'date-fns';

export interface HMMState {
  date: string;
  regime: 'BULL' | 'BEAR' | 'NEUTRAL' | 'VOLATILE';
  confidence: number;
  transitionProbability?: number;
  vixCorrelation?: number;
  expectedReturn?: number;
  riskLevel?: number;
}

export interface HMMAnalysisResult {
  states: HMMState[];
  currentRegime: HMMState;
  accuracy?: number;
  lastUpdated: Date;
}

export class HMMIntegrationService {
  private static instance: HMMIntegrationService;
  private lastTrainingTime: Date | null = null;
  private cachedModel: string | null = null;

  public static getInstance(): HMMIntegrationService {
    if (!HMMIntegrationService.instance) {
      HMMIntegrationService.instance = new HMMIntegrationService();
    }
    return HMMIntegrationService.instance;
  }

  /**
   * Map HMM regime labels to our standardized regime types
   */
  private mapRegimeLabel(label: string): HMMState['regime'] {
    const upperLabel = label.toUpperCase();
    
    // Real backend mappings
    if (upperLabel.includes('HIGHVOL') || upperLabel.includes('HIGH_VOL') || upperLabel.includes('MEDIUMVOL')) {
      return 'VOLATILE';
    }
    if (upperLabel.includes('REGIME1') || upperLabel.includes('UPTREND') || upperLabel.includes('BULL')) {
      return 'BULL';
    }
    if (upperLabel.includes('REGIME2') || upperLabel.includes('DOWNTREND') || upperLabel.includes('BEAR')) {
      return 'BEAR';
    }
    if (upperLabel.includes('REGIME3') || upperLabel.includes('LOWVOL') || upperLabel.includes('LOW_VOL')) {
      return 'NEUTRAL';
    }
    if (upperLabel.includes('REGIME4')) {
      // Regime4 appears to be a common state, likely neutral/consolidation
      return 'NEUTRAL';
    }
    
    // Default to neutral for unknown regimes
    return 'NEUTRAL';
  }

  /**
   * Train a new HMM model with the specified parameters
   */
  async trainModel(params: {
    symbol: string;
    startDate?: string;
    endDate?: string;
    includeVix?: boolean;
    nComponents?: number;
  }): Promise<string> {
    const trainRequest: TrainRequest = {
      symbol: params.symbol || 'SPY',
      startDate: params.startDate || format(subDays(new Date(), 365), 'yyyy-MM-dd'),
      endDate: params.endDate || format(new Date(), 'yyyy-MM-dd'),
      includeVix: params.includeVix ?? true,
      nComponents: params.nComponents || 4, // 4 states: Bull, Bear, Neutral, Volatile
      nIter: 100,
      covarianceType: 'full'
    };

    try {
      const response = await trainHMMModel(trainRequest);
      this.lastTrainingTime = new Date();
      this.cachedModel = response.modelFile;
      return response.modelFile;
    } catch (error) {
      console.error('Failed to train HMM model:', error);
      throw new Error(`HMM training failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get predictions from the HMM model
   */
  async getPredictions(params: {
    symbol: string;
    startDate?: string;
    endDate?: string;
    includeVix?: boolean;
    returnProbabilities?: boolean;
  }): Promise<HMMAnalysisResult> {
    const predictRequest: PredictRequest = {
      symbol: params.symbol || 'SPY',
      startDate: params.startDate || format(subDays(new Date(), 90), 'yyyy-MM-dd'),
      endDate: params.endDate || format(new Date(), 'yyyy-MM-dd'),
      includeVix: params.includeVix ?? true,
      return_probabilities: params.returnProbabilities ?? true
    };

    try {
      const response = await predictHMMRegimes(predictRequest);
      return this.processHMMResponse(response);
    } catch (error) {
      console.error('Failed to get HMM predictions:', error);
      
      // If prediction fails, try to train a new model first
      if (!this.cachedModel || !this.lastTrainingTime) {
        console.log('No cached model found, training new model...');
        await this.trainModel({
          symbol: params.symbol,
          startDate: params.startDate,
          endDate: params.endDate,
          includeVix: params.includeVix
        });
        
        // Retry prediction
        return this.getPredictions(params);
      }
      
      throw new Error(`HMM prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process HMM response into our standardized format
   */
  private processHMMResponse(response: PredictResponse): HMMAnalysisResult {
    const states: HMMState[] = response.regimeHistory.map((item, index, array) => {
      const regime = this.mapRegimeLabel(item.regime);
      
      // Calculate mock confidence based on regime stability
      const confidence = this.calculateConfidence(array, index);
      
      // Calculate transition probability to next state
      const transitionProbability = index < array.length - 1 && 
        array[index + 1].regime !== item.regime ? 0.25 : 0.05;
      
      // Mock expected returns based on regime
      const expectedReturn = this.getExpectedReturn(regime);
      
      // Mock risk level based on regime
      const riskLevel = this.getRiskLevel(regime);
      
      // Mock VIX correlation
      const vixCorrelation = regime === 'VOLATILE' ? 0.8 : 
                            regime === 'BEAR' ? 0.6 : 
                            regime === 'BULL' ? -0.4 : 0.1;

      return {
        date: item.date,
        regime,
        confidence,
        transitionProbability,
        vixCorrelation,
        expectedReturn,
        riskLevel
      };
    });

    const currentRegime = states[states.length - 1] || {
      date: format(new Date(), 'yyyy-MM-dd'),
      regime: 'NEUTRAL' as const,
      confidence: 0.5,
      transitionProbability: 0.1,
      vixCorrelation: 0,
      expectedReturn: 0,
      riskLevel: 0.5
    };

    return {
      states,
      currentRegime,
      accuracy: 0.873, // Mock accuracy for now
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate confidence based on regime stability
   */
  private calculateConfidence(history: Array<{ regime: string }>, currentIndex: number): number {
    if (currentIndex === 0) return 0.7;
    
    let sameRegimeCount = 1;
    const currentRegime = history[currentIndex].regime;
    
    // Look back up to 5 periods
    for (let i = currentIndex - 1; i >= Math.max(0, currentIndex - 5); i--) {
      if (history[i].regime === currentRegime) {
        sameRegimeCount++;
      } else {
        break;
      }
    }
    
    // More consecutive same regimes = higher confidence
    return Math.min(0.6 + (sameRegimeCount * 0.08), 0.95);
  }

  /**
   * Get expected return based on regime
   */
  private getExpectedReturn(regime: HMMState['regime']): number {
    switch (regime) {
      case 'BULL':
        return 0.002 + Math.random() * 0.006; // 0.2% - 0.8% daily
      case 'BEAR':
        return -0.006 + Math.random() * 0.004; // -0.6% to -0.2% daily
      case 'VOLATILE':
        return -0.001 + Math.random() * 0.002; // -0.1% to 0.1% daily
      default:
        return -0.0005 + Math.random() * 0.001; // -0.05% to 0.05% daily
    }
  }

  /**
   * Get risk level based on regime
   */
  private getRiskLevel(regime: HMMState['regime']): number {
    switch (regime) {
      case 'VOLATILE':
        return 0.7 + Math.random() * 0.25; // 70% - 95%
      case 'BEAR':
        return 0.5 + Math.random() * 0.3; // 50% - 80%
      case 'BULL':
        return 0.2 + Math.random() * 0.3; // 20% - 50%
      default:
        return 0.3 + Math.random() * 0.3; // 30% - 60%
    }
  }

  /**
   * Check if HMM service is available
   */
  async checkServiceStatus(): Promise<boolean> {
    try {
      const response = await fetch('http://127.0.0.1:5001/');
      const data = await response.json();
      return data.status === 'HMM Microservice is running';
    } catch (error) {
      console.error('HMM service not available:', error);
      return false;
    }
  }

  /**
   * Get available symbols from the service
   */
  async getAvailableSymbols(): Promise<string[]> {
    // For now, return a static list. In the future, this could query the backend
    return ['SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VOO'];
  }
}

export default HMMIntegrationService;