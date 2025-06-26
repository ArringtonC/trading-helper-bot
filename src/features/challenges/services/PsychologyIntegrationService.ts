/**
 * Psychology Integration Service
 * Integrates psychology features with the existing Challenge/RPG system
 */

import { 
  Achievement, 
  XPEvent, 
  Challenge, 
  DailyTask, 
  ChallengeStreaks 
} from '../types/challenge';
import { 
  EmotionalState, 
  ProfitExtractionEvent, 
  BehavioralPattern, 
  DisciplineMetrics,
  PsychologyAchievement 
} from '../../psychology/types/psychology';

export interface PsychologyProgress {
  stressLevel: number;
  emotionalState: EmotionalState;
  disciplineScore: number;
  profitExtractionCompliance: number;
  behavioralImprovements: BehavioralPattern[];
}

export interface IntegratedXPCalculation {
  baseXP: number;
  stressBonusXP: number;
  disciplineBonusXP: number;
  profitProtectionXP: number;
  behavioralImprovementXP: number;
  totalXP: number;
}

export class PsychologyIntegrationService {
  
  /**
   * Calculate XP rewards with psychology bonuses
   */
  public calculateIntegratedXP(
    baseXP: number,
    psychologyProgress: PsychologyProgress,
    completedTask?: DailyTask
  ): IntegratedXPCalculation {
    let stressBonusXP = 0;
    let disciplineBonusXP = 0;
    let profitProtectionXP = 0;
    let behavioralImprovementXP = 0;

    // Stress Management Bonus (Optimal stress level 3-5)
    if (psychologyProgress.stressLevel >= 3 && psychologyProgress.stressLevel <= 5) {
      stressBonusXP = Math.floor(baseXP * 0.2); // 20% bonus for optimal stress
    }

    // Discipline Score Bonus
    if (psychologyProgress.disciplineScore >= 90) {
      disciplineBonusXP = Math.floor(baseXP * 0.3); // 30% bonus for high discipline
    } else if (psychologyProgress.disciplineScore >= 80) {
      disciplineBonusXP = Math.floor(baseXP * 0.15); // 15% bonus for good discipline
    }

    // Profit Protection Compliance Bonus
    if (psychologyProgress.profitExtractionCompliance >= 100) {
      profitProtectionXP = Math.floor(baseXP * 0.25); // 25% bonus for meeting extraction targets
    }

    // Behavioral Improvement Bonus
    const improvingPatterns = psychologyProgress.behavioralImprovements.filter(
      pattern => pattern.trend === 'IMPROVING'
    );
    if (improvingPatterns.length > 0) {
      behavioralImprovementXP = improvingPatterns.length * 10; // 10 XP per improving pattern
    }

    // Psychology-specific task bonuses
    if (completedTask?.skillCategory === 'STRESS_MANAGEMENT') {
      stressBonusXP += 15;
    }
    if (completedTask?.skillCategory === 'PROFIT_PROTECTION') {
      profitProtectionXP += 20;
    }
    if (completedTask?.skillCategory === 'DISCIPLINE_CONTROL') {
      disciplineBonusXP += 25;
    }

    const totalXP = baseXP + stressBonusXP + disciplineBonusXP + profitProtectionXP + behavioralImprovementXP;

    return {
      baseXP,
      stressBonusXP,
      disciplineBonusXP,
      profitProtectionXP,
      behavioralImprovementXP,
      totalXP
    };
  }

  /**
   * Generate psychology-based daily tasks
   */
  public generatePsychologyTasks(
    challengeId: string,
    day: number,
    currentStressLevel: number,
    disciplineScore: number,
    recentPatterns: BehavioralPattern[]
  ): DailyTask[] {
    const tasks: DailyTask[] = [];

    // Morning stress check task
    tasks.push({
      id: `stress-check-${day}`,
      challengeId,
      day,
      dayType: 'EXECUTION',
      title: '🧘 Morning Stress & Emotional State Check',
      description: 'Rate your stress level and emotional state before trading',
      category: 'SKILL_BUILDING',
      estimatedMinutes: 3,
      required: true,
      sortOrder: 1,
      status: 'PENDING',
      xpReward: 15,
      skillCategory: 'STRESS_MANAGEMENT'
    });

    // Position size enforcement task
    if (disciplineScore < 80) {
      tasks.push({
        id: `position-discipline-${day}`,
        challengeId,
        day,
        dayType: 'EXECUTION',
        title: '🗿 Position Size Discipline Check',
        description: 'Verify position sizes comply with 1% rule before each trade',
        category: 'SKILL_BUILDING',
        estimatedMinutes: 2,
        required: true,
        sortOrder: 3,
        status: 'PENDING',
        xpReward: 20,
        skillCategory: 'DISCIPLINE_CONTROL'
      });
    }

    // High stress mitigation task
    if (currentStressLevel > 7) {
      tasks.push({
        id: `stress-mitigation-${day}`,
        challengeId,
        day,
        dayType: 'EXECUTION',
        title: '🚨 High Stress Alert - Breather Mode',
        description: 'Take 5-minute breathing exercise, reduce position sizes by 50%',
        category: 'SKILL_BUILDING',
        estimatedMinutes: 5,
        required: true,
        sortOrder: 2,
        status: 'PENDING',
        xpReward: 30,
        skillCategory: 'STRESS_MANAGEMENT',
        bonusXP: 20
      });
    }

    // Behavioral pattern improvement task
    const worseningPatterns = recentPatterns.filter(p => p.trend === 'WORSENING');
    if (worseningPatterns.length > 0) {
      const pattern = worseningPatterns[0];
      tasks.push({
        id: `pattern-improvement-${day}`,
        challengeId,
        day,
        dayType: 'EXECUTION',
        title: `🔍 Improve ${pattern.pattern.replace(/_/g, ' ')} Pattern`,
        description: `Focus on reducing ${pattern.pattern.toLowerCase().replace(/_/g, ' ')} behavior`,
        category: 'SKILL_BUILDING',
        estimatedMinutes: 10,
        required: false,
        sortOrder: 5,
        status: 'PENDING',
        xpReward: 25,
        skillCategory: 'DISCIPLINE_CONTROL'
      });
    }

    // Monthly profit extraction reminder (if it's near month end)
    const now = new Date();
    const isLastWeekOfMonth = now.getDate() > 22;
    if (isLastWeekOfMonth) {
      tasks.push({
        id: `profit-extraction-${day}`,
        challengeId,
        day,
        dayType: 'EXECUTION',
        title: '💰 Monthly Profit Extraction Review',
        description: 'Review monthly profits and execute extraction if target met',
        category: 'PLANNING',
        estimatedMinutes: 8,
        required: false,
        sortOrder: 6,
        status: 'PENDING',
        xpReward: 35,
        skillCategory: 'PROFIT_PROTECTION',
        bonusXP: 15
      });
    }

    return tasks;
  }

  /**
   * Check for psychology achievement unlocks
   */
  public checkPsychologyAchievements(
    currentProgress: PsychologyProgress,
    achievementHistory: Achievement[],
    stressHistory: { date: Date; stressLevel: number }[],
    extractionHistory: ProfitExtractionEvent[],
    disciplineHistory: { date: Date; score: number }[]
  ): Achievement[] {
    const newAchievements: Achievement[] = [];

    // Zen Trader Achievement - Stress level below 5 for 30 days
    const recentStressData = stressHistory.slice(-30);
    const lowStressDays = recentStressData.filter(data => data.stressLevel < 5).length;
    if (lowStressDays >= 30 && !achievementHistory.find(a => a.id === 'achievement-zen-trader')) {
      newAchievements.push({
        id: 'achievement-zen-trader',
        name: 'Zen Trader',
        description: 'Maintain stress level below 5 for 30 days',
        icon: '🧘‍♂️',
        category: 'STRESS_MANAGEMENT',
        progress: 100,
        target: 30,
        unlocked: true,
        unlockedAt: new Date(),
        points: 50,
        xpReward: 500,
        skillPointReward: 8,
        tier: 'GOLD'
      });
    }

    // Profit Protector Achievement - 3 consecutive monthly extractions
    const monthlyExtractions = this.getConsecutiveMonthlyExtractions(extractionHistory);
    if (monthlyExtractions >= 3 && !achievementHistory.find(a => a.id === 'achievement-profit-protector')) {
      newAchievements.push({
        id: 'achievement-profit-protector',
        name: 'Profit Protector',
        description: 'Extract profits for 3 consecutive months',
        icon: '💰',
        category: 'PROFIT_PROTECTION',
        progress: 100,
        target: 3,
        unlocked: true,
        unlockedAt: new Date(),
        points: 75,
        xpReward: 750,
        skillPointReward: 12,
        tier: 'LEGENDARY'
      });
    }

    // Iron Discipline Achievement - 100% 1% rule compliance for 60 days
    const recentDisciplineData = disciplineHistory.slice(-60);
    const perfectDisciplineDays = recentDisciplineData.filter(data => data.score >= 95).length;
    if (perfectDisciplineDays >= 60 && !achievementHistory.find(a => a.id === 'achievement-iron-discipline')) {
      newAchievements.push({
        id: 'achievement-iron-discipline',
        name: 'Iron Discipline',
        description: '100% compliance with 1% rule for 60 days',
        icon: '🗿',
        category: 'DISCIPLINE',
        progress: 100,
        target: 60,
        unlocked: true,
        unlockedAt: new Date(),
        points: 100,
        xpReward: 1000,
        skillPointReward: 15,
        tier: 'LEGENDARY'
      });
    }

    // Stress Master Achievement - Optimal stress (3-5) for 14 consecutive days
    const optimalStressDays = this.getConsecutiveOptimalStressDays(stressHistory);
    if (optimalStressDays >= 14 && !achievementHistory.find(a => a.id === 'achievement-stress-master')) {
      newAchievements.push({
        id: 'achievement-stress-master',
        name: 'Stress Master',
        description: 'Achieve optimal stress level (3-5) for 14 consecutive days',
        icon: '🎯',
        category: 'STRESS_MANAGEMENT',
        progress: 100,
        target: 14,
        unlocked: true,
        unlockedAt: new Date(),
        points: 35,
        xpReward: 300,
        skillPointReward: 5,
        tier: 'SILVER'
      });
    }

    return newAchievements;
  }

  /**
   * Update challenge streaks with psychology factors
   */
  public updatePsychologyStreaks(
    currentStreaks: ChallengeStreaks,
    todayProgress: PsychologyProgress
  ): ChallengeStreaks {
    const updatedStreaks = { ...currentStreaks };

    // Update discipline streak based on discipline score
    if (todayProgress.disciplineScore >= 80) {
      updatedStreaks.riskDiscipline += 1;
    } else {
      updatedStreaks.riskDiscipline = 0; // Break streak
    }

    // Add psychology-specific streak tracking
    // This could be extended to include stress management streaks, profit protection streaks, etc.

    return updatedStreaks;
  }

  /**
   * Generate XP events for psychology milestones
   */
  public generatePsychologyXPEvents(
    userId: string,
    challengeId: string,
    psychologyProgress: PsychologyProgress,
    previousProgress?: PsychologyProgress
  ): XPEvent[] {
    const events: XPEvent[] = [];

    // Stress management milestone XP
    if (psychologyProgress.stressLevel >= 3 && psychologyProgress.stressLevel <= 5) {
      if (!previousProgress || previousProgress.stressLevel < 3 || previousProgress.stressLevel > 5) {
        events.push({
          id: `stress-optimal-${Date.now()}`,
          userId,
          challengeId,
          eventType: 'STRESS_MANAGEMENT',
          xpGained: 25,
          skillPointsGained: 1,
          description: 'Achieved optimal stress level (3-5)',
          timestamp: new Date()
        });
      }
    }

    // Discipline improvement XP
    if (previousProgress && psychologyProgress.disciplineScore > previousProgress.disciplineScore + 5) {
      events.push({
        id: `discipline-improvement-${Date.now()}`,
        userId,
        challengeId,
        eventType: 'DISCIPLINE_BONUS',
        xpGained: Math.floor((psychologyProgress.disciplineScore - previousProgress.disciplineScore) * 2),
        skillPointsGained: 1,
        description: `Discipline score improved by ${psychologyProgress.disciplineScore - previousProgress.disciplineScore} points`,
        timestamp: new Date()
      });
    }

    // Profit extraction completion XP
    if (psychologyProgress.profitExtractionCompliance >= 100) {
      if (!previousProgress || previousProgress.profitExtractionCompliance < 100) {
        events.push({
          id: `profit-extraction-${Date.now()}`,
          userId,
          challengeId,
          eventType: 'PROFIT_EXTRACTION',
          xpGained: 50,
          skillPointsGained: 2,
          description: 'Completed monthly profit extraction target',
          timestamp: new Date()
        });
      }
    }

    return events;
  }

  // Helper methods
  private getConsecutiveMonthlyExtractions(extractions: ProfitExtractionEvent[]): number {
    // Logic to calculate consecutive monthly extractions
    // This would check if extractions occurred in consecutive months
    const monthlyExtractions = extractions.reduce((acc, extraction) => {
      const monthKey = `${extraction.date.getFullYear()}-${extraction.date.getMonth()}`;
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(extraction);
      return acc;
    }, {} as Record<string, ProfitExtractionEvent[]>);

    // Count consecutive months with extractions
    let consecutive = 0;
    const sortedMonths = Object.keys(monthlyExtractions).sort().reverse();
    
    for (const month of sortedMonths) {
      if (monthlyExtractions[month].length > 0) {
        consecutive++;
      } else {
        break;
      }
    }

    return consecutive;
  }

  private getConsecutiveOptimalStressDays(stressHistory: { date: Date; stressLevel: number }[]): number {
    // Logic to calculate consecutive days with optimal stress (3-5)
    let consecutive = 0;
    const sortedHistory = stressHistory.sort((a, b) => b.date.getTime() - a.date.getTime());

    for (const entry of sortedHistory) {
      if (entry.stressLevel >= 3 && entry.stressLevel <= 5) {
        consecutive++;
      } else {
        break;
      }
    }

    return consecutive;
  }
}

export const psychologyIntegrationService = new PsychologyIntegrationService();