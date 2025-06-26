import { DatabaseService } from './DatabaseService';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'pattern' | 'trading' | 'education' | 'performance';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  xpReward: number;
  status: 'available' | 'active' | 'completed' | 'locked';
  progress: number;
  maxProgress: number;
  requirements: string[];
  completedAt?: Date;
  createdAt: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  unlockedAt?: Date;
  isUnlocked: boolean;
}

export interface UserProgress {
  userId: string;
  level: number;
  currentXP: number;
  totalXP: number;
  nextLevelXP: number;
  rank: string;
  completedChallenges: number;
  unlockedAchievements: number;
  streak: number;
  lastActiveDate: Date;
}

export interface XPTransaction {
  id: string;
  userId: string;
  amount: number;
  source: string;
  description: string;
  timestamp: Date;
}

export class ChallengeService {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
    this.initializeChallengeSystem();
  }

  private async initializeChallengeSystem(): Promise<void> {
    try {
      await this.databaseService.initializeDatabase();
      await this.createTables();
      await this.seedDefaultChallenges();
      await this.seedDefaultAchievements();
    } catch (error) {
      console.error('Failed to initialize challenge system:', error);
    }
  }

  private async createTables(): Promise<void> {
    const queries = [
      `CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        xp_reward INTEGER NOT NULL,
        status TEXT DEFAULT 'available',
        progress INTEGER DEFAULT 0,
        max_progress INTEGER DEFAULT 1,
        requirements TEXT DEFAULT '[]',
        completed_at TEXT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        category TEXT NOT NULL,
        xp_reward INTEGER NOT NULL,
        unlocked_at TEXT NULL,
        is_unlocked BOOLEAN DEFAULT FALSE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS user_progress (
        user_id TEXT PRIMARY KEY,
        level INTEGER DEFAULT 1,
        current_xp INTEGER DEFAULT 0,
        total_xp INTEGER DEFAULT 0,
        next_level_xp INTEGER DEFAULT 1000,
        rank TEXT DEFAULT 'Novice',
        completed_challenges INTEGER DEFAULT 0,
        unlocked_achievements INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        last_active_date TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS xp_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        source TEXT NOT NULL,
        description TEXT NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS user_challenges (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        challenge_id TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        progress INTEGER DEFAULT 0,
        started_at TEXT DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT NULL,
        FOREIGN KEY (challenge_id) REFERENCES challenges (id)
      )`,
      `CREATE TABLE IF NOT EXISTS user_achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        achievement_id TEXT NOT NULL,
        unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (achievement_id) REFERENCES achievements (id)
      )`
    ];

    for (const query of queries) {
      await this.databaseService.executeSql(query, []);
    }
  }

  private async seedDefaultChallenges(): Promise<void> {
    const defaultChallenges: Omit<Challenge, 'id' | 'createdAt' | 'status' | 'progress' | 'completedAt'>[] = [
      {
        title: 'Pattern Recognition Novice',
        description: 'Successfully identify and trade 5 patterns with 70%+ confidence',
        type: 'pattern',
        difficulty: 'beginner',
        xpReward: 100,
        maxProgress: 5,
        requirements: ['Complete tutorial', 'Enable pattern alerts']
      },
      {
        title: 'High Confidence Trader',
        description: 'Trade 10 patterns with 85%+ confidence',
        type: 'pattern',
        difficulty: 'intermediate',
        xpReward: 250,
        maxProgress: 10,
        requirements: ['Complete Pattern Recognition Novice']
      },
      {
        title: 'Pattern Master',
        description: 'Successfully identify all 7 major pattern types',
        type: 'pattern',
        difficulty: 'advanced',
        xpReward: 500,
        maxProgress: 7,
        requirements: ['Complete High Confidence Trader']
      },
      {
        title: 'Risk Management Expert',
        description: 'Maintain stop-loss discipline for 20 consecutive trades',
        type: 'trading',
        difficulty: 'intermediate',
        xpReward: 300,
        maxProgress: 20,
        requirements: ['Set up risk management rules']
      },
      {
        title: 'Consistency Champion',
        description: 'Achieve 7-day trading streak',
        type: 'performance',
        difficulty: 'beginner',
        xpReward: 150,
        maxProgress: 7,
        requirements: ['Complete first trade']
      },
      {
        title: 'Market Scholar',
        description: 'Complete all educational modules',
        type: 'education',
        difficulty: 'beginner',
        xpReward: 200,
        maxProgress: 12,
        requirements: []
      },
      {
        title: 'Profit Maximizer',
        description: 'Achieve 15% portfolio return in a month',
        type: 'performance',
        difficulty: 'expert',
        xpReward: 1000,
        maxProgress: 1,
        requirements: ['Complete Risk Management Expert']
      }
    ];

    for (const challenge of defaultChallenges) {
      const existingQuery = 'SELECT id FROM challenges WHERE title = ?';
      const existing = await this.databaseService.executeSql(existingQuery, [challenge.title]);
      
      if (existing.length === 0) {
        const insertQuery = `
          INSERT INTO challenges (
            id, title, description, type, difficulty, xp_reward, 
            max_progress, requirements
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await this.databaseService.executeSql(insertQuery, [
          `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          challenge.title,
          challenge.description,
          challenge.type,
          challenge.difficulty,
          challenge.xpReward,
          challenge.maxProgress,
          JSON.stringify(challenge.requirements)
        ]);
      }
    }
  }

  private async seedDefaultAchievements(): Promise<void> {
    const defaultAchievements: Omit<Achievement, 'id' | 'unlockedAt' | 'isUnlocked'>[] = [
      {
        title: 'First Steps',
        description: 'Complete your first pattern recognition',
        icon: '🎯',
        category: 'Getting Started',
        xpReward: 50
      },
      {
        title: 'Sharp Eye',
        description: 'Identify 100 patterns with 80%+ confidence',
        icon: '👁️',
        category: 'Pattern Recognition',
        xpReward: 300
      },
      {
        title: 'Speed Demon',
        description: 'Execute 5 trades within 10 minutes',
        icon: '⚡',
        category: 'Trading Speed',
        xpReward: 200
      },
      {
        title: 'Risk Averse',
        description: 'Never exceed 2% risk per trade for 50 trades',
        icon: '🛡️',
        category: 'Risk Management',
        xpReward: 400
      },
      {
        title: 'Streak Master',
        description: 'Maintain 30-day active trading streak',
        icon: '🔥',
        category: 'Consistency',
        xpReward: 600
      },
      {
        title: 'Profit King',
        description: 'Achieve 10 consecutive profitable trades',
        icon: '👑',
        category: 'Performance',
        xpReward: 800
      },
      {
        title: 'Pattern Perfectionist',
        description: 'Achieve 95% accuracy on pattern predictions',
        icon: '💎',
        category: 'Accuracy',
        xpReward: 1000
      },
      {
        title: 'Market Guru',
        description: 'Reach Expert level (Level 50)',
        icon: '🧙‍♂️',
        category: 'Mastery',
        xpReward: 2000
      }
    ];

    for (const achievement of defaultAchievements) {
      const existingQuery = 'SELECT id FROM achievements WHERE title = ?';
      const existing = await this.databaseService.executeSql(existingQuery, [achievement.title]);
      
      if (existing.length === 0) {
        const insertQuery = `
          INSERT INTO achievements (
            id, title, description, icon, category, xp_reward
          ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        await this.databaseService.executeSql(insertQuery, [
          `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          achievement.title,
          achievement.description,
          achievement.icon,
          achievement.category,
          achievement.xpReward
        ]);
      }
    }
  }

  // Public API methods
  public async getUserProgress(userId?: string): Promise<UserProgress> {
    const id = userId || 'default_user';
    const query = 'SELECT * FROM user_progress WHERE user_id = ?';
    const results = await this.databaseService.executeSql(query, [id]);
    
    if (results.length === 0) {
      // Create default user progress
      const defaultProgress: UserProgress = {
        userId: id,
        level: 1,
        currentXP: 0,
        totalXP: 0,
        nextLevelXP: 1000,
        rank: 'Novice',
        completedChallenges: 0,
        unlockedAchievements: 0,
        streak: 0,
        lastActiveDate: new Date()
      };
      
      await this.createUserProgress(defaultProgress);
      return defaultProgress;
    }
    
    const row = results[0];
    return {
      userId: row.user_id,
      level: row.level,
      currentXP: row.current_xp,
      totalXP: row.total_xp,
      nextLevelXP: row.next_level_xp,
      rank: row.rank,
      completedChallenges: row.completed_challenges,
      unlockedAchievements: row.unlocked_achievements,
      streak: row.streak,
      lastActiveDate: new Date(row.last_active_date)
    };
  }

  private async createUserProgress(progress: UserProgress): Promise<void> {
    const query = `
      INSERT INTO user_progress (
        user_id, level, current_xp, total_xp, next_level_xp, rank,
        completed_challenges, unlocked_achievements, streak, last_active_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.databaseService.executeSql(query, [
      progress.userId,
      progress.level,
      progress.currentXP,
      progress.totalXP,
      progress.nextLevelXP,
      progress.rank,
      progress.completedChallenges,
      progress.unlockedAchievements,
      progress.streak,
      progress.lastActiveDate.toISOString()
    ]);
  }

  public async awardXP(userId?: string, amount: number, source: string = 'pattern_recognition', description: string = 'XP Reward'): Promise<UserProgress> {
    const id = userId || 'default_user';
    
    // Record XP transaction
    const transactionId = `xp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transactionQuery = `
      INSERT INTO xp_transactions (id, user_id, amount, source, description)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    await this.databaseService.executeSql(transactionQuery, [
      transactionId,
      id,
      amount,
      source,
      description
    ]);
    
    // Update user progress
    const currentProgress = await this.getUserProgress(id);
    const newCurrentXP = currentProgress.currentXP + amount;
    const newTotalXP = currentProgress.totalXP + amount;
    
    let newLevel = currentProgress.level;
    let newNextLevelXP = currentProgress.nextLevelXP;
    let newRank = currentProgress.rank;
    
    // Check for level up
    if (newCurrentXP >= currentProgress.nextLevelXP) {
      newLevel++;
      newNextLevelXP = this.calculateNextLevelXP(newLevel);
      newRank = this.calculateRank(newLevel);
    }
    
    const updateQuery = `
      UPDATE user_progress 
      SET current_xp = ?, total_xp = ?, level = ?, next_level_xp = ?, rank = ?,
          last_active_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `;
    
    await this.databaseService.executeSql(updateQuery, [
      newCurrentXP,
      newTotalXP,
      newLevel,
      newNextLevelXP,
      newRank,
      id
    ]);
    
    // Check for new achievements
    await this.checkAchievements(id);
    
    return {
      userId: id,
      level: newLevel,
      currentXP: newCurrentXP,
      totalXP: newTotalXP,
      nextLevelXP: newNextLevelXP,
      rank: newRank,
      completedChallenges: currentProgress.completedChallenges,
      unlockedAchievements: currentProgress.unlockedAchievements,
      streak: currentProgress.streak,
      lastActiveDate: new Date()
    };
  }

  private calculateNextLevelXP(level: number): number {
    // Exponential XP curve: base * 1.5^(level-1)
    const base = 1000;
    return Math.floor(base * Math.pow(1.5, level - 1));
  }

  private calculateRank(level: number): string {
    if (level >= 50) return 'Expert';
    if (level >= 40) return 'Master';
    if (level >= 30) return 'Professional';
    if (level >= 20) return 'Advanced';
    if (level >= 10) return 'Intermediate';
    if (level >= 5) return 'Apprentice';
    return 'Novice';
  }

  public async getChallenges(userId?: string): Promise<Challenge[]> {
    const query = 'SELECT * FROM challenges ORDER BY difficulty, xp_reward';
    const results = await this.databaseService.executeSql(query, []);
    
    return results.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      difficulty: row.difficulty,
      xpReward: row.xp_reward,
      status: row.status,
      progress: row.progress,
      maxProgress: row.max_progress,
      requirements: JSON.parse(row.requirements || '[]'),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      createdAt: new Date(row.created_at)
    }));
  }

  public async getAchievements(userId?: string): Promise<Achievement[]> {
    const query = 'SELECT * FROM achievements ORDER BY category, xp_reward';
    const results = await this.databaseService.executeSql(query, []);
    
    return results.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      icon: row.icon,
      category: row.category,
      xpReward: row.xp_reward,
      unlockedAt: row.unlocked_at ? new Date(row.unlocked_at) : undefined,
      isUnlocked: row.is_unlocked
    }));
  }

  public async updateChallengeProgress(challengeId: string, progress: number, userId?: string): Promise<void> {
    const id = userId || 'default_user';
    
    const updateQuery = `
      UPDATE challenges 
      SET progress = ?, status = CASE WHEN progress >= max_progress THEN 'completed' ELSE status END,
          completed_at = CASE WHEN progress >= max_progress THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = ?
    `;
    
    await this.databaseService.executeSql(updateQuery, [progress, challengeId]);
    
    // Check if challenge is completed
    const challengeQuery = 'SELECT * FROM challenges WHERE id = ?';
    const challengeResults = await this.databaseService.executeSql(challengeQuery, [challengeId]);
    
    if (challengeResults.length > 0 && challengeResults[0].status === 'completed') {
      // Award XP
      await this.awardXP(id, challengeResults[0].xp_reward, 'challenge_completion', `Completed: ${challengeResults[0].title}`);
      
      // Update user progress
      const userProgressQuery = `
        UPDATE user_progress 
        SET completed_challenges = completed_challenges + 1
        WHERE user_id = ?
      `;
      await this.databaseService.executeSql(userProgressQuery, [id]);
    }
  }

  private async checkAchievements(userId: string): Promise<void> {
    const userProgress = await this.getUserProgress(userId);
    const achievements = await this.getAchievements(userId);
    
    // Example achievement checks
    for (const achievement of achievements) {
      if (achievement.isUnlocked) continue;
      
      let shouldUnlock = false;
      
      switch (achievement.title) {
        case 'First Steps':
          // This would be triggered by pattern recognition
          break;
        case 'Market Guru':
          shouldUnlock = userProgress.level >= 50;
          break;
        case 'Sharp Eye':
          // This would be checked against pattern recognition stats
          break;
        default:
          break;
      }
      
      if (shouldUnlock) {
        await this.unlockAchievement(achievement.id, userId);
      }
    }
  }

  private async unlockAchievement(achievementId: string, userId: string): Promise<void> {
    // Update achievement status
    const updateQuery = `
      UPDATE achievements 
      SET is_unlocked = TRUE, unlocked_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await this.databaseService.executeSql(updateQuery, [achievementId]);
    
    // Record user achievement
    const userAchievementQuery = `
      INSERT INTO user_achievements (id, user_id, achievement_id)
      VALUES (?, ?, ?)
    `;
    const userAchievementId = `user_achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.databaseService.executeSql(userAchievementQuery, [userAchievementId, userId, achievementId]);
    
    // Update user progress
    const userProgressQuery = `
      UPDATE user_progress 
      SET unlocked_achievements = unlocked_achievements + 1
      WHERE user_id = ?
    `;
    await this.databaseService.executeSql(userProgressQuery, [userId]);
    
    // Award XP
    const achievementQuery = 'SELECT xp_reward, title FROM achievements WHERE id = ?';
    const achievementResults = await this.databaseService.executeSql(achievementQuery, [achievementId]);
    
    if (achievementResults.length > 0) {
      await this.awardXP(userId, achievementResults[0].xp_reward, 'achievement_unlock', `Unlocked: ${achievementResults[0].title}`);
    }
  }

  public async getXPTransactions(userId?: string, limit: number = 50): Promise<XPTransaction[]> {
    const id = userId || 'default_user';
    const query = `
      SELECT * FROM xp_transactions 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `;
    
    const results = await this.databaseService.executeSql(query, [id, limit]);
    
    return results.map(row => ({
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      source: row.source,
      description: row.description,
      timestamp: new Date(row.timestamp)
    }));
  }

  public async getLeaderboard(limit: number = 10): Promise<UserProgress[]> {
    const query = `
      SELECT * FROM user_progress 
      ORDER BY total_xp DESC, level DESC 
      LIMIT ?
    `;
    
    const results = await this.databaseService.executeSql(query, [limit]);
    
    return results.map(row => ({
      userId: row.user_id,
      level: row.level,
      currentXP: row.current_xp,
      totalXP: row.total_xp,
      nextLevelXP: row.next_level_xp,
      rank: row.rank,
      completedChallenges: row.completed_challenges,
      unlockedAchievements: row.unlocked_achievements,
      streak: row.streak,
      lastActiveDate: new Date(row.last_active_date)
    }));
  }
}