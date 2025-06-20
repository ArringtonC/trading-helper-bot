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
echo "=== METRICS COLLECTION ==="
echo "Collecting detailed metrics..."

# Save file counts to metrics
cat > analysis/metrics/file-counts-$(date +%Y%m%d).json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "phase": "0-baseline",
  "counts": {
    "typescript": $(find src -name "*.ts" | wc -l | tr -d ' '),
    "tsx": $(find src -name "*.tsx" | wc -l | tr -d ' '),
    "javascript": $(find src -name "*.js" | wc -l | tr -d ' '),
    "jsx": $(find src -name "*.jsx" | wc -l | tr -d ' '),
    "services": $(find src/services -name "*.ts" 2>/dev/null | wc -l | tr -d ' '),
    "components": $(find src/components -name "*.tsx" 2>/dev/null | wc -l | tr -d ' '),
    "pages": $(find src/pages -name "*.tsx" 2>/dev/null | wc -l | tr -d ' '),
    "utils": $(find src/utils -name "*.ts" 2>/dev/null | wc -l | tr -d ' '),
    "types": $(find src/types -name "*.ts" 2>/dev/null | wc -l | tr -d ' '),
    "root_files": $(ls -1 | wc -l | tr -d ' '),
    "backup_files": $(find . -name "*backup*" 2>/dev/null | wc -l | tr -d ' ')
  }
}
EOF

echo "📊 Metrics saved to analysis/metrics/"

echo ""
echo "=== SUMMARY ==="
echo "📈 Analysis complete!"
echo "📁 Reports saved to: analysis/reports/"
echo "📊 Metrics saved to: analysis/metrics/"
echo "📄 Next steps: Review reports and begin Phase 0.2"
echo "======================================"