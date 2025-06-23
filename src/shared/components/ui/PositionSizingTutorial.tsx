import React, { useState, useCallback } from 'react';
import { tutorialSteps, gamificationElements } from '../../data/tutorialSteps';
import { TutorialStep, TutorialState, Badge, Achievement } from '../../types/Tutorial';
import TutorialProgress from './TutorialProgress';
import RiskPercentageDemo from './RiskPercentageDemo';
import PositionSizeCalculatorDemo from './PositionSizeCalculatorDemo';

interface PositionSizingTutorialProps {
  onComplete?: () => void;
  onExpertMode?: () => void;
}

const PositionSizingTutorial: React.FC<PositionSizingTutorialProps> = ({
  onComplete,
  onExpertMode
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showExpertMode, setShowExpertMode] = useState(false);
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    accountBalance: 6000,
    goalAmount: 12000,
    riskPercentage: 2,
    selectedGoalType: 'moderate',
    positionSize: 0,
    vixLevel: 20,
    kellyOptimal: 0,
    isAccountValid: false
  });
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);

  const handleStepComplete = useCallback((stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      const newCompletedSteps = [...completedSteps, stepId];
      setCompletedSteps(newCompletedSteps);
      
      // Award XP and check for badges/achievements
      checkForBadges(stepId);
      checkForAchievements(stepId, newCompletedSteps);
      
      // Move to next step or complete tutorial
      if (stepId < tutorialSteps.length) {
        setCurrentStep(stepId + 1);
      } else {
        // Tutorial completed
        setShowExpertMode(true);
        onComplete?.();
      }
    }
  }, [completedSteps, onComplete]);

  const checkForBadges = (stepId: number) => {
    const newBadges: Badge[] = [];
    
    switch (stepId) {
      case 3:
        newBadges.push({
          ...gamificationElements.badges.goalSetter,
          earned: true,
          earnedAt: new Date()
        });
        break;
      case 4:
        if (tutorialState.riskPercentage <= 2) {
          newBadges.push({
            ...gamificationElements.badges.riskMaster,
            earned: true,
            earnedAt: new Date()
          });
        }
        break;
      case 5:
        newBadges.push({
          ...gamificationElements.badges.mathWizard,
          earned: true,
          earnedAt: new Date()
        });
        break;
      case 6:
        newBadges.push({
          ...gamificationElements.badges.marketReader,
          earned: true,
          earnedAt: new Date()
        });
        break;
      case 7:
        newBadges.push({
          ...gamificationElements.badges.kellyExpert,
          earned: true,
          earnedAt: new Date()
        });
        break;
      case 8:
        if (tutorialState.isAccountValid) {
          newBadges.push({
            ...gamificationElements.badges.safeTrader,
            earned: true,
            earnedAt: new Date()
          });
        }
        break;
      case 9:
        newBadges.push({
          ...gamificationElements.badges.strategist,
          earned: true,
          earnedAt: new Date()
        });
        break;
      case 10:
        newBadges.push({
          ...gamificationElements.badges.graduate,
          earned: true,
          earnedAt: new Date()
        });
        break;
    }
    
    if (newBadges.length > 0) {
      setEarnedBadges(prev => [...prev, ...newBadges]);
    }
  };

  const checkForAchievements = (stepId: number, completedStepsList: number[]) => {
    const newAchievements: Achievement[] = [];
    
    // First calculation achievement
    if (stepId === 5 && !unlockedAchievements.find(a => a.id === 'firstCalculation')) {
      newAchievements.push({
        ...gamificationElements.achievements.firstCalculation,
        unlocked: true,
        unlockedAt: new Date()
      });
    }
    
    // Safe risk achievement
    if (stepId === 4 && tutorialState.riskPercentage <= 2 && !unlockedAchievements.find(a => a.id === 'safeRisk')) {
      newAchievements.push({
        ...gamificationElements.achievements.safeRisk,
        unlocked: true,
        unlockedAt: new Date()
      });
    }
    
    // Tutorial completion achievement
    if (completedStepsList.length === tutorialSteps.length && !unlockedAchievements.find(a => a.id === 'completedTutorial')) {
      newAchievements.push({
        ...gamificationElements.achievements.completedTutorial,
        unlocked: true,
        unlockedAt: new Date()
      });
    }
    
    if (newAchievements.length > 0) {
      setUnlockedAchievements(prev => [...prev, ...newAchievements]);
    }
  };

  const handleGoBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepComponent = (step: TutorialStep) => {
    if (!step.interactive) {
      return (
        <button 
          className="continue-button"
          onClick={() => handleStepComplete(currentStep)}
        >
          {step.completion} ✅
        </button>
      );
    }

    switch (step.component) {
      case 'AccountBalanceInput':
        return (
          <div className="account-input-demo">
            <label htmlFor="account-balance">Enter your account balance:</label>
            <input
              id="account-balance"
              type="number"
              min="2000"
              max="1000000"
              value={tutorialState.accountBalance}
              onChange={(e) => setTutorialState(prev => ({
                ...prev,
                accountBalance: Number(e.target.value)
              }))}
              className="account-input"
            />
            <p className="hint">{step.hint}</p>
            <button 
              className="complete-step"
              onClick={() => handleStepComplete(currentStep)}
              disabled={!step.validation?.(tutorialState.accountBalance)}
            >
              {step.completion} ✅
            </button>
          </div>
        );

      case 'GoalSelector':
        return (
          <div className="goal-selector-demo">
            <div className="goal-options">
              {step.options?.map((option, index) => (
                <button
                  key={index}
                  className={`goal-option ${tutorialState.selectedGoalType === ['conservative', 'moderate', 'aggressive'][index] ? 'selected' : ''}`}
                  onClick={() => setTutorialState(prev => ({
                    ...prev,
                    selectedGoalType: ['conservative', 'moderate', 'aggressive'][index] as any,
                    goalAmount: prev.accountBalance * (1 + [0.25, 0.5, 1.0][index])
                  }))}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="hint">{step.hint}</p>
            <button 
              className="complete-step"
              onClick={() => handleStepComplete(currentStep)}
            >
              {step.completion} ✅
            </button>
          </div>
        );

      case 'RiskPercentageDemo':
        return (
          <RiskPercentageDemo
            accountBalance={tutorialState.accountBalance}
            onComplete={() => handleStepComplete(currentStep)}
            onRiskChange={(risk) => setTutorialState(prev => ({ ...prev, riskPercentage: risk }))}
          />
        );

      case 'PositionSizeCalculator':
        return (
          <PositionSizeCalculatorDemo
            initialAccount={tutorialState.accountBalance}
            initialRisk={tutorialState.riskPercentage}
            onComplete={() => handleStepComplete(currentStep)}
            onCalculationChange={(calc) => setTutorialState(prev => ({ ...prev, positionSize: calc.positionSize }))}
          />
        );

      case 'VIXDemo':
        return (
          <div className="vix-demo">
            <h4>📊 VIX Market Conditions Demo</h4>
            <div className="vix-scenarios">
              {step.scenarios?.map((scenario, index) => (
                <div key={index} className="vix-scenario">
                  <h5>{scenario}</h5>
                  <p>Position adjustment: {['+10%', '0%', '-25%'][index]}</p>
                </div>
              ))}
            </div>
            <button 
              className="complete-step"
              onClick={() => handleStepComplete(currentStep)}
            >
              {step.completion} ✅
            </button>
          </div>
        );

      default:
        return (
          <div className="placeholder-component">
            <p>Interactive component: {step.component}</p>
            <button 
              className="complete-step"
              onClick={() => handleStepComplete(currentStep)}
            >
              {step.completion} ✅
            </button>
          </div>
        );
    }
  };

  if (showExpertMode) {
    return (
      <div className="expert-mode-transition">
        <h2>🎓 Congratulations! You've graduated!</h2>
        <p>You're now ready for the advanced position sizing interface.</p>
        <button onClick={onExpertMode} className="expert-mode-button">
          Enter Expert Mode 🚀
        </button>
      </div>
    );
  }

  const currentStepData = tutorialSteps.find(step => step.id === currentStep);
  
  if (!currentStepData) {
    return <div>Tutorial step not found</div>;
  }

  const totalXP = completedSteps.length * 100 + unlockedAchievements.reduce((sum, achievement) => sum + achievement.xpReward, 0);

  return (
    <div className="tutorial-container">
      <TutorialProgress 
        currentStep={currentStep}
        totalSteps={tutorialSteps.length}
        stepsCompleted={completedSteps.length}
        xpEarned={totalXP}
      />
      
      <div className="tutorial-step">
        <div className="step-header">
          <h2>{currentStepData.title}</h2>
          <div className="concept-badge">{currentStepData.concept}</div>
        </div>
        
        <div className="explanation-section">
          <p className="explanation">{currentStepData.explanation}</p>
          <div className="analogy">
            💡 <strong>Think of it like this:</strong> {currentStepData.analogy}
          </div>
          {currentStepData.warning && (
            <div className="warning">
              ⚠️ <strong>Warning:</strong> {currentStepData.warning}
            </div>
          )}
        </div>
        
        <div className="interactive-section">
          {renderStepComponent(currentStepData)}
        </div>
        
        <div className="progress-footer">
          {currentStep > 1 && (
            <button 
              className="back-button"
              onClick={handleGoBack}
            >
              ← Previous Step
            </button>
          )}
          
          {gamificationElements.progressRewards[`step${currentStep}` as keyof typeof gamificationElements.progressRewards] && (
            <div className="progress-reward">
              {gamificationElements.progressRewards[`step${currentStep}` as keyof typeof gamificationElements.progressRewards]}
            </div>
          )}
        </div>
      </div>

      {/* Badge notifications */}
      {earnedBadges.length > 0 && (
        <div className="badge-notifications">
          {earnedBadges.slice(-3).map((badge, index) => (
            <div key={badge.id} className="badge-notification">
              {badge.icon} Badge Earned: {badge.name}!
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PositionSizingTutorial; 