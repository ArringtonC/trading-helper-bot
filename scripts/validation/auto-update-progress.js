#!/usr/bin/env node

/**
 * Automatic Progress Updater for Phase 0 Tasks
 * Checks task completion and updates markdown checkboxes automatically
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

class ProgressUpdater {
  constructor() {
    this.taskFile = 'PHASE_0_CURSOR_DETAILED_TASKS.md';
    this.verificationScript = 'scripts/validation/verify-phase-0-tasks.sh';
    this.completedTasks = new Set();
  }

  /**
   * Check if a file exists and meets minimum size requirement
   */
  checkFileExists(filePath, minSize = 0) {
    try {
      const stats = fs.statSync(filePath);
      return stats.isFile() && stats.size >= minSize;
    } catch {
      return false;
    }
  }

  /**
   * Check if a directory exists
   */
  checkDirectoryExists(dirPath) {
    try {
      const stats = fs.statSync(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check git branch status
   */
  checkGitBranch(branchName) {
    try {
      const branches = execSync('git branch', { encoding: 'utf8' });
      return branches.includes(branchName);
    } catch {
      return false;
    }
  }

  /**
   * Check if command is available globally
   */
  checkCommand(command) {
    try {
      execSync(`which ${command}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Run all task verifications
   */
  verifyTasks() {
    const results = {};

    // Task 1: Environment Setup
    results['1.1'] = this.checkGitBranch('phase-0-decluttering-backup');
    results['1.2'] = this.checkGitBranch('phase-0-decluttering-backup'); // Simplified check
    results['1.3'] = this.checkGitBranch('phase-0-file-organization');
    results['1.4'] = this.checkCommand('knip');
    results['1.5'] = this.checkCommand('ts-unused-exports');

    // Task 2: Analysis Infrastructure
    results['2.1'] = this.checkDirectoryExists('analysis/reports') && 
                     this.checkDirectoryExists('analysis/metrics') && 
                     this.checkDirectoryExists('scripts/migration') && 
                     this.checkDirectoryExists('scripts/automation');
    
    results['2.2'] = this.checkFileExists('analysis/phase-0-progress.md', 500);
    results['2.3'] = this.checkFileExists('scripts/automation/analyze-codebase.sh', 2000);
    results['2.4'] = this.checkFileExists('analysis/reports') && // Check if analysis was run
                     fs.readdirSync('analysis/reports').length > 0;

    // Task 3: Development Configuration  
    results['3.1'] = this.checkFileExists('.vscode/settings.json', 500);
    results['3.2'] = this.checkFileExists('.vscode/extensions.json', 200);
    results['3.3'] = this.checkFileExists('scripts/automation/update-imports.js', 3000);
    results['3.4'] = this.checkFileExists('analysis/reports/initial-typescript-status.txt');

    return results;
  }

  /**
   * Update markdown checkboxes based on verification results
   */
  updateTaskFile(results) {
    if (!fs.existsSync(this.taskFile)) {
      console.log(`❌ Task file not found: ${this.taskFile}`);
      return false;
    }

    let content = fs.readFileSync(this.taskFile, 'utf8');
    let updatedCount = 0;

    // Update checkboxes based on results
    for (const [taskId, isComplete] of Object.entries(results)) {
      const taskRegex = new RegExp(`- \\[([ x])\\] Task ${taskId}[:.][^\\n]*`, 'g');
      const newCheckbox = isComplete ? '[x]' : '[ ]';
      
      content = content.replace(taskRegex, (match) => {
        const currentStatus = match.match(/- \[([ x])\]/)[1];
        if (currentStatus !== (isComplete ? 'x' : ' ')) {
          updatedCount++;
          return match.replace(/- \[([ x])\]/, `- ${newCheckbox}`);
        }
        return match;
      });
    }

    // Write updated content back to file
    fs.writeFileSync(this.taskFile, content, 'utf8');
    
    return updatedCount;
  }

  /**
   * Generate progress report
   */
  generateReport(results) {
    const totalTasks = Object.keys(results).length;
    const completedTasks = Object.values(results).filter(Boolean).length;
    const completionRate = Math.round((completedTasks / totalTasks) * 100);

    console.log('====================================');
    console.log('AUTOMATIC PROGRESS UPDATE REPORT');
    console.log('====================================');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('');
    console.log('📊 TASK STATUS:');
    
    for (const [taskId, isComplete] of Object.entries(results)) {
      const status = isComplete ? '✅' : '❌';
      console.log(`  Task ${taskId}: ${status}`);
    }

    console.log('');
    console.log('📈 SUMMARY:');
    console.log(`  Total Tasks: ${totalTasks}`);
    console.log(`  Completed: ${completedTasks}`);
    console.log(`  Completion Rate: ${completionRate}%`);

    if (completionRate === 100) {
      console.log('');
      console.log('🎉 ALL PHASE 0.1 TASKS COMPLETE!');
      console.log('✅ Ready for Phase 0.2');
    } else if (completionRate >= 80) {
      console.log('');
      console.log('⚠️  MOSTLY COMPLETE - Minor issues to fix');
    } else {
      console.log('');
      console.log('❌ SIGNIFICANT WORK REMAINING');
    }

    return { totalTasks, completedTasks, completionRate };
  }

  /**
   * Main execution function
   */
  run() {
    console.log('🔍 Checking task completion status...');
    
    const results = this.verifyTasks();
    const updatedCount = this.updateTaskFile(results);
    const report = this.generateReport(results);

    console.log('');
    console.log('📝 UPDATES:');
    console.log(`  Updated ${updatedCount} checkboxes`);
    console.log(`  Progress file: ${this.taskFile}`);

    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      phase: '0.1',
      results,
      summary: report,
      updatedCheckboxes: updatedCount
    };

    const reportPath = `analysis/reports/progress-update-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`  Detailed report: ${reportPath}`);

    return report.completionRate;
  }
}

// Execute if run directly
if (require.main === module) {
  const updater = new ProgressUpdater();
  const completionRate = updater.run();
  
  // Exit with appropriate code
  process.exit(completionRate === 100 ? 0 : 1);
}

module.exports = ProgressUpdater;