#!/usr/bin/env node

/**
 * Import Path Update Helper for Phase 0 File Reorganization
 * Helps update import statements when files are moved
 */

const fs = require('fs');
const path = require('path');

class ImportUpdater {
  constructor() {
    this.updateLog = [];
  }

  /**
   * Update import paths in a file content
   */
  updateImportPath(content, oldPath, newPath) {
    const updates = [];
    
    // Handle various import patterns
    const patterns = [
      { 
        regex: new RegExp(`from ['"]${this.escapeRegex(oldPath)}['"]`, 'g'),
        replacement: `from '${newPath}'`,
        type: 'ES6 import'
      },
      {
        regex: new RegExp(`import\\(['"]${this.escapeRegex(oldPath)}['"]\\)`, 'g'),
        replacement: `import('${newPath}')`,
        type: 'Dynamic import'
      },
      {
        regex: new RegExp(`require\\(['"]${this.escapeRegex(oldPath)}['"]\\)`, 'g'),
        replacement: `require('${newPath}')`,
        type: 'CommonJS require'
      }
    ];

    let updatedContent = content;
    patterns.forEach(pattern => {
      const matches = content.match(pattern.regex);
      if (matches) {
        updatedContent = updatedContent.replace(pattern.regex, pattern.replacement);
        updates.push({
          type: pattern.type,
          count: matches.length,
          oldPath,
          newPath
        });
      }
    });

    return {
      content: updatedContent,
      updates
    };
  }

  /**
   * Escape special regex characters
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Update imports in all TypeScript/JavaScript files
   */
  async updateProjectImports(oldPath, newPath) {
    const glob = require('glob');
    const filePatterns = ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'];
    
    let totalUpdates = 0;
    
    for (const pattern of filePatterns) {
      const files = glob.sync(pattern);
      
      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const result = this.updateImportPath(content, oldPath, newPath);
          
          if (result.updates.length > 0) {
            fs.writeFileSync(file, result.content, 'utf8');
            totalUpdates += result.updates.reduce((sum, update) => sum + update.count, 0);
            
            this.updateLog.push({
              file,
              updates: result.updates
            });
          }
        } catch (error) {
          console.error(`Error updating ${file}:`, error.message);
        }
      }
    }
    
    return totalUpdates;
  }

  /**
   * Generate update report
   */
  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      totalFiles: this.updateLog.length,
      totalUpdates: this.updateLog.reduce((sum, log) => 
        sum + log.updates.reduce((updateSum, update) => updateSum + update.count, 0), 0),
      details: this.updateLog
    };
  }
}

// Export for use in other scripts
module.exports = ImportUpdater;

// CLI usage
if (require.main === module) {
  const [,, oldPath, newPath] = process.argv;
  
  if (!oldPath || !newPath) {
    console.log('Usage: node update-imports.js <old-path> <new-path>');
    console.log('Example: node update-imports.js "../services/OldService" "../services/new/NewService"');
    process.exit(1);
  }
  
  const updater = new ImportUpdater();
  updater.updateProjectImports(oldPath, newPath)
    .then(totalUpdates => {
      console.log(`✅ Updated ${totalUpdates} import statements`);
      
      // Save report
      const report = updater.generateReport();
      const reportPath = `analysis/reports/import-updates-${Date.now()}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📁 Report saved to: ${reportPath}`);
    })
    .catch(error => {
      console.error('❌ Error updating imports:', error);
      process.exit(1);
    });
}