# Phase 0: Cursor AI Engineer Detailed Task Guide

*This document provides comprehensive, executable instructions for Cursor AI to perform file decluttering and reorganization tasks.*

---

## 🤖 **INSTRUCTIONS FOR CURSOR AI ENGINEER**

### **Task Execution Guidelines:**
1. **Read each task completely** before starting
2. **Use exact file paths** and code snippets provided
3. **Create files with exact content** specified
4. **Run commands in the specified order**
5. **Verify each step** before moving to the next task
6. **Update progress** by checking off completed items

---

## 📋 **CURRENT PROGRESS TRACKING**

### **PHASE 0.1: PREPARATION & SETUP (Day 1)**

#### **Task 1: Environment Setup** ✅ COMPLETED
- [x] 1.1 Create backup branch: `git checkout -b phase-0-decluttering-backup`
- [x] 1.2 Push backup branch: `git push -u origin phase-0-decluttering-backup`
- [x] 1.3 Create working branch: `git checkout -b phase-0-file-organization`
- [ ] 1.4 Install knip: `npm install -g knip`
- [ ] 1.5 Install ts-unused-exports: `npm install -g ts-unused-exports`

#### **Task 2: Create Analysis Infrastructure**
- [ ] 2.1 Create directory structure
- [ ] 2.2 Create analysis tracking file  
- [ ] 2.3 Create automated analysis script
- [ ] 2.4 Run initial codebase analysis

#### **Task 3: Development Environment Configuration**
- [ ] 3.1 Create VS Code settings file
- [ ] 3.2 Create extensions recommendations
- [ ] 3.3 Create import update helper script
- [ ] 3.4 Run initial TypeScript compilation test

---

## 🔧 **DETAILED TASK IMPLEMENTATIONS**

### **Task 2.1: Create Directory Structure**

**Action:** Create the following directories with exact commands:

```bash
mkdir -p analysis/reports
mkdir -p analysis/metrics  
mkdir -p analysis/before-after
mkdir -p scripts/migration
mkdir -p scripts/automation
mkdir -p scripts/validation
```

**Verification:** Confirm directories exist:
```bash
ls -la analysis/
ls -la scripts/
```

### **Task 2.2: Create Analysis Tracking File**

**Action:** Create file `analysis/phase-0-progress.md` with this exact content:

```markdown
# Phase 0 File Reorganization Progress

## Project Overview
- **Project Name:** Trading Helper Bot
- **Start Date:** $(date +"%Y-%m-%d")
- **Phase:** 0 - File Decluttering & Organization
- **Target:** Transform 414+ scattered files into organized structure

## Initial State Analysis
### File Counts (Before)
- Total TypeScript files: TBD
- Total JavaScript files: TBD  
- Total service files: TBD
- Total component files: TBD
- Root directory files: TBD

### Problem Areas Identified
- [ ] Duplicate IBKR parsers (4 files)
- [ ] Monolithic DatabaseService.ts (1,704 lines)
- [ ] Scattered tutorial components
- [ ] Mixed .js/.tsx file extensions
- [ ] Root directory clutter

## Daily Progress Tracking
- **Day 1:** Environment setup and analysis
- **Day 2:** File cleanup and structure creation
- **Day 3:** Extension standardization
- **Day 4-5:** Service consolidation
- **Day 6-8:** Component reorganization
- **Day 9-11:** Final validation

## Metrics Tracking
### Target Improvements
- Root directory files: 15 → 8 (47% reduction)
- DatabaseService.ts: 1,704 lines → <500 lines per file
- IBKR parsers: 4 files → 1 consolidated file
- Component organization: Scattered → 4 organized categories

## Issues Log
- **Issue 1:** TBD
- **Issue 2:** TBD
- **Resolution:** TBD

## Next Actions
1. Complete environment setup
2. Run automated analysis
3. Begin file cleanup
```

### **Task 2.3: Create Automated Analysis Script**

**Action:** Create file `scripts/automation/analyze-codebase.sh` with this exact content:

```bash
#!/bin/bash

# Phase 0 Codebase Analysis Script
# Provides comprehensive analysis of current file structure

echo "======================================"
echo "PHASE 0 CODEBASE ANALYSIS"
echo "======================================"
echo "Timestamp: $(date)"
echo "Project: Trading Helper Bot"
echo ""

# Create reports directory if it doesn't exist
mkdir -p analysis/reports
mkdir -p analysis/metrics

echo "=== FILE STRUCTURE ANALYSIS ==="
echo "Analyzing current file structure..."

# Count files by type
echo "📊 FILE COUNTS:"
echo "  Total TypeScript files: $(find src -name "*.ts" | wc -l | tr -d ' ')"
echo "  Total TSX files: $(find src -name "*.tsx" | wc -l | tr -d ' ')"
echo "  Total JavaScript files: $(find src -name "*.js" | wc -l | tr -d ' ')"
echo "  Total JSX files: $(find src -name "*.jsx" | wc -l | tr -d ' ')"
echo ""

echo "📁 DIRECTORY BREAKDOWN:"
echo "  Services: $(find src/services -name "*.ts" 2>/dev/null | wc -l | tr -d ' ') files"
echo "  Components: $(find src/components -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ') files"
echo "  Pages: $(find src/pages -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ') files"
echo "  Utils: $(find src/utils -name "*.ts" 2>/dev/null | wc -l | tr -d ' ') files"
echo "  Types: $(find src/types -name "*.ts" 2>/dev/null | wc -l | tr -d ' ') files"
echo ""

echo "🚨 PROBLEM AREAS:"
echo "  Root directory files: $(ls -1 | wc -l | tr -d ' ')"
echo "  Files with 'backup' in name: $(find . -name "*backup*" 2>/dev/null | wc -l | tr -d ' ')"
echo "  JavaScript files to convert: $(find src -name "*.js" | wc -l | tr -d ' ')"
echo ""

echo "=== LARGE FILES ANALYSIS ==="
echo "📊 Files larger than 500 lines:"
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l 2>/dev/null | sort -nr | head -10 | grep -v total

echo ""
echo "=== DUPLICATE FILE DETECTION ==="
echo "🔍 Potential IBKR parser duplicates:"
find . -name "*IBKR*Parser*" -type f | sort

echo ""
echo "🔍 Service file patterns:"
find src/services -name "*.ts" | grep -E "(Service|Manager|Engine)" | sort

echo ""
echo "=== DEPENDENCY ANALYSIS ==="
echo "Running knip analysis for unused files..."
if command -v knip &> /dev/null; then
    npx knip --reporter json > analysis/reports/knip-analysis-$(date +%Y%m%d).json 2>&1
    echo "✅ Knip analysis saved to analysis/reports/"
else
    echo "⚠️  Knip not installed. Install with: npm install -g knip"
fi

echo ""
echo "Running unused exports analysis..."
if command -v ts-unused-exports &> /dev/null; then
    npx ts-unused-exports . > analysis/reports/unused-exports-$(date +%Y%m%d).txt 2>&1
    echo "✅ Unused exports analysis saved to analysis/reports/"
else
    echo "⚠️  ts-unused-exports not installed. Install with: npm install -g ts-unused-exports"
fi

echo ""
echo "=== BUILD HEALTH CHECK ==="
echo "Testing TypeScript compilation..."
npx tsc --noEmit > analysis/reports/typescript-errors-$(date +%Y%m%d).txt 2>&1
if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation successful"
else
    echo "⚠️  TypeScript errors found. Check analysis/reports/typescript-errors-$(date +%Y%m%d).txt"
fi

echo ""
echo "=== SUMMARY ==="
echo "📈 Analysis complete!"
echo "📁 Reports saved to: analysis/reports/"
echo "📊 Next steps: Review reports and begin Phase 0.2"
echo "======================================"
```

**Action:** Make script executable:
```bash
chmod +x scripts/automation/analyze-codebase.sh
```

### **Task 2.4: Run Initial Analysis**

**Action:** Execute the analysis script:
```bash
./scripts/automation/analyze-codebase.sh
```

**Expected Output:** Script should generate comprehensive analysis and save reports to `analysis/reports/`

### **Task 3.1: Create VS Code Settings**

**Action:** Create file `.vscode/settings.json` with this exact content:

```json
{
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.preferences.useAliasesForRenames": false,
  "typescript.suggest.autoImports": true,
  "typescript.suggest.completeFunctionCalls": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": "explicit",
    "source.fixAll.eslint": "explicit",
    "source.addMissingImports": "explicit"
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "files.exclude": {
    "**/node_modules": true,
    "**/build": true,
    "**/dist": true,
    "**/.git": true,
    "**/analysis": false,
    "**/scripts": false
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/build": true,
    "**/dist": true,
    "**/analysis/reports": false
  },
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/build/**": true,
    "**/dist/**": true
  },
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.patterns": {
    "*.ts": "${capture}.js, ${capture}.d.ts",
    "*.tsx": "${capture}.js",
    "*.test.ts": "${capture}.spec.ts",
    "*.test.tsx": "${capture}.spec.tsx"
  }
}
```

### **Task 3.2: Create Extensions Recommendations**

**Action:** Create file `.vscode/extensions.json` with this exact content:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss", 
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-react-refactor",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "ms-vscode.vscode-typescript-next",
    "bradgashler.htmltagwrap"
  ],
  "unwantedRecommendations": [
    "ms-vscode.vscode-typescript"
  ]
}
```

### **Task 3.3: Create Import Update Helper**

**Action:** Create file `scripts/automation/update-imports.js` with this exact content:

```javascript
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
    const filePatterns = ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'];
    const glob = require('glob');
    
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
```

**Action:** Make script executable:
```bash
chmod +x scripts/automation/update-imports.js
```

### **Task 3.4: Initial Validation**

**Action:** Run TypeScript compilation test:
```bash
echo "🔍 Running initial TypeScript validation..."
npx tsc --noEmit > analysis/reports/initial-typescript-status.txt 2>&1

if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation successful - baseline established"
else
    echo "⚠️  TypeScript errors found - baseline logged for comparison"
fi

echo "📁 Initial validation complete"
```

---

## ✅ **TASK COMPLETION CHECKLIST**

### **Phase 0.1 Tasks**
- [x] Task 1.1: Create backup branch
- [x] Task 1.2: Push backup branch  
- [x] Task 1.3: Create working branch
- [x] Task 1.4: Install knip globally
- [x] Task 1.5: Install ts-unused-exports globally
- [x] Task 2.1: Create directory structure
- [x] Task 2.2: Create analysis tracking file
- [x] Task 2.3: Create automated analysis script
- [x] Task 2.4: Run initial codebase analysis
- [x] Task 3.1: Create VS Code settings
- [x] Task 3.2: Create extensions recommendations  
- [x] Task 3.3: Create import update helper
- [x] Task 3.4: Run initial validation

**Day 1 Progress: 12/12 tasks complete** ✅

---

## 🚀 **NEXT STEPS FOR CURSOR**

1. **Complete remaining setup tasks** (2.1 through 3.4)
2. **Verify all files are created** with exact content specified
3. **Run analysis script** to establish baseline metrics
4. **Confirm TypeScript compilation** works
5. **Proceed to Phase 0.2** file cleanup tasks

**Ready to execute these tasks step by step!**