#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { TraderProfile } from '../../src/components/BestTraders/types';
import { secEdgarService, TraderPickAnalysis } from '../../src/services/SECEdgarService';

// Configuration
const CONFIG = {
  OUTPUT_FILE: path.join(process.cwd(), 'public/data/traders.json'),
  BACKUP_FILE: path.join(process.cwd(), 'public/data/traders-backup.json'),
  LOG_FILE: path.join(process.cwd(), 'scripts/automation/logs/trader-update.log'),
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000 // 5 seconds
} as const;

// Logging utility
class Logger {
  private logFile: string;

  constructor(logFile: string) {
    this.logFile = logFile;
  }

  private async ensureLogDir(): Promise<void> {
    const logDir = path.dirname(this.logFile);
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }
  }

  async log(level: 'INFO' | 'ERROR' | 'WARN', message: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}\n`;
    
    console.log(`${level}: ${message}`);
    
    try {
      await this.ensureLogDir();
      await fs.appendFile(this.logFile, logMessage);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  async info(message: string): Promise<void> {
    await this.log('INFO', message);
  }

  async error(message: string): Promise<void> {
    await this.log('ERROR', message);
  }

  async warn(message: string): Promise<void> {
    await this.log('WARN', message);
  }
}

// Trader data update service
class TraderDataUpdater {
  private logger: Logger;

  constructor() {
    this.logger = new Logger(CONFIG.LOG_FILE);
  }

  /**
   * Load existing trader data
   */
  private async loadExistingData(): Promise<TraderProfile[]> {
    try {
      const data = await fs.readFile(CONFIG.OUTPUT_FILE, 'utf8');
      const traders = JSON.parse(data) as TraderProfile[];
      await this.logger.info(`Loaded ${traders.length} existing trader profiles`);
      return traders;
    } catch (error) {
      await this.logger.warn(`No existing trader data found: ${error}`);
      return [];
    }
  }

  /**
   * Create backup of existing data
   */
  private async createBackup(data: TraderProfile[]): Promise<void> {
    try {
      await fs.writeFile(CONFIG.BACKUP_FILE, JSON.stringify(data, null, 2));
      await this.logger.info('Created backup of existing trader data');
    } catch (error) {
      await this.logger.error(`Failed to create backup: ${error}`);
      throw error;
    }
  }

  /**
   * Convert SEC picks to our TraderProfile format
   */
  private convertPicksToTraderFormat(picks: TraderPickAnalysis[]): TraderProfile['latestPicks'] {
    return picks.map(pick => ({
      ticker: pick.ticker,
      thesis: pick.thesis,
      date: pick.date
    }));
  }

  /**
   * Update Michael Burry's profile with latest SEC data
   */
  private async updateMichaelBurryProfile(existingTraders: TraderProfile[]): Promise<TraderProfile[]> {
    await this.logger.info('Fetching Michael Burry latest 13F data from SEC EDGAR...');

    try {
      // Test SEC API connection first
      const connectionOk = await secEdgarService.testConnection();
      if (!connectionOk) {
        throw new Error('SEC EDGAR API connection test failed');
      }

      // Fetch latest picks
      let latestPicks: TraderPickAnalysis[] = [];
      let retryCount = 0;

      while (retryCount < CONFIG.MAX_RETRIES) {
        try {
          latestPicks = await secEdgarService.getMichaelBurryLatestPicks();
          break;
        } catch (error) {
          retryCount++;
          await this.logger.warn(`Attempt ${retryCount} failed: ${error}`);
          
          if (retryCount < CONFIG.MAX_RETRIES) {
            await this.logger.info(`Retrying in ${CONFIG.RETRY_DELAY}ms...`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
          } else {
            throw error;
          }
        }
      }

      if (latestPicks.length === 0) {
        await this.logger.warn('No recent 13F data found for Michael Burry');
        return existingTraders;
      }

      await this.logger.info(`Successfully fetched ${latestPicks.length} latest picks from SEC 13F filing`);

      // Find Michael Burry's profile or create new one
      const burryIndex = existingTraders.findIndex(trader => trader.id === '1' || trader.name === 'Michael Burry');
      
      const baseProfile: TraderProfile = {
        id: "1",
        name: "Michael Burry",
        imageUrl: "https://a57.foxnews.com/static.foxbusiness.com/foxbusiness.com/content/uploads/2024/03/1440/810/MIchael-Burry-Big-Short-scaled.jpg?ve=1&tl=1",
        bio: "An American investor and former physician known for his meticulous, independent research. He founded Scion Capital and famously predicted the 2008 subprime mortgage crisis, a feat detailed in 'The Big Short.' Burry is renowned for his contrarian, deep-value investment style and high-conviction bets against prevailing market sentiment.",
        philosophy: "Deep value analysis, contrarian thinking, and an unwavering focus on margin of safety.",
        famousTrades: [
          {
            title: "The \"Big Short\" (2005-2008)",
            summary: "Identified the 2008 subprime mortgage crisis by analyzing risky loan data and used credit default swaps to bet against the housing market, yielding nearly 500% returns for his fund."
          },
          {
            title: "GameStop (2019-2020)",
            summary: "Identified GameStop as deeply undervalued, successfully pushed for a massive share buyback, and realized significant profits before the famous 2021 short squeeze."
          },
          {
            title: "Tesla Short (2021)",
            summary: "Took a significant short position against Tesla, betting that the company's valuation was unsustainable and overly reliant on regulatory credits."
          }
        ],
        latestPicks: this.convertPicksToTraderFormat(latestPicks)
      };

      const updatedTraders = [...existingTraders];
      
      if (burryIndex >= 0) {
        // Update existing profile, preserving bio and famous trades
        updatedTraders[burryIndex] = {
          ...updatedTraders[burryIndex],
          latestPicks: baseProfile.latestPicks
        };
        await this.logger.info('Updated existing Michael Burry profile with latest picks');
      } else {
        // Add new profile
        updatedTraders.unshift(baseProfile);
        await this.logger.info('Added new Michael Burry profile');
      }

      // Log portfolio summary
      const totalValue = latestPicks.reduce((sum, pick) => sum + (pick.marketValue || 0), 0);
      const putPositions = latestPicks.filter(pick => pick.position === 'Put').length;
      const longPositions = latestPicks.filter(pick => pick.position === 'Long').length;
      
      await this.logger.info(`Portfolio Summary - Total Value: $${totalValue.toLocaleString()}, Positions: ${longPositions} Long, ${putPositions} Put`);

      return updatedTraders;

    } catch (error) {
      await this.logger.error(`Failed to update Michael Burry profile: ${error}`);
      throw error;
    }
  }

  /**
   * Save updated trader data
   */
  private async saveData(traders: TraderProfile[]): Promise<void> {
    try {
      const outputDir = path.dirname(CONFIG.OUTPUT_FILE);
      await fs.mkdir(outputDir, { recursive: true });
      
      const jsonData = JSON.stringify(traders, null, 2);
      await fs.writeFile(CONFIG.OUTPUT_FILE, jsonData);
      
      await this.logger.info(`Successfully saved ${traders.length} trader profiles to ${CONFIG.OUTPUT_FILE}`);
    } catch (error) {
      await this.logger.error(`Failed to save trader data: ${error}`);
      throw error;
    }
  }

  /**
   * Generate update summary
   */
  private async generateSummary(beforeCount: number, afterCount: number, updatedPicksCount: number): Promise<void> {
    const summary = {
      timestamp: new Date().toISOString(),
      beforeCount,
      afterCount,
      updatedPicksCount,
      success: true
    };

    const summaryFile = path.join(path.dirname(CONFIG.LOG_FILE), 'last-update-summary.json');
    
    try {
      await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));
      await this.logger.info(`Update completed successfully. Updated ${updatedPicksCount} picks.`);
    } catch (error) {
      await this.logger.warn(`Failed to save update summary: ${error}`);
    }
  }

  /**
   * Main update process
   */
  async update(): Promise<void> {
    const startTime = Date.now();
    await this.logger.info('=== Starting trader data update process ===');

    try {
      // Load existing data
      const existingTraders = await this.loadExistingData();
      const beforeCount = existingTraders.length;

      // Create backup
      if (existingTraders.length > 0) {
        await this.createBackup(existingTraders);
      }

      // Update Michael Burry's profile
      const updatedTraders = await this.updateMichaelBurryProfile(existingTraders);
      const afterCount = updatedTraders.length;

      // Count updated picks
      const burryProfile = updatedTraders.find(t => t.name === 'Michael Burry');
      const updatedPicksCount = burryProfile?.latestPicks.length || 0;

      // Save updated data
      await this.saveData(updatedTraders);

      // Generate summary
      await this.generateSummary(beforeCount, afterCount, updatedPicksCount);

      const duration = Date.now() - startTime;
      await this.logger.info(`=== Update process completed in ${duration}ms ===`);

    } catch (error) {
      await this.logger.error(`Update process failed: ${error}`);
      
      // Try to restore from backup if something went wrong
      try {
        const backupData = await fs.readFile(CONFIG.BACKUP_FILE, 'utf8');
        await fs.writeFile(CONFIG.OUTPUT_FILE, backupData);
        await this.logger.info('Restored data from backup due to update failure');
      } catch (restoreError) {
        await this.logger.error(`Failed to restore from backup: ${restoreError}`);
      }
      
      throw error;
    }
  }
}

// CLI interface
async function main(): Promise<void> {
  const updater = new TraderDataUpdater();
  
  try {
    await updater.update();
    process.exit(0);
  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { TraderDataUpdater };
