import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhasedOnboardingManager } from './PhasedOnboardingManager';
import GoalSizingWizard from './GoalSizingWizard';
import { useGoalSizing } from '../../context/GoalSizingContext';
import { Button } from '../ui/button';
import { Alert } from '../ui/alert';
import { Card } from '../ui/Card';

interface UserContext {
  hasImportedData: boolean;
  tradeCount: number;
  accountValue: number;
  timeSpentInApp: number;
  hasCompletedBasicGoals: boolean;
  lastLoginDate?: Date;
}

interface GoalSizingWizardWithPhasesProps {
  forcePhase?: number;
  onComplete?: (goal: any) => void;
  showPhaseSelection?: boolean;
}

export const GoalSizingWizardWithPhases: React.FC<GoalSizingWizardWithPhasesProps> = ({
  forcePhase,
  onComplete,
  showPhaseSelection = true
}) => {
  const navigate = useNavigate();
  const { config, saveConfig } = useGoalSizing();
  const [userContext, setUserContext] = useState<UserContext>({
    hasImportedData: false,
    tradeCount: 0,
    accountValue: 10000,
    timeSpentInApp: 0,
    hasCompletedBasicGoals: false
  });
  const [currentMode, setCurrentMode] = useState<'phased' | 'full' | 'quick'>('phased');
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);

  // Load user context from localStorage or API
  useEffect(() => {
    loadUserContext();
  }, []);

  const loadUserContext = () => {
    try {
      // Check for imported data (look for trades in localStorage or context)
      const hasImportedData = localStorage.getItem('importedTrades') !== null || 
                             localStorage.getItem('csvData') !== null;
      
      // Check for existing goals
      const hasCompletedBasicGoals = config !== null;
      
      // Get trade count from stored data
      const storedTrades = localStorage.getItem('importedTrades');
      const tradeCount = storedTrades ? JSON.parse(storedTrades).length : 0;
      
      // Get account value from config or default
      const accountValue = config?.capitalObjectiveParameters?.currentBalance || 10000;
      
      // Calculate time spent (simplified - in real app would track this)
      const timeSpentInApp = parseInt(localStorage.getItem('timeSpentInApp') || '0');
      
      setUserContext({
        hasImportedData,
        tradeCount,
        accountValue,
        timeSpentInApp,
        hasCompletedBasicGoals,
        lastLoginDate: new Date()
      });
    } catch (error) {
      console.error('Error loading user context:', error);
    }
  };

  const handlePhaseComplete = (phase: number) => {
    setCompletedPhases(prev => [...prev, phase]);
    
    // Update time spent
    const currentTime = parseInt(localStorage.getItem('timeSpentInApp') || '0');
    localStorage.setItem('timeSpentInApp', (currentTime + 15).toString());
    
    // Reload context to reflect changes
    loadUserContext();
  };

  const handleGoalCreated = async (goal: any) => {
    await saveConfig(goal);
    
    // Mark basic goals as completed
    setUserContext(prev => ({
      ...prev,
      hasCompletedBasicGoals: true
    }));
    
    if (onComplete) {
      onComplete(goal);
    }
  };

  const handleImportDataSuggestion = () => {
    navigate('/import');
  };

  const renderModeSelector = () => {
    if (!showPhaseSelection) return null;

    return (
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Choose Your Goal Setting Experience</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Button
            variant={currentMode === 'quick' ? 'default' : 'outline'}
            onClick={() => setCurrentMode('quick')}
            className="p-4 h-auto flex flex-col items-start"
          >
            <div className="font-medium mb-1">Quick Setup</div>
            <div className="text-sm text-left">
              Set basic goals in 2 minutes
            </div>
          </Button>
          
          <Button
            variant={currentMode === 'phased' ? 'default' : 'outline'}
            onClick={() => setCurrentMode('phased')}
            className="p-4 h-auto flex flex-col items-start"
          >
            <div className="font-medium mb-1">Phased Onboarding</div>
            <div className="text-sm text-left">
              Guided experience based on your data
            </div>
          </Button>
          
          <Button
            variant={currentMode === 'full' ? 'default' : 'outline'}
            onClick={() => setCurrentMode('full')}
            className="p-4 h-auto flex flex-col items-start"
          >
            <div className="font-medium mb-1">Complete Wizard</div>
            <div className="text-sm text-left">
              Full configuration with all options
            </div>
          </Button>
        </div>
      </Card>
    );
  };

  const renderQuickSetup = () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Goal Setup</h3>
      <p className="text-gray-600 mb-6">
        Get started quickly with essential goal settings. You can always enhance these later.
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">What's your primary trading objective?</label>
          <select className="w-full p-3 border rounded-md">
            <option value="growth">Grow my account steadily</option>
            <option value="income">Generate regular income</option>
            <option value="preservation">Preserve capital while learning</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">How much risk are you comfortable with per trade?</label>
          <select className="w-full p-3 border rounded-md">
            <option value="1">Conservative - 1% per trade</option>
            <option value="2">Moderate - 2% per trade</option>
            <option value="3">Aggressive - 3% per trade</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Current account value</label>
          <input 
            type="number" 
            placeholder="e.g., 10000"
            className="w-full p-3 border rounded-md"
            defaultValue={userContext.accountValue}
          />
        </div>
        
        <Alert>
          <div>
            <h4 className="font-medium">Quick Setup Benefits</h4>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Get started trading immediately</li>
              <li>• Basic position sizing calculations</li>
              <li>• Can upgrade to detailed goals anytime</li>
              <li>• Perfect for beginners</li>
            </ul>
          </div>
        </Alert>
        
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={() => handleGoalCreated({ type: 'quick', timestamp: Date.now() })}
            className="flex-1"
          >
            Create Quick Goals
          </Button>
          <Button 
            variant="outline"
            onClick={() => setCurrentMode('phased')}
            className="flex-1"
          >
            Use Guided Setup
          </Button>
        </div>
      </div>
    </Card>
  );

  const renderDataImportSuggestion = () => {
    if (userContext.hasImportedData) return null;

    return (
      <Alert className="mb-6">
        <div>
          <h4 className="font-medium">💡 Enhance Your Experience</h4>
          <p className="text-sm mt-1">
            Import your trading data to unlock personalized goal recommendations and advanced features.
          </p>
          <Button 
            variant="outline" 
            onClick={handleImportDataSuggestion}
            className="mt-2"
          >
            Import Trading Data
          </Button>
        </div>
      </Alert>
    );
  };

  // Force specific mode if requested
  useEffect(() => {
    if (forcePhase === 1) setCurrentMode('quick');
    else if (forcePhase === 2 || forcePhase === 3) setCurrentMode('phased');
  }, [forcePhase]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Trading Goal Setup</h1>
        <p className="text-gray-600">
          Configure your trading goals with an experience tailored to your needs and available data.
        </p>
      </div>

      {renderDataImportSuggestion()}
      {renderModeSelector()}

      {currentMode === 'quick' && renderQuickSetup()}
      
      {currentMode === 'phased' && (
        <PhasedOnboardingManager
          userContext={userContext}
          onPhaseComplete={handlePhaseComplete}
          onGoalCreated={handleGoalCreated}
        />
      )}
      
      {currentMode === 'full' && (
        <div>
          <Alert className="mb-6">
            <div>
              <h4 className="font-medium">Complete Goal Configuration</h4>
              <p className="text-sm mt-1">
                Full wizard with all advanced options and detailed configuration.
              </p>
            </div>
          </Alert>
          <GoalSizingWizard 
            isOpen={true}
            onClose={() => setCurrentMode('phased')}
            onComplete={handleGoalCreated}
          />
        </div>
      )}

      {/* Progress Summary */}
      {completedPhases.length > 0 && (
        <Card className="mt-8 p-6 bg-green-50">
          <h4 className="font-medium text-green-800 mb-2">🎉 Progress Summary</h4>
          <div className="text-sm text-green-700">
            <p>You've completed {completedPhases.length} onboarding phase(s)!</p>
            {userContext.hasImportedData && (
              <p className="mt-1">✓ Trading data imported - advanced features unlocked</p>
            )}
            {userContext.hasCompletedBasicGoals && (
              <p className="mt-1">✓ Basic goals configured - ready to start trading</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default GoalSizingWizardWithPhases; 