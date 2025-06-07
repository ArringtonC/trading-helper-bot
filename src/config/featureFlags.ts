import { loadSetting } from '../services/SettingsService';
import { MESFeatureFlags } from '../components/MESFuturesTutorial/types';

export const getMESFeatureFlags = (): MESFeatureFlags => ({
  enhancedTutorial: loadSetting('mesEnhancedTutorial') === 'true',
  realTimeData: loadSetting('mesRealTimeData') === 'true',
  communityFeatures: loadSetting('mesCommunityFeatures') === 'true',
  advancedAnalytics: loadSetting('mesAdvancedAnalytics') === 'true',
  psychologyAssessment: loadSetting('mesPsychologyAssessment') === 'true',
  monteCarloSimulation: loadSetting('mesMonteCarloSimulation') === 'true',
  tradingSimulator: loadSetting('mesTradingSimulator') === 'true',
  mentorshipProgram: loadSetting('mesMentorshipProgram') === 'true',
  strategyMarketplace: loadSetting('mesStrategyMarketplace') === 'true',
  liveTrading: loadSetting('mesLiveTrading') === 'true',
});

export const setMESFeatureFlag = (flag: keyof MESFeatureFlags, value: boolean): void => {
  const settingKey = `mes${flag.charAt(0).toUpperCase() + flag.slice(1)}`;
  localStorage.setItem(settingKey, value.toString());
};

export const getDefaultMESFeatureFlags = (): MESFeatureFlags => ({
  enhancedTutorial: false, // Start with legacy tutorial
  realTimeData: false,
  communityFeatures: false,
  advancedAnalytics: false,
  psychologyAssessment: false,
  monteCarloSimulation: false,
  tradingSimulator: false,
  mentorshipProgram: false,
  strategyMarketplace: false,
  liveTrading: false,
});

// Development/Testing overrides
export const getDevMESFeatureFlags = (): MESFeatureFlags => ({
  enhancedTutorial: true,
  realTimeData: true,
  communityFeatures: true,
  advancedAnalytics: true,
  psychologyAssessment: true,
  monteCarloSimulation: true,
  tradingSimulator: true,
  mentorshipProgram: false, // Keep disabled for dev
  strategyMarketplace: false, // Keep disabled for dev
  liveTrading: false, // Keep disabled for dev
}); 