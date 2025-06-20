#!/bin/bash

# Phase 0 Task Verification Script
# Automatically checks if Cursor/Claude has completed tasks correctly

echo "======================================"
echo "PHASE 0 TASK VERIFICATION SCRIPT"
echo "======================================"
echo "Timestamp: $(date)"
echo ""

# Initialize counters
TOTAL_TASKS=0
COMPLETED_TASKS=0
FAILED_TASKS=0

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check task completion
check_task() {
    local task_name="$1"
    local check_command="$2"
    local expected_result="$3"
    
    TOTAL_TASKS=$((TOTAL_TASKS + 1))
    echo -n "  ${task_name}: "
    
    if eval "$check_command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ COMPLETE${NC}"
        COMPLETED_TASKS=$((COMPLETED_TASKS + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        FAILED_TASKS=$((FAILED_TASKS + 1))
        echo "    Expected: $expected_result"
        return 1
    fi
}

# Function to check file exists and has content
check_file_exists() {
    local task_name="$1"
    local file_path="$2"
    local min_size="$3"
    
    TOTAL_TASKS=$((TOTAL_TASKS + 1))
    echo -n "  ${task_name}: "
    
    if [ -f "$file_path" ]; then
        local file_size=$(wc -c < "$file_path" 2>/dev/null || echo 0)
        if [ "$file_size" -gt "${min_size:-0}" ]; then
            echo -e "${GREEN}✅ EXISTS (${file_size} bytes)${NC}"
            COMPLETED_TASKS=$((COMPLETED_TASKS + 1))
            return 0
        else
            echo -e "${YELLOW}⚠️  EXISTS BUT TOO SMALL (${file_size} bytes)${NC}"
            FAILED_TASKS=$((FAILED_TASKS + 1))
            return 1
        fi
    else
        echo -e "${RED}❌ MISSING${NC}"
        FAILED_TASKS=$((FAILED_TASKS + 1))
        return 1
    fi
}

# Function to check directory exists
check_directory() {
    local task_name="$1"
    local dir_path="$2"
    
    TOTAL_TASKS=$((TOTAL_TASKS + 1))
    echo -n "  ${task_name}: "
    
    if [ -d "$dir_path" ]; then
        echo -e "${GREEN}✅ EXISTS${NC}"
        COMPLETED_TASKS=$((COMPLETED_TASKS + 1))
        return 0
    else
        echo -e "${RED}❌ MISSING${NC}"
        FAILED_TASKS=$((FAILED_TASKS + 1))
        return 1
    fi
}

echo "🔍 PHASE 0.1 VERIFICATION - SETUP TASKS"
echo "======================================"

echo ""
echo "📋 Task 1: Environment Setup"
check_task "1.1 Backup branch exists" "git branch | grep -q 'phase-0-decluttering-backup'" "Branch should exist"
check_task "1.2 Backup branch on remote" "git branch -r | grep -q 'origin/phase-0-decluttering-backup'" "Remote branch should exist"
check_task "1.3 Working branch active" "git branch | grep -q '* phase-0-file-organization'" "Should be on working branch"

echo ""
echo "📁 Task 2: Analysis Infrastructure"
check_directory "2.1a Analysis reports dir" "analysis/reports"
check_directory "2.1b Analysis metrics dir" "analysis/metrics"
check_directory "2.1c Scripts migration dir" "scripts/migration"
check_directory "2.1d Scripts automation dir" "scripts/automation"
check_file_exists "2.2 Analysis tracking file" "analysis/phase-0-progress.md" 500
check_file_exists "2.3 Analysis script" "scripts/automation/analyze-codebase.sh" 2000
check_task "2.3b Script is executable" "[ -x scripts/automation/analyze-codebase.sh ]" "Script should be executable"

echo ""
echo "⚙️  Task 3: Development Configuration"
check_file_exists "3.1 VS Code settings" ".vscode/settings.json" 500
check_file_exists "3.2 Extensions config" ".vscode/extensions.json" 200
check_file_exists "3.3 Import updater script" "scripts/automation/update-imports.js" 3000
check_task "3.3b Import script executable" "[ -x scripts/automation/update-imports.js ]" "Script should be executable"

echo ""
echo "🧪 ADDITIONAL VERIFICATION CHECKS"
echo "======================================"

# Check for proper file content (sampling)
echo ""
echo "📄 Content Verification:"

if [ -f ".vscode/settings.json" ]; then
    TOTAL_TASKS=$((TOTAL_TASKS + 1))
    echo -n "  VS Code settings has TypeScript config: "
    if grep -q "typescript.updateImportsOnFileMove.enabled" .vscode/settings.json; then
        echo -e "${GREEN}✅ CORRECT${NC}"
        COMPLETED_TASKS=$((COMPLETED_TASKS + 1))
    else
        echo -e "${RED}❌ MISSING KEY CONFIG${NC}"
        FAILED_TASKS=$((FAILED_TASKS + 1))
    fi
fi

if [ -f "scripts/automation/analyze-codebase.sh" ]; then
    TOTAL_TASKS=$((TOTAL_TASKS + 1))
    echo -n "  Analysis script has proper shebang: "
    if head -1 scripts/automation/analyze-codebase.sh | grep -q "#!/bin/bash"; then
        echo -e "${GREEN}✅ CORRECT${NC}"
        COMPLETED_TASKS=$((COMPLETED_TASKS + 1))
    else
        echo -e "${RED}❌ WRONG SHEBANG${NC}"
        FAILED_TASKS=$((FAILED_TASKS + 1))
    fi
fi

echo ""
echo "🔧 Tool Installation Check:"
TOTAL_TASKS=$((TOTAL_TASKS + 1))
echo -n "  knip globally installed: "
if command -v knip >/dev/null 2>&1; then
    echo -e "${GREEN}✅ INSTALLED${NC}"
    COMPLETED_TASKS=$((COMPLETED_TASKS + 1))
else
    echo -e "${RED}❌ NOT INSTALLED${NC}"
    FAILED_TASKS=$((FAILED_TASKS + 1))
    echo "    Run: npm install -g knip"
fi

TOTAL_TASKS=$((TOTAL_TASKS + 1))
echo -n "  ts-unused-exports installed: "
if command -v ts-unused-exports >/dev/null 2>&1; then
    echo -e "${GREEN}✅ INSTALLED${NC}"
    COMPLETED_TASKS=$((COMPLETED_TASKS + 1))
else
    echo -e "${RED}❌ NOT INSTALLED${NC}"
    FAILED_TASKS=$((FAILED_TASKS + 1))
    echo "    Run: npm install -g ts-unused-exports"
fi

echo ""
echo "📊 FINAL RESULTS"
echo "======================================"

# Calculate completion percentage
COMPLETION_PERCENT=$((COMPLETED_TASKS * 100 / TOTAL_TASKS))

echo "Total Tasks Checked: $TOTAL_TASKS"
echo -e "Completed Tasks: ${GREEN}$COMPLETED_TASKS${NC}"
echo -e "Failed Tasks: ${RED}$FAILED_TASKS${NC}"
echo -e "Completion Rate: ${BLUE}$COMPLETION_PERCENT%${NC}"

echo ""
if [ $FAILED_TASKS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL PHASE 0.1 TASKS COMPLETE!${NC}"
    echo -e "${GREEN}✅ Ready to proceed to Phase 0.2${NC}"
    exit 0
elif [ $COMPLETION_PERCENT -ge 80 ]; then
    echo -e "${YELLOW}⚠️  MOSTLY COMPLETE - Minor issues to fix${NC}"
    exit 1
else
    echo -e "${RED}❌ SIGNIFICANT ISSUES - Please complete remaining tasks${NC}"
    exit 2
fi