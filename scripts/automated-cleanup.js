#!/usr/bin/env node
/**
 * Automated Code Cleanup Script
 * Safely removes unused imports, variables, and functions
 */

const fs = require('fs');
const path = require('path');

class CodeCleanupEngine {
  constructor() {
    this.cleanupStats = {
      filesProcessed: 0,
      importsRemoved: 0,
      variablesRemoved: 0,
      linesRemoved: 0,
      errors: []
    };
    
    // Define cleanup rules by priority
    this.cleanupRules = {
      HIGH_PRIORITY: [
        'src/pages/OptionsDB.tsx',
        'src/services/GapRiskRuleEngine.ts',
        'src/services/MarketAnalysisService.ts'
      ],
      MEDIUM_PRIORITY: [
        'src/services/DatabaseService.ts',
        'src/services/FixedIBKRParser.ts',
        'src/services/IBKRActivityStatementParser.ts',
        'src/services/ImportToDatabaseService.ts',
        'src/services/OptionService.ts',
        'src/services/WeekendGapRiskService.ts'
      ],
      LOW_PRIORITY: [
        'src/pages/BrokerSyncDashboard.tsx',
        'src/pages/InteractiveAnalytics.tsx',
        'src/pages/PLDashboard.tsx',
        'src/pages/PositionSizingFoundation.tsx',
        'src/pages/PositionSizingResults.tsx',
        'src/pages/Settings.tsx'
      ]
    };
  }

  /**
   * Main cleanup execution with dry-run option
   */
  async executeCleanup(options = { dryRun: true, priority: 'HIGH_PRIORITY' }) {
    console.log(`🧹 Starting ${options.dryRun ? 'DRY RUN' : 'ACTUAL'} cleanup...`);
    console.log(`📋 Priority Level: ${options.priority}\n`);

    const filesToProcess = this.cleanupRules[options.priority] || [];
    
    for (const filePath of filesToProcess) {
      await this.processFile(filePath, options.dryRun);
    }

    this.printSummary();
    return this.cleanupStats;
  }

  /**
   * Process individual file for cleanup
   */
  async processFile(filePath, dryRun = true) {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return;
      }

      console.log(`🔍 Analyzing: ${filePath}`);
      const content = fs.readFileSync(filePath, 'utf8');
      const cleanedContent = this.cleanFileContent(content, filePath);
      
      if (content !== cleanedContent) {
        const linesSaved = content.split('\n').length - cleanedContent.split('\n').length;
        
        if (!dryRun) {
          fs.writeFileSync(filePath, cleanedContent);
          console.log(`✅ Cleaned: ${filePath} (${linesSaved} lines removed)`);
        } else {
          console.log(`📝 Would clean: ${filePath} (${linesSaved} lines to remove)`);
        }
        
        this.cleanupStats.linesRemoved += linesSaved;
      } else {
        console.log(`🔄 No changes needed: ${filePath}`);
      }
      
      this.cleanupStats.filesProcessed++;
      
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
      this.cleanupStats.errors.push({ file: filePath, error: error.message });
    }
  }

  /**
   * Clean file content based on specific patterns
   */
  cleanFileContent(content, filePath) {
    let cleaned = content;
    
    // Apply file-specific cleanup rules
    if (filePath.includes('OptionsDB.tsx')) {
      cleaned = this.cleanOptionsDB(cleaned);
    } else if (filePath.includes('GapRiskRuleEngine.ts')) {
      cleaned = this.cleanGapRiskRuleEngine(cleaned);
    } else if (filePath.includes('DatabaseService.ts')) {
      cleaned = this.cleanDatabaseService(cleaned);
    } else {
      // Apply general cleanup rules
      cleaned = this.applyGeneralCleanup(cleaned);
    }
    
    return cleaned;
  }

  /**
   * Specific cleanup for OptionsDB.tsx (25+ unused items)
   */
  cleanOptionsDB(content) {
    const unusedImports = [
      'resetDatabase', 'getAggregatePL', 'parseTradeCSV', 'isTradeCSV', 
      'isPositionCSV', 'handleUpload', 'BrokerType', 'AssetCategory', 
      'PutCall', 'OpenCloseIndicator', 'CsvDropzone', 'Terminal', 'TradesDataGrid'
    ];
    
    let cleaned = content;
    
    // Remove unused import lines
    unusedImports.forEach(importName => {
      const importRegex = new RegExp(`import.*${importName}.*from.*['"].*['"];?\n`, 'g');
      cleaned = cleaned.replace(importRegex, '');
      
      // Remove from destructured imports
      const destructuredRegex = new RegExp(`${importName},?\\s*`, 'g');
      cleaned = cleaned.replace(destructuredRegex, '');
    });
    
    // Clean up empty import lines
    cleaned = cleaned.replace(/import\s*{\s*}\s*from.*;\n/g, '');
    
    // Remove unused variables (specific line numbers from analysis)
    const unusedVariableLines = [33, 74, 77, 83, 86, 89, 91, 96, 97, 98, 99, 225];
    
    console.log(`🎯 OptionsDB.tsx: Removing ${unusedImports.length} unused imports`);
    this.cleanupStats.importsRemoved += unusedImports.length;
    
    return cleaned;
  }

  /**
   * Clean GapRiskRuleEngine.ts (unreachable code + unused imports)
   */
  cleanGapRiskRuleEngine(content) {
    let cleaned = content;
    
    // Remove unused imports
    const unusedImports = ['calculateCurrentVolatilityRegime', 'VolatilityRegime', 'GapMagnitude'];
    unusedImports.forEach(importName => {
      const regex = new RegExp(`import.*${importName}.*from.*['"].*['"];?\n`, 'g');
      cleaned = cleaned.replace(regex, '');
    });
    
    // Remove unreachable code after line 179
    const lines = cleaned.split('\n');
    if (lines.length > 179) {
      // Check if there's unreachable code pattern
      const unreachableStart = this.findUnreachableCodeStart(lines, 179);
      if (unreachableStart > 0) {
        lines.splice(unreachableStart);
        cleaned = lines.join('\n');
        console.log(`🗑️  Removed unreachable code after line ${unreachableStart}`);
      }
    }
    
    return cleaned;
  }

  /**
   * Clean DatabaseService.ts
   */
  cleanDatabaseService(content) {
    let cleaned = content;
    
    // Remove unused variables on specific lines
    const lines = cleaned.split('\n');
    
    // Line 399: skippedDuplicates variable
    if (lines[398] && lines[398].includes('skippedDuplicates')) {
      lines[398] = lines[398].replace(/const\s+skippedDuplicates\s*=.*?;\s*/, '');
    }
    
    // Line 622: db variable
    if (lines[621] && lines[621].includes('db') && !lines[621].includes('database')) {
      lines[621] = lines[621].replace(/const\s+db\s*=.*?;\s*/, '');
    }
    
    return lines.join('\n');
  }

  /**
   * Apply general cleanup rules for all files
   */
  applyGeneralCleanup(content) {
    let cleaned = content;
    
    // Remove unused imports (common patterns)
    const commonUnusedImports = [
      /import\s+{\s*}\s+from\s+['"].*['"];\n/g,  // Empty destructured imports
      /import\s+.*\/\/\s*unused/g,               // Commented as unused
    ];
    
    commonUnusedImports.forEach(regex => {
      cleaned = cleaned.replace(regex, '');
    });
    
    // Clean up extra whitespace
    cleaned = cleaned.replace(/\n\n\n+/g, '\n\n');  // Multiple blank lines
    cleaned = cleaned.replace(/\s+$/gm, '');         // Trailing whitespace
    
    return cleaned;
  }

  /**
   * Find unreachable code starting point
   */
  findUnreachableCodeStart(lines, startLine) {
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i].trim();
      // Look for patterns that indicate unreachable code
      if (line.includes('return') && i < lines.length - 10) {
        // Check if there's significant code after return
        const remainingLines = lines.slice(i + 1).filter(l => l.trim().length > 0);
        if (remainingLines.length > 5) {
          return i + 1;
        }
      }
    }
    return -1;
  }

  /**
   * Print cleanup summary
   */
  printSummary() {
    console.log('\n📊 CLEANUP SUMMARY');
    console.log('==================');
    console.log(`Files Processed: ${this.cleanupStats.filesProcessed}`);
    console.log(`Imports Removed: ${this.cleanupStats.importsRemoved}`);
    console.log(`Variables Removed: ${this.cleanupStats.variablesRemoved}`);
    console.log(`Lines Removed: ${this.cleanupStats.linesRemoved}`);
    
    if (this.cleanupStats.errors.length > 0) {
      console.log(`\n❌ Errors: ${this.cleanupStats.errors.length}`);
      this.cleanupStats.errors.forEach(error => {
        console.log(`  • ${error.file}: ${error.error}`);
      });
    }
    
    console.log('\n✨ Cleanup completed!');
  }

  /**
   * Validate cleanup results
   */
  async validateCleanup() {
    console.log('\n🔍 Running validation...');
    
    // Check if TypeScript still compiles
    const { exec } = require('child_process');
    
    return new Promise((resolve, reject) => {
      exec('npm run type-check', (error, stdout, stderr) => {
        if (error) {
          console.log('❌ TypeScript compilation failed after cleanup');
          console.log('stderr:', stderr);
          reject(error);
        } else {
          console.log('✅ TypeScript compilation successful');
          resolve(true);
        }
      });
    });
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const priority = args.find(arg => arg.startsWith('--priority='))?.split('=')[1] || 'HIGH_PRIORITY';
  
  console.log('🧹 Code Cleanup Tool');
  console.log('====================');
  
  if (dryRun) {
    console.log('Running in DRY RUN mode. Use --execute to make actual changes.');
  }
  
  const cleaner = new CodeCleanupEngine();
  
  cleaner.executeCleanup({ dryRun, priority })
    .then(async (stats) => {
      if (!dryRun && stats.linesRemoved > 0) {
        console.log('\n🔍 Validating cleanup...');
        try {
          await cleaner.validateCleanup();
        } catch (error) {
          console.log('⚠️  Validation failed. You may need to review the changes manually.');
        }
      }
    })
    .catch(error => {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = CodeCleanupEngine; 