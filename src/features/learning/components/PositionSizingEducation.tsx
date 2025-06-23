import React, { useState, useCallback } from 'react';

interface PositionSizingEducationProps {
  accountBalance: number;
  stockPrice: number;
  stockSymbol: string;
  onSizeSelected: (positionSize: number) => void;
}

interface BiasScenario {
  id: string;
  title: string;
  description: string;
  bias: string;
  correctAnswer: number;
  commonMistakes: string[];
  explanation: string;
}

const PositionSizingEducation: React.FC<PositionSizingEducationProps> = ({
  accountBalance,
  stockPrice,
  stockSymbol,
  onSizeSelected
}) => {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [completedScenarios, setCompletedScenarios] = useState<number[]>([]);

  const costFor100Shares = stockPrice * 100;
  const maxSafePosition = Math.min(accountBalance * 0.10, costFor100Shares); // 10% rule
  const recommendedShares = Math.floor(maxSafePosition / stockPrice);

  const scenarios: BiasScenario[] = [
    {
      id: 'overconfidence',
      title: 'Overconfidence Bias Test',
      description: `You've made money on your last 3 trades. Your account is $${accountBalance.toLocaleString()}. How much should you risk on this ${stockSymbol} covered call?`,
      bias: 'Overconfidence after wins leads to increased position sizing',
      correctAnswer: Math.min(accountBalance * 0.10, costFor100Shares),
      commonMistakes: [
        'Risking 20-50% because "I\'m on a streak"',
        'Doubling position size from last trade',
        'Ignoring risk management rules due to recent success'
      ],
      explanation: `Research shows that after winning trades, most people increase position sizes due to overconfidence. The correct approach is to maintain consistent position sizing regardless of recent outcomes. Risk only 5-10% of your total account per position.`
    },
    {
      id: 'loss-aversion',
      title: 'Loss Aversion Bias Test',
      description: `Your last trade lost money. You want to "make it back" quickly. Your account is now $${(accountBalance * 0.95).toLocaleString()}. How much should you risk on ${stockSymbol}?`,
      bias: 'Loss aversion can lead to revenge trading or position reduction',
      correctAnswer: Math.min((accountBalance * 0.95) * 0.10, costFor100Shares),
      commonMistakes: [
        'Risking more to "make back" losses faster',
        'Avoiding trades entirely due to fear',
        'Emotional decision-making overriding rules'
      ],
      explanation: `After losses, traders either take excessive risks to recover quickly or become overly conservative. Both responses are emotional rather than logical. Maintain consistent sizing based on current account balance, not past performance.`
    },
    {
      id: 'kelly-misuse',
      title: 'Kelly Criterion Misapplication',
      description: `You've calculated Kelly suggests 25% position size for ${stockSymbol}. Your win rate is 60%, average win is 5%, average loss is 3%. What should you actually risk?`,
      bias: 'Misunderstanding Kelly Criterion leads to overleverage',
      correctAnswer: Math.min(accountBalance * 0.06, costFor100Shares), // 1/4 of Kelly
      commonMistakes: [
        'Using full Kelly percentage (25% in this case)',
        'Not adjusting for real-world constraints',
        'Ignoring that Kelly assumes unlimited bankroll'
      ],
      explanation: `Kelly Criterion often suggests position sizes that are too large for real trading. Professional traders use 1/4 to 1/2 of Kelly to account for estimation errors and psychological factors. Never use full Kelly in actual trading.`
    }
  ];

  const currentBiasScenario = scenarios[currentScenario];

  const handleAnswerSelect = (answer: number) => {
    setSelectedAnswer(answer);
    setShowExplanation(true);
  };

  const handleNextScenario = () => {
    if (!completedScenarios.includes(currentScenario)) {
      setCompletedScenarios([...completedScenarios, currentScenario]);
    }
    
    if (currentScenario < scenarios.length - 1) {
      setCurrentScenario(currentScenario + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // All scenarios completed, proceed with recommended size
      onSizeSelected(recommendedShares * stockPrice);
    }
  };

  const getAnswerOptions = () => {
    const correctAnswer = currentBiasScenario.correctAnswer;
    
    return [
      { value: correctAnswer, label: `$${correctAnswer.toLocaleString()} (5-10% rule)`, isCorrect: true },
      { value: correctAnswer * 2, label: `$${(correctAnswer * 2).toLocaleString()} (Double up)`, isCorrect: false },
      { value: correctAnswer * 0.5, label: `$${(correctAnswer * 0.5).toLocaleString()} (Very conservative)`, isCorrect: false },
      { value: accountBalance * 0.25, label: `$${(accountBalance * 0.25).toLocaleString()} (25% of account)`, isCorrect: false }
    ].sort(() => Math.random() - 0.5); // Randomize order
  };

  if (showExplanation) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {selectedAnswer === currentBiasScenario.correctAnswer ? '✅ Correct!' : '❌ Not Optimal'}
            </h2>
            <div className="text-lg text-gray-600">
              {currentBiasScenario.bias}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                🧠 What This Tests
              </h3>
              <p className="text-blue-700 text-sm leading-relaxed">
                {currentBiasScenario.explanation}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-red-800 mb-3">
                ⚠️ Common Mistakes
              </h3>
              <ul className="space-y-2">
                {currentBiasScenario.commonMistakes.map((mistake, index) => (
                  <li key={index} className="text-red-700 text-sm flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    {mistake}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-6">
            <h3 className="text-lg font-semibold text-green-800 mb-3">
              💡 Professional Approach
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-green-600 font-medium">Correct Amount</div>
                <div className="text-green-800 font-bold">
                  ${currentBiasScenario.correctAnswer.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-green-600 font-medium">% of Account</div>
                <div className="text-green-800 font-bold">
                  {((currentBiasScenario.correctAnswer / accountBalance) * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-green-600 font-medium">Shares</div>
                <div className="text-green-800 font-bold">
                  {Math.floor(currentBiasScenario.correctAnswer / stockPrice)}
                </div>
              </div>
              <div>
                <div className="text-green-600 font-medium">Risk Level</div>
                <div className="text-green-800 font-bold">Conservative</div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleNextScenario}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              {currentScenario < scenarios.length - 1 ? 'Next Scenario →' : 'Complete Position Sizing Education →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            🧠 Position Sizing Psychology Test
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Research shows cognitive biases significantly impact position sizing decisions
          </p>
          <div className="text-sm text-gray-500">
            Scenario {currentScenario + 1} of {scenarios.length}: {currentBiasScenario.title}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentScenario + 1) / scenarios.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Account Info */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-3">📊 Current Trading Context</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-blue-100 text-sm">Account Balance</div>
              <div className="text-xl font-bold">${accountBalance.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-blue-100 text-sm">{stockSymbol} Price</div>
              <div className="text-xl font-bold">${stockPrice}</div>
            </div>
            <div>
              <div className="text-blue-100 text-sm">100 Shares Cost</div>
              <div className="text-xl font-bold">${costFor100Shares.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-blue-100 text-sm">Safe Max (10%)</div>
              <div className="text-xl font-bold">${maxSafePosition.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Scenario Question */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {currentBiasScenario.title}
          </h3>
          <p className="text-gray-700 text-lg leading-relaxed">
            {currentBiasScenario.description}
          </p>
        </div>

        {/* Answer Options */}
        <div className="space-y-3 mb-6">
          <h4 className="text-lg font-semibold text-gray-800">
            How much should you invest in this position?
          </h4>
          {getAnswerOptions().map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option.value)}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                selectedAnswer === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="font-semibold text-gray-800">{option.label}</div>
              <div className="text-sm text-gray-600 mt-1">
                {((option.value / accountBalance) * 100).toFixed(1)}% of your account
              </div>
            </button>
          ))}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">
            🎯 Think About This:
          </h4>
          <p className="text-yellow-700 text-sm">
            Consider your emotional state, recent trading results, and what professional traders 
            would do in this situation. Don't let psychological biases drive your decision.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PositionSizingEducation; 