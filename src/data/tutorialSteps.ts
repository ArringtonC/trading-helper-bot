import { TutorialStep, GameificationElements } from '../types/Tutorial';

export const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: "👋 Welcome to Smart Trading",
    concept: "Why Position Sizing Matters",
    explanation: "Most traders fail because they risk too much on each trade. We'll teach you the math that keeps you safe!",
    analogy: "Think of your account like HP in a video game. Each bad trade damages your HP. Position sizing controls how much damage you can take.",
    interactive: false,
    completion: "I understand why position sizing is important"
  },
  {
    id: 2,
    title: "💰 Your Trading Account",
    concept: "Account Balance Foundation",
    explanation: "Your account balance determines everything else. It's like your starting budget for a strategy game.",
    analogy: "If you have $6,000, that's your total 'gold' to work with. Spend too much on one item and you can't buy anything else!",
    interactive: true,
    component: "AccountBalanceInput",
    validation: (value: number) => value >= 2000,
    hint: "Enter your real account balance. Be honest - this affects everything!",
    completion: "I've entered my account balance"
  },
  {
    id: 3,
    title: "🎯 Setting Your Goal",
    concept: "Where Do You Want To Go?",
    explanation: "Every successful trader has a target. This isn't just wishful thinking - it determines your strategy.",
    analogy: "Like setting a destination in GPS, your goal tells us the best route to take.",
    interactive: true,
    component: "GoalSelector",
    options: ["Conservative (+25%)", "Moderate (+50%)", "Aggressive (+100%)"],
    hint: "Start conservative! You can always increase goals later.",
    completion: "I've set a realistic goal"
  },
  {
    id: 4,
    title: "⚖️ Understanding Risk",
    concept: "How Much Can You Lose Per Trade?",
    explanation: "This is THE most important concept. Risk percentage = how much of your account you're willing to lose on ONE trade.",
    analogy: "Imagine your account balance as lives in a video game. 2% risk = you can lose 50 times before game over. 10% risk = only 10 lives!",
    interactive: true,
    component: "RiskPercentageDemo",
    demoData: {
      account: 6000,
      risks: [0.5, 1, 2, 5, 10],
      outcomes: "Show survival rate for each"
    },
    completion: "I understand how risk percentage affects my survival"
  },
  {
    id: 5,
    title: "🧮 The Math Magic",
    concept: "Calculating Your Position Size",
    explanation: "Now we do the math! Position size = (Account × Risk%) ÷ Max Loss per trade",
    analogy: "It's like calculating how many lottery tickets you can buy with your budget, knowing each ticket costs different amounts.",
    interactive: true,
    component: "PositionSizeCalculator",
    showFormula: true,
    realTimeExample: true,
    completion: "I can calculate position sizes"
  },
  {
    id: 6,
    title: "📊 Market Volatility (VIX)",
    concept: "Adjusting for Market Conditions",
    explanation: "When markets are scary (high VIX), smart traders reduce position sizes. When calm, you can trade more.",
    analogy: "Like driving slower in a storm and faster on clear roads. VIX tells you the 'weather' in the market.",
    interactive: true,
    component: "VIXDemo",
    scenarios: ["Calm Market (VIX 15)", "Normal (VIX 20)", "Stormy (VIX 35)"],
    completion: "I understand how market conditions affect position sizing"
  },
  {
    id: 7,
    title: "🎲 Kelly Criterion (Advanced)",
    concept: "Optimizing Your Edge",
    explanation: "If you know your win rate and average wins/losses, Kelly Criterion calculates the mathematically optimal position size.",
    analogy: "Like a casino calculating optimal bet sizes. If you have an edge, Kelly tells you how much to bet.",
    interactive: true,
    component: "KellyDemo",
    warning: "Only use this if you have real historical data!",
    completion: "I understand Kelly Criterion optimization"
  },
  {
    id: 8,
    title: "🛡️ Safety Checks",
    concept: "Account Size Validation",
    explanation: "Even with perfect math, some accounts are too small for safe options trading. We'll check if yours is ready.",
    analogy: "Like checking if you have enough gas before a road trip. Better to know now than break down halfway!",
    interactive: true,
    component: "AccountValidation",
    completion: "I know if my account is ready for trading"
  },
  {
    id: 9,
    title: "📈 Putting It All Together",
    concept: "Your Complete Position Sizing Strategy",
    explanation: "Now you see how everything connects: Goal → Risk → Position Size → VIX Adjustment → Kelly Optimization",
    analogy: "Like assembling a complete gaming strategy where every piece works together for maximum success.",
    interactive: true,
    component: "FullCalculatorReview",
    completion: "I have a complete position sizing strategy"
  },
  {
    id: 10,
    title: "🎉 Graduation!",
    concept: "You're Ready to Trade Smart",
    explanation: "Congratulations! You now understand position sizing better than 85% of traders. This knowledge will protect your account.",
    analogy: "You've leveled up from novice to skilled trader. Your account survival rate just increased dramatically!",
    interactive: false,
    component: "GraduationCertificate",
    unlocks: ["Strategy Visualizer", "Live Trading", "Advanced Features"],
    completion: "I'm ready to trade with proper position sizing"
  }
];

export const gamificationElements: GameificationElements = {
  badges: {
    riskMaster: {
      id: 'riskMaster',
      name: 'Risk Master',
      icon: '🛡️',
      description: 'Completed risk assessment with safe parameters',
      earned: false
    },
    mathWizard: {
      id: 'mathWizard',
      name: 'Math Wizard',
      icon: '🧮',
      description: 'Successfully calculated position sizes',
      earned: false
    },
    marketReader: {
      id: 'marketReader',
      name: 'Market Reader',
      icon: '📊',
      description: 'Understood VIX scaling and market conditions',
      earned: false
    },
    kellyExpert: {
      id: 'kellyExpert',
      name: 'Kelly Expert',
      icon: '🎯',
      description: 'Mastered Kelly Criterion optimization',
      earned: false
    },
    safeTrader: {
      id: 'safeTrader',
      name: 'Safe Trader',
      icon: '✅',
      description: 'Passed all safety checks and validations',
      earned: false
    },
    goalSetter: {
      id: 'goalSetter',
      name: 'Goal Setter',
      icon: '🎯',
      description: 'Set realistic trading goals',
      earned: false
    },
    strategist: {
      id: 'strategist',
      name: 'Master Strategist',
      icon: '🏆',
      description: 'Completed the full position sizing strategy',
      earned: false
    },
    graduate: {
      id: 'graduate',
      name: 'Position Sizing Graduate',
      icon: '🎓',
      description: 'Completed the entire tutorial successfully',
      earned: false
    }
  },
  
  achievements: {
    firstCalculation: {
      id: 'firstCalculation',
      title: 'First Calculation',
      description: 'Calculated your first position size!',
      xpReward: 50,
      unlocked: false
    },
    safeRisk: {
      id: 'safeRisk',
      title: 'Safety First',
      description: 'Chose a safe risk percentage (≤2%)!',
      xpReward: 75,
      unlocked: false
    },
    completedTutorial: {
      id: 'completedTutorial',
      title: 'Tutorial Master',
      description: 'Completed all tutorial steps!',
      xpReward: 200,
      unlocked: false
    },
    advancedUser: {
      id: 'advancedUser',
      title: 'Advanced Trader',
      description: 'Unlocked advanced features!',
      xpReward: 150,
      unlocked: false
    },
    perfectScore: {
      id: 'perfectScore',
      title: 'Perfect Score',
      description: 'Completed tutorial with optimal choices!',
      xpReward: 300,
      unlocked: false
    }
  },
  
  progressRewards: {
    step3: "🎁 Unlocked: Goal tracking dashboard",
    step5: "🎁 Unlocked: Advanced position calculator",
    step7: "🎁 Unlocked: Kelly Criterion optimizer",
    step10: "🎁 Unlocked: Strategy visualizer & live trading mode"
  },
  
  soundEffects: {
    stepComplete: '/sounds/step-complete.mp3',
    badgeEarned: '/sounds/badge-earned.mp3',
    levelUp: '/sounds/level-up.mp3',
    warning: '/sounds/warning.mp3'
  }
}; 