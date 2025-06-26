import React from 'react';
import type { DailyTask, Challenge, WorkflowTemplate, TimeSlot } from '../types/challenge';

interface WorkflowTemplateEngineProps {
  challenge: Challenge;
  currentDay: number;
  dayType: 'SUNDAY' | 'MONDAY' | 'EXECUTION' | 'FRIDAY' | 'WEEKEND';
  userPreferences?: WorkflowPreferences;
}

interface WorkflowPreferences {
  wakeUpTime?: string;
  marketPrepTime?: number; // minutes before market open
  tradingStyle: 'SCALPING' | 'DAY_TRADING' | 'SWING' | 'POSITION';
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  focusAreas: string[];
  weekendEducation: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  dayType: 'SUNDAY' | 'MONDAY' | 'EXECUTION' | 'FRIDAY' | 'WEEKEND';
  timeSlots: TimeSlot[];
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL';
  estimatedTotalMinutes: number;
  bonusXP: number;
}

export interface TimeSlot {
  id: string;
  name: string;
  emoji: string;
  startTime: string;
  endTime: string;
  description: string;
  tasks: TemplateTask[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  color: string;
}

interface TemplateTask {
  id: string;
  title: string;
  description: string;
  category: 'PRE_MARKET' | 'MARKET_HOURS' | 'POST_MARKET' | 'ANALYSIS' | 'PLANNING' | 'SKILL_BUILDING';
  estimatedMinutes: number;
  required: boolean;
  xpReward: number;
  skillCategory: 'PATIENCE' | 'RISK_MANAGEMENT' | 'SETUP_QUALITY' | 'STRATEGY_ADHERENCE';
  bonusXP?: number;
  conditions?: TaskCondition[];
}

interface TaskCondition {
  type: 'EXPERIENCE_LEVEL' | 'STRATEGY_CLASS' | 'DAY_OF_WEEK' | 'STREAK_BONUS';
  value: string | number;
  operator: 'EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS';
}

class DailyWorkflowTemplateEngine {
  private templates: WorkflowTemplate[] = [];

  constructor() {
    this.initializeTemplates();
  }

  generateDailyTasks(
    challenge: Challenge,
    currentDay: number,
    dayType: 'SUNDAY' | 'MONDAY' | 'EXECUTION' | 'FRIDAY' | 'WEEKEND',
    preferences?: WorkflowPreferences
  ): DailyTask[] {
    const template = this.selectTemplate(dayType, preferences?.experienceLevel || 'INTERMEDIATE');
    const tasks: DailyTask[] = [];
    let sortOrder = 1;

    for (const timeSlot of template.timeSlots) {
      for (const templateTask of timeSlot.tasks) {
        if (this.shouldIncludeTask(templateTask, challenge, preferences)) {
          const task: DailyTask = {
            id: `${challenge.id}-day${currentDay}-${templateTask.id}`,
            challengeId: challenge.id,
            day: currentDay,
            dayType,
            title: this.personalizeTitle(templateTask.title, challenge, preferences),
            description: this.personalizeDescription(templateTask.description, challenge, preferences),
            category: templateTask.category,
            estimatedMinutes: templateTask.estimatedMinutes,
            required: templateTask.required,
            sortOrder: sortOrder++,
            status: 'PENDING',
            xpReward: this.calculateXP(templateTask, challenge, currentDay),
            skillCategory: templateTask.skillCategory,
            bonusXP: this.calculateBonusXP(templateTask, challenge, currentDay)
          };
          tasks.push(task);
        }
      }
    }

    return tasks;
  }

  private initializeTemplates(): void {
    this.templates = [
      this.createPreMarketTemplate(),
      this.createTradingSessionTemplate(),
      this.createPostMarketTemplate(),
      this.createSundayPlanningTemplate(),
      this.createWeekendEducationTemplate()
    ];
  }

  private createPreMarketTemplate(): WorkflowTemplate {
    return {
      id: 'pre-market-execution',
      name: '🌅 Pre-Market Battle Prep',
      description: 'Professional pre-market routine for execution days',
      dayType: 'EXECUTION',
      experienceLevel: 'ALL',
      estimatedTotalMinutes: 45,
      bonusXP: 50,
      timeSlots: [
        {
          id: 'morning-prep',
          name: '🌅 Morning Preparation',
          emoji: '🌅',
          startTime: '06:30',
          endTime: '07:15',
          description: 'Mental preparation and initial market scan',
          priority: 'HIGH',
          color: '#1890ff',
          tasks: [
            {
              id: 'patience-meditation',
              title: '🧘 Patience Meditation & Mindset',
              description: 'Rate your patience level (1-10) and set intention for disciplined trading',
              category: 'SKILL_BUILDING',
              estimatedMinutes: 5,
              required: true,
              xpReward: 15,
              skillCategory: 'PATIENCE',
              bonusXP: 10
            },
            {
              id: 'strategy-review',
              title: '⚔️ Strategy Class Confirmation',
              description: 'Confirm your strategy class is optimal for today\'s conditions',
              category: 'PLANNING',
              estimatedMinutes: 5,
              required: true,
              xpReward: 10,
              skillCategory: 'STRATEGY_ADHERENCE'
            },
            {
              id: 'overnight-scan',
              title: '🌍 Global Market Intelligence',
              description: 'Check overnight futures, international markets, and news events',
              category: 'PRE_MARKET',
              estimatedMinutes: 10,
              required: true,
              xpReward: 20,
              skillCategory: 'SETUP_QUALITY'
            }
          ]
        },
        {
          id: 'battle-preparation',
          name: '⚔️ Battle Preparation',
          emoji: '⚔️',
          startTime: '07:15',
          endTime: '09:30',
          description: 'Final preparation before market open',
          priority: 'HIGH',
          color: '#52c41a',
          tasks: [
            {
              id: 'legendary-setup-hunt',
              title: '💎 Legendary Setup Hunt',
              description: 'Scan for A+ legendary setups only - no common trades allowed!',
              category: 'ANALYSIS',
              estimatedMinutes: 20,
              required: true,
              xpReward: 25,
              skillCategory: 'SETUP_QUALITY',
              bonusXP: 15
            },
            {
              id: 'risk-protocol',
              title: '🛡️ Risk Protocol Activation',
              description: 'Confirm position sizes, stop losses, and risk limits for today',
              category: 'PLANNING',
              estimatedMinutes: 5,
              required: true,
              xpReward: 15,
              skillCategory: 'RISK_MANAGEMENT'
            }
          ]
        }
      ]
    };
  }

  private createTradingSessionTemplate(): WorkflowTemplate {
    return {
      id: 'trading-session',
      name: '📊 Combat Phase',
      description: 'Active trading session with maximum discipline',
      dayType: 'EXECUTION',
      experienceLevel: 'ALL',
      estimatedTotalMinutes: 30,
      bonusXP: 100,
      timeSlots: [
        {
          id: 'opening-bell',
          name: '🔔 Opening Bell Analysis',
          emoji: '🔔',
          startTime: '09:30',
          endTime: '10:00',
          description: 'Market open analysis and first opportunities',
          priority: 'HIGH',
          color: '#fa8c16',
          tasks: [
            {
              id: 'opening-momentum',
              title: '🚀 Opening Momentum Analysis',
              description: 'Analyze opening gaps, volume, and initial price action',
              category: 'MARKET_HOURS',
              estimatedMinutes: 10,
              required: true,
              xpReward: 20,
              skillCategory: 'SETUP_QUALITY'
            }
          ]
        },
        {
          id: 'combat-execution',
          name: '⚔️ Combat Execution',
          emoji: '⚔️',
          startTime: '10:00',
          endTime: '15:30',
          description: 'Execute legendary setups OR earn patience bonus XP',
          priority: 'HIGH',
          color: '#722ed1',
          tasks: [
            {
              id: 'legendary-execution',
              title: '⚔️ Execute Legendary Setups (0-2 max)',
              description: 'Execute only A+ setups that match your buy-box criteria perfectly',
              category: 'MARKET_HOURS',
              estimatedMinutes: 15,
              required: true,
              xpReward: 30,
              skillCategory: 'STRATEGY_ADHERENCE',
              bonusXP: 25 // Bonus for no-trade days
            }
          ]
        },
        {
          id: 'power-hour',
          name: '⚡ Power Hour Watch',
          emoji: '⚡',
          startTime: '15:00',
          endTime: '16:00',
          description: 'Final hour opportunity assessment',
          priority: 'MEDIUM',
          color: '#13c2c2',
          tasks: [
            {
              id: 'power-hour-scan',
              title: '⚡ Power Hour Final Scan',
              description: 'Last chance for end-of-day opportunities or position adjustments',
              category: 'MARKET_HOURS',
              estimatedMinutes: 5,
              required: false,
              xpReward: 10,
              skillCategory: 'SETUP_QUALITY'
            }
          ]
        }
      ]
    };
  }

  private createPostMarketTemplate(): WorkflowTemplate {
    return {
      id: 'post-market-analysis',
      name: '📊 Battle Analysis',
      description: 'Post-market performance review and learning',
      dayType: 'EXECUTION',
      experienceLevel: 'ALL',
      estimatedTotalMinutes: 25,
      bonusXP: 30,
      timeSlots: [
        {
          id: 'performance-review',
          name: '📊 Performance Review',
          emoji: '📊',
          startTime: '16:00',
          endTime: '16:20',
          description: 'Analyze today\'s performance and decisions',
          priority: 'HIGH',
          color: '#eb2f96',
          tasks: [
            {
              id: 'trade-quality-assessment',
              title: '🎯 Trade Quality Assessment',
              description: 'Grade your setups and assess patience discipline',
              category: 'POST_MARKET',
              estimatedMinutes: 15,
              required: true,
              xpReward: 20,
              skillCategory: 'SETUP_QUALITY'
            },
            {
              id: 'lessons-learned',
              title: '📝 Lessons Learned Journal',
              description: 'Document key insights and improvements for tomorrow',
              category: 'SKILL_BUILDING',
              estimatedMinutes: 5,
              required: true,
              xpReward: 15,
              skillCategory: 'STRATEGY_ADHERENCE'
            }
          ]
        },
        {
          id: 'tomorrow-prep',
          name: '🌅 Tomorrow Preparation',
          emoji: '🌅',
          startTime: '16:20',
          endTime: '16:25',
          description: 'Brief preparation for next trading day',
          priority: 'MEDIUM',
          color: '#52c41a',
          tasks: [
            {
              id: 'tomorrow-watchlist',
              title: '📋 Tomorrow\'s Battle Plan',
              description: 'Quick scan for tomorrow\'s potential setups and key levels',
              category: 'PLANNING',
              estimatedMinutes: 5,
              required: false,
              xpReward: 10,
              skillCategory: 'SETUP_QUALITY'
            }
          ]
        }
      ]
    };
  }

  private createSundayPlanningTemplate(): WorkflowTemplate {
    return {
      id: 'sunday-planning',
      name: '📅 Sunday War Council',
      description: 'Weekly planning and strategy preparation',
      dayType: 'SUNDAY',
      experienceLevel: 'ALL',
      estimatedTotalMinutes: 60,
      bonusXP: 75,
      timeSlots: [
        {
          id: 'week-review',
          name: '📊 Previous Week Analysis',
          emoji: '📊',
          startTime: '10:00',
          endTime: '10:30',
          description: 'Comprehensive review of last week\'s performance',
          priority: 'HIGH',
          color: '#1890ff',
          tasks: [
            {
              id: 'performance-analysis',
              title: '📈 Weekly Performance Deep Dive',
              description: 'Analyze win rate, profit factor, and skill development metrics',
              category: 'ANALYSIS',
              estimatedMinutes: 20,
              required: true,
              xpReward: 30,
              skillCategory: 'STRATEGY_ADHERENCE'
            },
            {
              id: 'skill-assessment',
              title: '🎯 Skill Level Assessment',
              description: 'Evaluate progress in patience, setup quality, and risk management',
              category: 'SKILL_BUILDING',
              estimatedMinutes: 10,
              required: true,
              xpReward: 20,
              skillCategory: 'SETUP_QUALITY'
            }
          ]
        },
        {
          id: 'week-planning',
          name: '🗓️ Next Week Strategy',
          emoji: '🗓️',
          startTime: '10:30',
          endTime: '11:00',
          description: 'Plan upcoming week\'s trading strategy and goals',
          priority: 'HIGH',
          color: '#52c41a',
          tasks: [
            {
              id: 'market-outlook',
              title: '🔮 Market Outlook & Economic Events',
              description: 'Research upcoming economic events and market conditions',
              category: 'PLANNING',
              estimatedMinutes: 15,
              required: true,
              xpReward: 25,
              skillCategory: 'SETUP_QUALITY'
            },
            {
              id: 'strategy-optimization',
              title: '⚒️ Strategy Class Optimization',
              description: 'Refine buy-box criteria and risk parameters for next week',
              category: 'PLANNING',
              estimatedMinutes: 15,
              required: true,
              xpReward: 25,
              skillCategory: 'STRATEGY_ADHERENCE'
            }
          ]
        }
      ]
    };
  }

  private createWeekendEducationTemplate(): WorkflowTemplate {
    return {
      id: 'weekend-education',
      name: '🏖️ Weekend Skill Building',
      description: 'Educational content and skill development',
      dayType: 'WEEKEND',
      experienceLevel: 'ALL',
      estimatedTotalMinutes: 30,
      bonusXP: 40,
      timeSlots: [
        {
          id: 'education',
          name: '📚 Skill Development',
          emoji: '📚',
          startTime: '10:00',
          endTime: '10:30',
          description: 'Learn new trading concepts and refine skills',
          priority: 'MEDIUM',
          color: '#722ed1',
          tasks: [
            {
              id: 'educational-content',
              title: '📚 Weekend Learning Module',
              description: 'Complete educational content based on your skill development needs',
              category: 'SKILL_BUILDING',
              estimatedMinutes: 20,
              required: false,
              xpReward: 25,
              skillCategory: 'SETUP_QUALITY'
            },
            {
              id: 'market-analysis',
              title: '📊 Market Structure Analysis',
              description: 'Study chart patterns and market behavior for next week',
              category: 'ANALYSIS',
              estimatedMinutes: 10,
              required: false,
              xpReward: 15,
              skillCategory: 'SETUP_QUALITY'
            }
          ]
        }
      ]
    };
  }

  private selectTemplate(dayType: string, experienceLevel: string): WorkflowTemplate {
    // For execution days, combine pre-market, trading, and post-market
    if (dayType === 'EXECUTION') {
      return this.combineTemplates([
        this.templates.find(t => t.id === 'pre-market-execution')!,
        this.templates.find(t => t.id === 'trading-session')!,
        this.templates.find(t => t.id === 'post-market-analysis')!
      ]);
    }

    return this.templates.find(t => 
      t.dayType === dayType && 
      (t.experienceLevel === experienceLevel || t.experienceLevel === 'ALL')
    ) || this.templates[0];
  }

  private combineTemplates(templates: WorkflowTemplate[]): WorkflowTemplate {
    const combined: WorkflowTemplate = {
      id: 'combined-execution-day',
      name: '📈 Full Execution Day Protocol',
      description: 'Complete pre-market to post-market workflow',
      dayType: 'EXECUTION',
      experienceLevel: 'ALL',
      estimatedTotalMinutes: templates.reduce((sum, t) => sum + t.estimatedTotalMinutes, 0),
      bonusXP: templates.reduce((sum, t) => sum + t.bonusXP, 0),
      timeSlots: templates.flatMap(t => t.timeSlots)
    };
    return combined;
  }

  private shouldIncludeTask(
    task: TemplateTask, 
    challenge: Challenge, 
    preferences?: WorkflowPreferences
  ): boolean {
    if (!task.conditions) return true;

    return task.conditions.every(condition => {
      switch (condition.type) {
        case 'EXPERIENCE_LEVEL':
          return !preferences || preferences.experienceLevel === condition.value;
        case 'STRATEGY_CLASS':
          return challenge.selectedStrategyClass === condition.value;
        default:
          return true;
      }
    });
  }

  private personalizeTitle(title: string, challenge: Challenge, preferences?: WorkflowPreferences): string {
    return title
      .replace('{STRATEGY_CLASS}', this.getStrategyClassName(challenge.selectedStrategyClass))
      .replace('{LEVEL}', challenge.characterLevel.toString());
  }

  private personalizeDescription(description: string, challenge: Challenge, preferences?: WorkflowPreferences): string {
    return description
      .replace('{STRATEGY_CLASS}', this.getStrategyClassName(challenge.selectedStrategyClass))
      .replace('{LEVEL}', challenge.characterLevel.toString())
      .replace('{TARGET}', challenge.targetAmount.toLocaleString());
  }

  private getStrategyClassName(strategyClass: string): string {
    const names = {
      'BUFFETT_GUARDIAN': 'Guardian',
      'DALIO_WARRIOR': 'Warrior', 
      'SOROS_ASSASSIN': 'Assassin',
      'LYNCH_SCOUT': 'Scout'
    };
    return names[strategyClass as keyof typeof names] || 'Trader';
  }

  private calculateXP(task: TemplateTask, challenge: Challenge, currentDay: number): number {
    let baseXP = task.xpReward;
    
    // Level bonus
    const levelBonus = Math.floor(challenge.characterLevel / 5) * 2;
    
    // Streak bonus (every 7 days)
    const streakBonus = Math.floor(currentDay / 7) * 5;
    
    return baseXP + levelBonus + streakBonus;
  }

  private calculateBonusXP(task: TemplateTask, challenge: Challenge, currentDay: number): number {
    if (!task.bonusXP) return 0;
    
    let bonus = task.bonusXP;
    
    // Weekend bonus
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      bonus = Math.floor(bonus * 1.2);
    }
    
    return bonus;
  }

  getTemplateById(templateId: string): WorkflowTemplate | undefined {
    return this.templates.find(t => t.id === templateId);
  }

  getAllTemplates(): WorkflowTemplate[] {
    return [...this.templates];
  }

  getTemplatesByDayType(dayType: string): WorkflowTemplate[] {
    return this.templates.filter(t => t.dayType === dayType);
  }
}

export default DailyWorkflowTemplateEngine;
export { DailyWorkflowTemplateEngine };
export type { WorkflowTemplateEngineProps, WorkflowPreferences };
