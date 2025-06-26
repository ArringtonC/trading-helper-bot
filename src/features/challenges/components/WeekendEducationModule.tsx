import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Progress,
  Tag,
  Alert,
  Tabs,
  List,
  Avatar,
  Badge,
  Statistic,
  Row,
  Col,
  Modal,
  Timeline,
  Collapse
} from 'antd';
import {
  BookOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  CalendarOutlined,
  StarOutlined,
  RocketOutlined,
  BulbOutlined,
  ExperimentOutlined,
  BarChartOutlined,
  TeamOutlined,
  FireOutlined
} from '@ant-design/icons';
import type { Challenge } from '../types/challenge';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface WeekendEducationModuleProps {
  challenge: Challenge;
  onModuleComplete: (moduleId: string, xpEarned: number) => void;
  onSkillPointsEarned: (skillCategory: string, points: number) => void;
  currentDay: number;
  className?: string;
}

interface EducationModule {
  id: string;
  title: string;
  description: string;
  category: 'PSYCHOLOGY' | 'TECHNICAL' | 'RISK_MANAGEMENT' | 'STRATEGY' | 'MARKET_ANALYSIS';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedMinutes: number;
  xpReward: number;
  skillPoints: number;
  prerequisites?: string[];
  content: ModuleContent;
  quiz?: QuizQuestion[];
  practicalExercise?: PracticalExercise;
  status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt?: Date;
  score?: number;
}

interface ModuleContent {
  sections: ContentSection[];
  keyTakeaways: string[];
  actionItems: string[];
  resources: Resource[];
}

interface ContentSection {
  title: string;
  content: string;
  examples?: string[];
  tips?: string[];
}

interface Resource {
  title: string;
  type: 'ARTICLE' | 'VIDEO' | 'BOOK' | 'TOOL';
  url?: string;
  description: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface PracticalExercise {
  title: string;
  description: string;
  steps: string[];
  expectedOutcome: string;
  bonusXP: number;
}

const WeekendEducationModule: React.FC<WeekendEducationModuleProps> = ({
  challenge,
  onModuleComplete,
  onSkillPointsEarned,
  currentDay,
  className = ''
}) => {
  const [modules, setModules] = useState<EducationModule[]>([]);
  const [activeModule, setActiveModule] = useState<EducationModule | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    initializeModules();
  }, [challenge]);

  const initializeModules = () => {
    const allModules = generateEducationModules(challenge);
    setModules(allModules);
  };

  const generateEducationModules = (challenge: Challenge): EducationModule[] => {
    const baseModules: EducationModule[] = [
      {
        id: 'trading-psychology-mastery',
        title: '🧠 Trading Psychology Mastery',
        description: 'Master the mental game of trading and develop unshakeable discipline',
        category: 'PSYCHOLOGY',
        difficulty: 'INTERMEDIATE',
        estimatedMinutes: 25,
        xpReward: 100,
        skillPoints: 3,
        status: 'AVAILABLE',
        content: {
          sections: [
            {
              title: 'The Psychology of Fear and Greed',
              content: 'Fear and greed are the two primary emotions that drive poor trading decisions. Fear causes us to exit winning trades too early or avoid taking trades altogether. Greed makes us hold losing trades too long or risk too much on a single trade.',
              examples: [
                'Fear: Exiting a profitable trade at +$50 when your target was +$200',
                'Greed: Risking 10% of your account on one "sure thing" trade'
              ],
              tips: [
                'Set profit targets and stop losses BEFORE entering a trade',
                'Use position sizing to manage emotional attachment to trades',
                'Practice mindfulness and recognize emotional states'
              ]
            },
            {
              title: 'Developing Trading Discipline',
              content: 'Discipline is the ability to follow your trading plan even when emotions are running high. It\'s what separates profitable traders from those who struggle.',
              examples: [
                'Following your stop loss even when you "feel" the trade will turn around',
                'Waiting for A+ setups instead of forcing trades when bored'
              ],
              tips: [
                'Start with small position sizes to reduce emotional pressure',
                'Keep a trading journal to track emotional states',
                'Celebrate discipline victories, not just profitable trades'
              ]
            }
          ],
          keyTakeaways: [
            'Emotions are the enemy of profitable trading',
            'Discipline beats intelligence in trading',
            'Your mindset determines your trading success',
            'Fear and greed can be managed with proper preparation'
          ],
          actionItems: [
            'Complete the patience meditation task every morning',
            'Rate your emotional state before each trade (1-10)',
            'Review trades for emotional decision-making patterns',
            'Practice visualization of perfect trade execution'
          ],
          resources: [
            {
              title: 'Trading in the Zone by Mark Douglas',
              type: 'BOOK',
              description: 'The classic book on trading psychology and mindset'
            },
            {
              title: 'The Mental Game of Trading',
              type: 'ARTICLE',
              description: 'Comprehensive guide to developing mental toughness'
            }
          ]
        },
        quiz: [
          {
            id: 'q1',
            question: 'What are the two primary emotions that cause trading mistakes?',
            options: ['Hope and Fear', 'Fear and Greed', 'Greed and Anger', 'Excitement and Boredom'],
            correctAnswer: 1,
            explanation: 'Fear and greed are the two primary emotions that drive poor trading decisions.'
          },
          {
            id: 'q2',
            question: 'What is the best way to reduce emotional attachment to trades?',
            options: ['Trade larger sizes', 'Use proper position sizing', 'Trade more frequently', 'Avoid stop losses'],
            correctAnswer: 1,
            explanation: 'Proper position sizing reduces the emotional impact of individual trades.'
          }
        ],
        practicalExercise: {
          title: 'Emotional State Tracking',
          description: 'Track your emotional state before, during, and after trades for one week',
          steps: [
            '1. Rate your emotional state (1-10) before entering any trade',
            '2. Note any emotions felt during the trade (fear, excitement, etc.)',
            '3. Record your emotional state after closing the trade',
            '4. Look for patterns between emotional states and trade outcomes'
          ],
          expectedOutcome: 'Increased awareness of how emotions affect your trading decisions',
          bonusXP: 50
        }
      },
      {
        id: 'risk-management-fundamentals',
        title: '🛡️ Risk Management Fundamentals',
        description: 'Learn to protect your capital with professional risk management techniques',
        category: 'RISK_MANAGEMENT',
        difficulty: 'BEGINNER',
        estimatedMinutes: 20,
        xpReward: 80,
        skillPoints: 4,
        status: 'AVAILABLE',
        content: {
          sections: [
            {
              title: 'The 1% Rule',
              content: 'Never risk more than 1% of your total account on a single trade. This rule ensures you can survive a long string of losses and continue trading.',
              examples: [
                '$10,000 account = Maximum $100 risk per trade',
                '$50,000 account = Maximum $500 risk per trade'
              ],
              tips: [
                'Calculate your position size based on your stop loss distance',
                'Use a position size calculator to avoid errors',
                'Be even more conservative when starting out (0.5% rule)'
              ]
            },
            {
              title: 'Risk-Reward Ratios',
              content: 'Always aim for at least a 2:1 risk-reward ratio. This means if you risk $100, you should aim to make at least $200.',
              examples: [
                'Risk $100, Target $200 = 2:1 ratio',
                'Risk $50, Target $150 = 3:1 ratio'
              ],
              tips: [
                'Set your profit target before entering the trade',
                'Don\'t move your stop loss against you',
                'Take partial profits to lock in gains'
              ]
            }
          ],
          keyTakeaways: [
            'Capital preservation is more important than profit maximization',
            'The 1% rule protects you from catastrophic losses',
            'Risk-reward ratios determine long-term profitability',
            'Position sizing is your most important tool'
          ],
          actionItems: [
            'Calculate your maximum risk per trade (1% of account)',
            'Use a position size calculator for every trade',
            'Set 2:1 minimum risk-reward ratio for all trades',
            'Review and adjust risk parameters weekly'
          ],
          resources: [
            {
              title: 'Position Size Calculator',
              type: 'TOOL',
              description: 'Online calculator for determining position sizes'
            },
            {
              title: 'Risk Management for Traders',
              type: 'ARTICLE',
              description: 'Comprehensive guide to risk management techniques'
            }
          ]
        },
        quiz: [
          {
            id: 'q1',
            question: 'What is the maximum percentage of your account you should risk on a single trade?',
            options: ['5%', '2%', '1%', '0.5%'],
            correctAnswer: 2,
            explanation: 'The 1% rule is the standard for professional risk management.'
          },
          {
            id: 'q2',
            question: 'What is the minimum risk-reward ratio you should target?',
            options: ['1:1', '1:2', '2:1', '3:1'],
            correctAnswer: 2,
            explanation: 'A 2:1 risk-reward ratio means you make twice what you risk.'
          }
        ]
      },
      {
        id: 'technical-analysis-mastery',
        title: '📊 Technical Analysis Mastery',
        description: 'Master chart patterns, indicators, and technical analysis techniques',
        category: 'TECHNICAL',
        difficulty: 'INTERMEDIATE',
        estimatedMinutes: 30,
        xpReward: 120,
        skillPoints: 4,
        status: challenge.masteryLevels.setupQuality >= 5 ? 'AVAILABLE' : 'LOCKED',
        prerequisites: ['risk-management-fundamentals'],
        content: {
          sections: [
            {
              title: 'Support and Resistance',
              content: 'Support and resistance levels are the foundation of technical analysis. Support is a price level where buying interest is expected to emerge, while resistance is where selling pressure typically appears.',
              examples: [
                'A stock bouncing off $50 multiple times = $50 support',
                'A stock failing to break above $60 multiple times = $60 resistance'
              ],
              tips: [
                'Look for at least 2-3 touches to confirm a level',
                'Round numbers often act as psychological support/resistance',
                'Volume confirmation strengthens support/resistance levels'
              ]
            }
          ],
          keyTakeaways: [
            'Support and resistance guide entry and exit decisions',
            'Volume confirms the strength of price levels',
            'Multiple timeframe analysis improves accuracy'
          ],
          actionItems: [
            'Identify key support/resistance on your watchlist',
            'Practice drawing levels on historical charts',
            'Combine with other indicators for confirmation'
          ],
          resources: [
            {
              title: 'Technical Analysis Explained',
              type: 'BOOK',
              description: 'Comprehensive guide to technical analysis'
            }
          ]
        }
      }
    ];

    // Filter based on challenge progress and unlock conditions
    return baseModules.map(module => ({
      ...module,
      status: determineModuleStatus(module, challenge, completedModules)
    }));
  };

  const determineModuleStatus = (
    module: EducationModule,
    challenge: Challenge,
    completed: Set<string>
  ): 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' => {
    if (completed.has(module.id)) return 'COMPLETED';
    
    // Check prerequisites
    if (module.prerequisites) {
      const hasPrerequisites = module.prerequisites.every(prereq => completed.has(prereq));
      if (!hasPrerequisites) return 'LOCKED';
    }

    // Check skill level requirements
    switch (module.category) {
      case 'RISK_MANAGEMENT':
        return challenge.masteryLevels.riskManagement >= 3 ? 'AVAILABLE' : 'LOCKED';
      case 'PSYCHOLOGY':
        return challenge.masteryLevels.patience >= 3 ? 'AVAILABLE' : 'LOCKED';
      case 'TECHNICAL':
        return challenge.masteryLevels.setupQuality >= 5 ? 'AVAILABLE' : 'LOCKED';
      default:
        return 'AVAILABLE';
    }
  };

  const startModule = (module: EducationModule) => {
    setActiveModule(module);
    setCurrentSection(0);
    setQuizAnswers({});
    setQuizScore(null);
    
    // Update module status
    setModules(prev => prev.map(m => 
      m.id === module.id ? { ...m, status: 'IN_PROGRESS' } : m
    ));
  };

  const completeSection = () => {
    if (!activeModule) return;
    
    if (currentSection < activeModule.content.sections.length - 1) {
      setCurrentSection(prev => prev + 1);
    } else {
      // All sections completed, show quiz if available
      if (activeModule.quiz) {
        setShowQuiz(true);
      } else {
        completeModule();
      }
    }
  };

  const submitQuiz = () => {
    if (!activeModule?.quiz) return;
    
    const correct = activeModule.quiz.filter(
      (q, index) => quizAnswers[q.id] === q.correctAnswer
    ).length;
    
    const score = Math.round((correct / activeModule.quiz.length) * 100);
    setQuizScore(score);
    
    // Complete module if passed (70% or higher)
    if (score >= 70) {
      setTimeout(() => {
        completeModule(score);
      }, 2000);
    }
  };

  const completeModule = (score?: number) => {
    if (!activeModule) return;
    
    const xpEarned = activeModule.xpReward + (score && score >= 90 ? 20 : 0); // Bonus for high score
    
    setCompletedModules(prev => new Set([...prev, activeModule.id]));
    setModules(prev => prev.map(m => 
      m.id === activeModule.id 
        ? { ...m, status: 'COMPLETED', completedAt: new Date(), score }
        : m
    ));
    
    onModuleComplete(activeModule.id, xpEarned);
    onSkillPointsEarned(activeModule.category, activeModule.skillPoints);
    
    setActiveModule(null);
    setShowQuiz(false);
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'PSYCHOLOGY': <BulbOutlined />,
      'TECHNICAL': <BarChartOutlined />,
      'RISK_MANAGEMENT': <StarOutlined />,
      'STRATEGY': <RocketOutlined />,
      'MARKET_ANALYSIS': <ExperimentOutlined />
    };
    return icons[category as keyof typeof icons] || <BookOutlined />;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'PSYCHOLOGY': '#722ed1',
      'TECHNICAL': '#1890ff',
      'RISK_MANAGEMENT': '#52c41a',
      'STRATEGY': '#fa8c16',
      'MARKET_ANALYSIS': '#eb2f96'
    };
    return colors[category as keyof typeof colors] || '#d9d9d9';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      'BEGINNER': '#52c41a',
      'INTERMEDIATE': '#fa8c16',
      'ADVANCED': '#ff4d4f'
    };
    return colors[difficulty as keyof typeof colors] || '#d9d9d9';
  };

  if (activeModule) {
    const currentSectionData = activeModule.content.sections[currentSection];
    const isLastSection = currentSection === activeModule.content.sections.length - 1;
    
    return (
      <Card className={`weekend-education-active ${className}`}>
        <div className="mb-4">
          <Button 
            onClick={() => setActiveModule(null)}
            className="mb-4"
          >
            ← Back to Modules
          </Button>
          
          <div className="flex items-center justify-between mb-4">
            <Title level={3} className="mb-0">{activeModule.title}</Title>
            <Progress 
              percent={Math.round(((currentSection + 1) / activeModule.content.sections.length) * 100)}
              strokeColor={getCategoryColor(activeModule.category)}
              className="w-32"
            />
          </div>
        </div>
        
        <Card className="mb-4">
          <Title level={4}>{currentSectionData.title}</Title>
          <Paragraph>{currentSectionData.content}</Paragraph>
          
          {currentSectionData.examples && (
            <div className="mb-4">
              <Text strong>Examples:</Text>
              <ul className="mt-2">
                {currentSectionData.examples.map((example, index) => (
                  <li key={index} className="mb-1">{example}</li>
                ))}
              </ul>
            </div>
          )}
          
          {currentSectionData.tips && (
            <Alert
              message="💡 Pro Tips"
              description={
                <ul className="mt-2">
                  {currentSectionData.tips.map((tip, index) => (
                    <li key={index} className="mb-1">{tip}</li>
                  ))}
                </ul>
              }
              type="info"
              showIcon={false}
            />
          )}
        </Card>
        
        <div className="flex justify-between">
          <Button 
            disabled={currentSection === 0}
            onClick={() => setCurrentSection(prev => prev - 1)}
          >
            Previous
          </Button>
          <Button 
            type="primary"
            onClick={completeSection}
          >
            {isLastSection ? (activeModule.quiz ? 'Take Quiz' : 'Complete Module') : 'Next Section'}
          </Button>
        </div>
        
        {/* Quiz Modal */}
        <Modal
          title={`Quiz: ${activeModule.title}`}
          visible={showQuiz}
          onCancel={() => setShowQuiz(false)}
          footer={[
            <Button key="submit" type="primary" onClick={submitQuiz}>
              Submit Quiz
            </Button>
          ]}
          width={600}
        >
          {quizScore !== null ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">
                {quizScore >= 90 ? '🎆' : quizScore >= 70 ? '🎉' : '😔'}
              </div>
              <Title level={3}>Quiz Score: {quizScore}%</Title>
              <Paragraph>
                {quizScore >= 90 ? 'Excellent work! You\'ve mastered this material.' :
                 quizScore >= 70 ? 'Good job! You passed the quiz.' :
                 'You need 70% to pass. Review the material and try again.'}
              </Paragraph>
              {quizScore >= 70 && (
                <Alert
                  message={`+${activeModule.xpReward}${quizScore >= 90 ? ' +20 bonus' : ''} XP earned!`}
                  type="success"
                  showIcon
                />
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {activeModule.quiz?.map((question, index) => (
                <Card key={question.id} size="small">
                  <Paragraph strong>{index + 1}. {question.question}</Paragraph>
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex}>
                        <input
                          type="radio"
                          name={question.id}
                          value={optionIndex}
                          onChange={() => setQuizAnswers(prev => ({ ...prev, [question.id]: optionIndex }))}
                          className="mr-2"
                        />
                        <label>{option}</label>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Modal>
      </Card>
    );
  }

  const availableModules = modules.filter(m => m.status === 'AVAILABLE' || m.status === 'COMPLETED');
  const lockedModules = modules.filter(m => m.status === 'LOCKED');
  const completedCount = modules.filter(m => m.status === 'COMPLETED').length;
  const totalXP = modules.filter(m => m.status === 'COMPLETED').reduce((sum, m) => sum + m.xpReward, 0);

  return (
    <Card className={`weekend-education-module ${className}`} title="📚 Weekend Skill Building">
      {/* Progress Overview */}
      <div className="mb-6">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Statistic
              title="Modules Completed"
              value={completedCount}
              suffix={`/ ${modules.length}`}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="XP Earned"
              value={totalXP}
              prefix={<StarOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Knowledge Level"
              value={Math.round((completedCount / modules.length) * 100)}
              suffix="%"
              prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
            />
          </Col>
        </Row>
        
        <Progress 
          percent={Math.round((completedCount / modules.length) * 100)}
          strokeColor="#52c41a"
          className="mt-4"
        />
      </div>

      <Tabs defaultActiveKey="available">
        <TabPane tab={`Available (${availableModules.length})`} key="available">
          <List
            itemLayout="vertical"
            dataSource={availableModules}
            renderItem={module => (
              <List.Item
                key={module.id}
                actions={[
                  <Button 
                    key="start"
                    type={module.status === 'COMPLETED' ? 'default' : 'primary'}
                    icon={module.status === 'COMPLETED' ? <CheckCircleOutlined /> : <PlayCircleOutlined />}
                    onClick={() => startModule(module)}
                  >
                    {module.status === 'COMPLETED' ? 'Review' : 'Start Module'}
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      style={{ backgroundColor: getCategoryColor(module.category) }}
                      icon={getCategoryIcon(module.category)}
                    />
                  }
                  title={
                    <div className="flex items-center space-x-2">
                      <span>{module.title}</span>
                      {module.status === 'COMPLETED' && (
                        <Badge status="success" text="Completed" />
                      )}
                      <Tag color={getDifficultyColor(module.difficulty)}>
                        {module.difficulty}
                      </Tag>
                      <Tag color={getCategoryColor(module.category)}>
                        {getCategoryIcon(module.category)} {module.category.replace('_', ' ')}
                      </Tag>
                    </div>
                  }
                  description={module.description}
                />
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>🕒 {module.estimatedMinutes} min</span>
                  <span>⭐ {module.xpReward} XP</span>
                  <span>💪 {module.skillPoints} Skill Points</span>
                  {module.status === 'COMPLETED' && module.score && (
                    <span>🎯 {module.score}% Quiz Score</span>
                  )}
                </div>
              </List.Item>
            )}
          />
        </TabPane>
        
        <TabPane tab={`Locked (${lockedModules.length})`} key="locked">
          <List
            itemLayout="vertical"
            dataSource={lockedModules}
            renderItem={module => (
              <List.Item key={module.id} className="opacity-60">
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      style={{ backgroundColor: '#d9d9d9' }}
                      icon={getCategoryIcon(module.category)}
                    />
                  }
                  title={
                    <div className="flex items-center space-x-2">
                      <span>{module.title}</span>
                      <Tag color="default">LOCKED</Tag>
                    </div>
                  }
                  description={
                    <div>
                      <div>{module.description}</div>
                      {module.prerequisites && (
                        <div className="mt-2 text-sm text-gray-500">
                          🔒 Prerequisites: {module.prerequisites.join(', ')}
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>
      
      {/* Weekend Learning Tips */}
      <Alert
        message="🏖️ Weekend Learning Strategy"
        description={
          <div>
            <Paragraph className="mb-2">
              Weekends are perfect for skill development without market pressure:
            </Paragraph>
            <ul className="space-y-1">
              <li>• 📚 Saturday: Focus on learning new concepts and techniques</li>
              <li>• 📊 Sunday: Apply knowledge to market analysis and planning</li>
              <li>• 🎯 Complete modules to unlock advanced strategies</li>
              <li>• 💪 Earn skill points to improve your trading abilities</li>
            </ul>
          </div>
        }
        type="info"
        showIcon={false}
        className="mt-6"
      />
    </Card>
  );
};

export default WeekendEducationModule;
export type { WeekendEducationModuleProps, EducationModule };
