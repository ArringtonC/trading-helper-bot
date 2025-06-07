import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/button';
import { Alert } from '../ui/alert';
import { Badge } from '../ui/Badge';
import GoalSizingWizard from './GoalSizingWizard';

interface UserContext {
  hasImportedData: boolean;
  tradeCount: number;
  accountValue: number;
  timeSpentInApp: number; // minutes
  hasCompletedBasicGoals: boolean;
  lastLoginDate?: Date;
}

interface OnboardingPhase {
  phase: 1 | 2 | 3;
  title: string;
  description: string;
  features: string[];
  requirements?: string[];
}

const ONBOARDING_PHASES: OnboardingPhase[] = [
  {
    phase: 1,
    title: "Quick Goal Setting",
    description: "Set basic trading goals to get oriented with the platform",
    features: [
      "Simple goal selection",
      "Basic risk tolerance",
      "Account size input",
      "Quick position sizing preview"
    ]
  },
  {
    phase: 2,
    title: "Detailed Goal Configuration",
    description: "Complete comprehensive goal setup after importing your first data",
    features: [
      "Enhanced position sizing",
      "Trade statistics analysis",
      "Risk management rules",
      "Goal validation with real data"
    ],
    requirements: [
      "Import trading data",
      "Complete Phase 1 goals"
    ]
  },
  {
    phase: 3,
    title: "Advanced Goal Optimization",
    description: "Optimize goals based on historical performance and market analysis",
    features: [
      "AI-powered goal recommendations",
      "Historical performance analysis",
      "Market condition adjustments",
      "Advanced risk metrics"
    ],
    requirements: [
      "Complete Phase 2",
      "Have 30+ days of trading data",
      "Account value > $5,000"
    ]
  }
];

interface PhasedOnboardingManagerProps {
  userContext: UserContext;
  onPhaseComplete: (phase: number) => void;
  onGoalCreated: (goal: any) => void;
}

export const PhasedOnboardingManager: React.FC<PhasedOnboardingManagerProps> = ({
  userContext,
  onPhaseComplete,
  onGoalCreated
}) => {
  const [currentPhase, setCurrentPhase] = useState<number>(1);
  const [showFullWizard, setShowFullWizard] = useState(false);
  const [quickGoalData, setQuickGoalData] = useState<any>(null);

  // Determine appropriate phase based on user context
  useEffect(() => {
    const phase = determineUserPhase(userContext);
    setCurrentPhase(phase);
  }, [userContext]);

  const determineUserPhase = (context: UserContext): number => {
    // Phase 3: Advanced users with significant data
    if (context.hasImportedData && 
        context.tradeCount >= 30 && 
        context.accountValue > 5000 &&
        context.timeSpentInApp > 120) {
      return 3;
    }
    
    // Phase 2: Users who have imported data
    if (context.hasImportedData && context.hasCompletedBasicGoals) {
      return 2;
    }
    
    // Phase 1: New users or those without data
    return 1;
  };

  const handleQuickGoalSubmit = (goalData: any) => {
    setQuickGoalData(goalData);
    onGoalCreated(goalData);
    onPhaseComplete(1);
    
    // If user has data, suggest moving to Phase 2
    if (userContext.hasImportedData) {
      setCurrentPhase(2);
    }
  };

  const renderPhaseOverview = (phase: OnboardingPhase) => (
    <Card className="mb-6">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{phase.title}</h3>
          <Badge variant={currentPhase === phase.phase ? "default" : "secondary"}>
            Phase {phase.phase}
          </Badge>
        </div>
        <p className="text-gray-600 mb-4">{phase.description}</p>
        
        <div className="mb-4">
          <h4 className="font-medium mb-2">Features:</h4>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            {phase.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>

        {phase.requirements && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">Requirements:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              {phase.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );

  const renderQuickGoalSetting = () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Goal Setting</h3>
      <p className="text-gray-600 mb-6">
        Let's get you started with basic trading goals. You can always enhance these later.
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Primary Trading Goal</label>
          <select className="w-full p-2 border rounded-md">
            <option value="growth">Capital Growth</option>
            <option value="income">Income Generation</option>
            <option value="preservation">Capital Preservation</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Risk Tolerance</label>
          <select className="w-full p-2 border rounded-md">
            <option value="conservative">Conservative (1-2% per trade)</option>
            <option value="moderate">Moderate (2-3% per trade)</option>
            <option value="aggressive">Aggressive (3-5% per trade)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Account Size</label>
          <input 
            type="number" 
            placeholder="Enter account value"
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={() => handleQuickGoalSubmit({})}
            className="flex-1"
          >
            Create Quick Goals
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowFullWizard(true)}
            className="flex-1"
          >
            Use Full Wizard
          </Button>
        </div>
      </div>
    </Card>
  );

  const renderPhaseRecommendation = () => {
    const recommendedPhase = ONBOARDING_PHASES[currentPhase - 1];
    const canAccessPhase2 = userContext.hasImportedData && userContext.hasCompletedBasicGoals;
    const canAccessPhase3 = canAccessPhase2 && userContext.tradeCount >= 30 && userContext.accountValue > 5000;

    return (
      <Alert className="mb-6">
        <div>
          <h4 className="font-medium">Recommended: {recommendedPhase.title}</h4>
          <p className="text-sm mt-1">{recommendedPhase.description}</p>
          
          {currentPhase === 1 && !userContext.hasImportedData && (
            <p className="text-sm mt-2 text-blue-600">
              💡 Tip: Import your trading data to unlock advanced features
            </p>
          )}
          
          {currentPhase === 2 && !canAccessPhase3 && (
            <p className="text-sm mt-2 text-blue-600">
              💡 Continue trading to unlock Phase 3 advanced optimization
            </p>
          )}
        </div>
      </Alert>
    );
  };

  if (showFullWizard) {
    return (
      <div>
        <div className="mb-4">
          <Button 
            variant="outline" 
            onClick={() => setShowFullWizard(false)}
            className="mb-4"
          >
            ← Back to Phased Onboarding
          </Button>
        </div>
        <GoalSizingWizard 
          isOpen={true}
          onClose={() => setShowFullWizard(false)}
          onComplete={onGoalCreated}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Goal Setting Onboarding</h2>
        <p className="text-gray-600">
          We'll guide you through setting up your trading goals based on your experience level and available data.
        </p>
      </div>

      {renderPhaseRecommendation()}

      {currentPhase === 1 && !userContext.hasCompletedBasicGoals && (
        <div className="mb-8">
          {renderQuickGoalSetting()}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {ONBOARDING_PHASES.map((phase) => (
          <div key={phase.phase}>
            {renderPhaseOverview(phase)}
            
            <div className="mt-4">
              {phase.phase === 1 && (
                <Button 
                  className="w-full"
                  onClick={() => setCurrentPhase(1)}
                  variant={currentPhase === 1 ? "default" : "outline"}
                >
                  Start Phase 1
                </Button>
              )}
              
              {phase.phase === 2 && (
                <Button 
                  className="w-full"
                  onClick={() => setShowFullWizard(true)}
                  disabled={!userContext.hasImportedData}
                  variant={currentPhase === 2 ? "default" : "outline"}
                >
                  {userContext.hasImportedData ? "Start Phase 2" : "Import Data First"}
                </Button>
              )}
              
              {phase.phase === 3 && (
                <Button 
                  className="w-full"
                  onClick={() => setCurrentPhase(3)}
                  disabled={userContext.tradeCount < 30 || userContext.accountValue < 5000}
                  variant={currentPhase === 3 ? "default" : "outline"}
                >
                  {userContext.tradeCount >= 30 && userContext.accountValue >= 5000 
                    ? "Start Phase 3" 
                    : "Requirements Not Met"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">Your Progress</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Basic Goals Set:</span>
            <span className={userContext.hasCompletedBasicGoals ? "text-green-600" : "text-gray-500"}>
              {userContext.hasCompletedBasicGoals ? "✓ Complete" : "Pending"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Data Imported:</span>
            <span className={userContext.hasImportedData ? "text-green-600" : "text-gray-500"}>
              {userContext.hasImportedData ? "✓ Complete" : "Pending"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Trade Count:</span>
            <span>{userContext.tradeCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Time in App:</span>
            <span>{Math.round(userContext.timeSpentInApp)} minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhasedOnboardingManager; 