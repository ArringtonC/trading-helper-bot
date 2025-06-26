import { DatabaseService } from './DatabaseService';
import { MarketDataService } from './MarketDataService';

export interface Pattern {
  id: string;
  type: string;
  symbol: string;
  confidence: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  priceTarget: number;
  stopLoss: number;
  timeframe: string;
  detectedAt: Date;
  status: 'active' | 'completed' | 'failed';
  successRate: number;
  xpReward: number;
}

export interface PatternAlert {
  id: string;
  patternId: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  read: boolean;
  actionTaken: boolean;
}

export interface PatternPerformance {
  patternType: string;
  totalDetected: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgReturn: number;
  bestReturn: number;
  worstReturn: number;
}

export interface AlertSettings {
  enableSound: boolean;
  enableVisual: boolean;
  minConfidence: number;
  priorityFilter: string[];
  patternTypes: string[];
  symbols: string[];
}

export class PatternRecognitionService {
  private databaseService: DatabaseService;
  private marketDataService: MarketDataService;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.databaseService = new DatabaseService();
    this.marketDataService = new MarketDataService();
    this.initializePatternRecognition();
  }

  private async initializePatternRecognition(): Promise<void> {
    try {
      await this.databaseService.initializeDatabase();
      await this.createTables();
      this.startPatternDetection();
    } catch (error) {
      console.error('Failed to initialize pattern recognition:', error);
    }
  }

  private async createTables(): Promise<void> {
    const queries = [
      `CREATE TABLE IF NOT EXISTS patterns (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        symbol TEXT NOT NULL,
        confidence REAL NOT NULL,
        direction TEXT NOT NULL,
        price_target REAL NOT NULL,
        stop_loss REAL NOT NULL,
        timeframe TEXT NOT NULL,
        detected_at TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        success_rate REAL DEFAULT 0,
        xp_reward INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS pattern_alerts (
        id TEXT PRIMARY KEY,
        pattern_id TEXT NOT NULL,
        message TEXT NOT NULL,
        priority TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        action_taken BOOLEAN DEFAULT FALSE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pattern_id) REFERENCES patterns (id)
      )`,
      `CREATE TABLE IF NOT EXISTS pattern_performance (
        id TEXT PRIMARY KEY,
        pattern_type TEXT NOT NULL,
        total_detected INTEGER DEFAULT 0,
        success_count INTEGER DEFAULT 0,
        failure_count INTEGER DEFAULT 0,
        success_rate REAL DEFAULT 0,
        avg_return REAL DEFAULT 0,
        best_return REAL DEFAULT 0,
        worst_return REAL DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS alert_settings (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        enable_sound BOOLEAN DEFAULT TRUE,
        enable_visual BOOLEAN DEFAULT TRUE,
        min_confidence REAL DEFAULT 70,
        priority_filter TEXT DEFAULT '["high","medium","low"]',
        pattern_types TEXT DEFAULT '[]',
        symbols TEXT DEFAULT '[]',
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const query of queries) {
      await this.databaseService.executeSql(query, []);
    }
  }

  private startPatternDetection(): void {
    // Simulate real-time pattern detection
    setInterval(async () => {
      try {
        await this.detectPatterns();
      } catch (error) {
        console.error('Pattern detection error:', error);
      }
    }, 30000); // Check every 30 seconds

    // Simulate more frequent detection for demo purposes
    setInterval(async () => {
      if (Math.random() > 0.7) { // 30% chance of new pattern
        await this.generateMockPattern();
      }
    }, 10000); // Check every 10 seconds
  }

  private async detectPatterns(): Promise<void> {
    // This would integrate with real market data and technical analysis
    // For now, we'll generate mock patterns
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'META', 'AMZN'];
    const patternTypes = [
      'Head and Shoulders',
      'Double Top',
      'Double Bottom',
      'Triangle',
      'Flag',
      'Wedge',
      'Cup and Handle'
    ];

    for (const symbol of symbols) {
      if (Math.random() > 0.8) { // 20% chance per symbol
        const pattern = this.createMockPattern(symbol, patternTypes);
        await this.savePattern(pattern);
        await this.createAlert(pattern);
      }
    }
  }

  private async generateMockPattern(): Promise<void> {
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA'];
    const patternTypes = [
      'Head and Shoulders',
      'Double Top',
      'Double Bottom',
      'Triangle',
      'Flag',
      'Wedge',
      'Cup and Handle'
    ];

    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const pattern = this.createMockPattern(symbol, patternTypes);
    
    await this.savePattern(pattern);
    await this.createAlert(pattern);
    this.emit('patternDetected', pattern);
  }

  private createMockPattern(symbol: string, patternTypes: string[]): Pattern {
    const patternType = patternTypes[Math.floor(Math.random() * patternTypes.length)];
    const confidence = Math.floor(Math.random() * 40) + 60; // 60-100%
    const direction = Math.random() > 0.5 ? 'bullish' : 'bearish';
    const currentPrice = 100 + Math.random() * 50; // Mock price
    
    return {
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: patternType,
      symbol,
      confidence,
      direction,
      priceTarget: currentPrice * (direction === 'bullish' ? 1.1 : 0.9),
      stopLoss: currentPrice * (direction === 'bullish' ? 0.95 : 1.05),
      timeframe: ['1H', '4H', '1D', '1W'][Math.floor(Math.random() * 4)],
      detectedAt: new Date(),
      status: 'active',
      successRate: Math.floor(Math.random() * 40) + 50, // 50-90%
      xpReward: Math.floor(confidence / 10) * 5 // Higher confidence = more XP
    };
  }

  private async savePattern(pattern: Pattern): Promise<void> {
    const query = `
      INSERT INTO patterns (
        id, type, symbol, confidence, direction, price_target, 
        stop_loss, timeframe, detected_at, status, success_rate, xp_reward
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.databaseService.executeSql(query, [
      pattern.id,
      pattern.type,
      pattern.symbol,
      pattern.confidence,
      pattern.direction,
      pattern.priceTarget,
      pattern.stopLoss,
      pattern.timeframe,
      pattern.detectedAt.toISOString(),
      pattern.status,
      pattern.successRate,
      pattern.xpReward
    ]);

    await this.updatePerformanceStats(pattern.type);
  }

  private async createAlert(pattern: Pattern): Promise<void> {
    const priority = pattern.confidence > 85 ? 'high' : 
                    pattern.confidence > 70 ? 'medium' : 'low';
    
    const alert: PatternAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patternId: pattern.id,
      message: `${pattern.type} pattern detected on ${pattern.symbol} with ${pattern.confidence}% confidence`,
      priority,
      timestamp: new Date(),
      read: false,
      actionTaken: false
    };

    const query = `
      INSERT INTO pattern_alerts (
        id, pattern_id, message, priority, timestamp, read, action_taken
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await this.databaseService.executeSql(query, [
      alert.id,
      alert.patternId,
      alert.message,
      alert.priority,
      alert.timestamp.toISOString(),
      alert.read,
      alert.actionTaken
    ]);

    this.emit('alertCreated', alert);
  }

  private async updatePerformanceStats(patternType: string): Promise<void> {
    const existingQuery = 'SELECT * FROM pattern_performance WHERE pattern_type = ?';
    const existing = await this.databaseService.executeSql(existingQuery, [patternType]);

    if (existing.length === 0) {
      const insertQuery = `
        INSERT INTO pattern_performance (
          id, pattern_type, total_detected, success_rate
        ) VALUES (?, ?, 1, ?)
      `;
      
      await this.databaseService.executeSql(insertQuery, [
        `perf_${patternType}_${Date.now()}`,
        patternType,
        Math.floor(Math.random() * 40) + 50 // Mock success rate
      ]);
    } else {
      const updateQuery = `
        UPDATE pattern_performance 
        SET total_detected = total_detected + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE pattern_type = ?
      `;
      
      await this.databaseService.executeSql(updateQuery, [patternType]);
    }
  }

  // Public API methods
  public async getActivePatterns(): Promise<Pattern[]> {
    const query = `
      SELECT * FROM patterns 
      WHERE status = 'active' 
      ORDER BY detected_at DESC 
      LIMIT 50
    `;
    
    const results = await this.databaseService.executeSql(query, []);
    return results.map(this.mapRowToPattern);
  }

  public async getAlerts(): Promise<PatternAlert[]> {
    const query = `
      SELECT * FROM pattern_alerts 
      ORDER BY timestamp DESC 
      LIMIT 100
    `;
    
    const results = await this.databaseService.executeSql(query, []);
    return results.map(this.mapRowToAlert);
  }

  public async getPatternPerformance(): Promise<PatternPerformance[]> {
    const query = 'SELECT * FROM pattern_performance ORDER BY success_rate DESC';
    const results = await this.databaseService.executeSql(query, []);
    
    return results.map(row => ({
      patternType: row.pattern_type,
      totalDetected: row.total_detected,
      successCount: row.success_count,
      failureCount: row.failure_count,
      successRate: row.success_rate,
      avgReturn: row.avg_return || 0,
      bestReturn: row.best_return || 0,
      worstReturn: row.worst_return || 0
    }));
  }

  public async handlePatternAction(patternId: string, action: 'accept' | 'reject'): Promise<void> {
    const status = action === 'accept' ? 'completed' : 'failed';
    
    const updateQuery = 'UPDATE patterns SET status = ? WHERE id = ?';
    await this.databaseService.executeSql(updateQuery, [status, patternId]);

    // Update related alert
    const alertQuery = 'UPDATE pattern_alerts SET action_taken = TRUE WHERE pattern_id = ?';
    await this.databaseService.executeSql(alertQuery, [patternId]);

    this.emit('patternAction', { patternId, action });
  }

  public async markAlertAsRead(alertId: string): Promise<void> {
    const query = 'UPDATE pattern_alerts SET read = TRUE WHERE id = ?';
    await this.databaseService.executeSql(query, [alertId]);
  }

  public async updateAlertSettings(settings: AlertSettings): Promise<void> {
    const query = `
      INSERT OR REPLACE INTO alert_settings (
        id, enable_sound, enable_visual, min_confidence, 
        priority_filter, pattern_types, symbols
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await this.databaseService.executeSql(query, [
      'default_settings',
      settings.enableSound,
      settings.enableVisual,
      settings.minConfidence,
      JSON.stringify(settings.priorityFilter),
      JSON.stringify(settings.patternTypes),
      JSON.stringify(settings.symbols)
    ]);
  }

  public async getAlertSettings(): Promise<AlertSettings> {
    const query = 'SELECT * FROM alert_settings WHERE id = ?';
    const results = await this.databaseService.executeSql(query, ['default_settings']);
    
    if (results.length === 0) {
      return {
        enableSound: true,
        enableVisual: true,
        minConfidence: 70,
        priorityFilter: ['high', 'medium', 'low'],
        patternTypes: [],
        symbols: []
      };
    }

    const row = results[0];
    return {
      enableSound: row.enable_sound,
      enableVisual: row.enable_visual,
      minConfidence: row.min_confidence,
      priorityFilter: JSON.parse(row.priority_filter || '["high","medium","low"]'),
      patternTypes: JSON.parse(row.pattern_types || '[]'),
      symbols: JSON.parse(row.symbols || '[]')
    };
  }

  // Event handling
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Helper methods
  private mapRowToPattern(row: any): Pattern {
    return {
      id: row.id,
      type: row.type,
      symbol: row.symbol,
      confidence: row.confidence,
      direction: row.direction,
      priceTarget: row.price_target,
      stopLoss: row.stop_loss,
      timeframe: row.timeframe,
      detectedAt: new Date(row.detected_at),
      status: row.status,
      successRate: row.success_rate,
      xpReward: row.xp_reward
    };
  }

  private mapRowToAlert(row: any): PatternAlert {
    return {
      id: row.id,
      patternId: row.pattern_id,
      message: row.message,
      priority: row.priority,
      timestamp: new Date(row.timestamp),
      read: row.read,
      actionTaken: row.action_taken
    };
  }

  // Cleanup
  public destroy(): void {
    this.eventListeners.clear();
  }
}