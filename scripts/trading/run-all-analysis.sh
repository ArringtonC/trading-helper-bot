#!/bin/bash

# Run All Trading Analysis Scripts for RPG Challenge
# This script executes all trading analysis tools for comprehensive market intelligence

echo "🎮 Starting Trading RPG Analysis Suite..."
echo "═══════════════════════════════════════════════════════════"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

echo -e "${BLUE}📁 Project Root: $PROJECT_ROOT${NC}"
echo -e "${BLUE}📁 Scripts Directory: $SCRIPT_DIR${NC}"
echo ""

# Function to run a script with error handling
run_analysis() {
    local script_name="$1"
    local description="$2"
    local symbol="${3:-SPY}"
    
    echo -e "${YELLOW}🚀 Running: $description${NC}"
    echo "───────────────────────────────────────"
    
    cd "$PROJECT_ROOT"
    
    if [ -f "$SCRIPT_DIR/$script_name" ]; then
        if npx ts-node "$SCRIPT_DIR/$script_name" "$symbol"; then
            echo -e "${GREEN}✅ $description completed successfully${NC}"
        else
            echo -e "${RED}❌ $description failed${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Script not found: $script_name${NC}"
        return 1
    fi
    
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${PURPLE}🔍 Checking prerequisites...${NC}"
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found. Please install Node.js${NC}"
        exit 1
    fi
    
    # Check for TypeScript
    if ! command -v npx &> /dev/null; then
        echo -e "${RED}❌ NPX not found. Please install Node.js and npm${NC}"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        echo -e "${RED}❌ Not in project root. Please run from trading-helper-bot directory${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
    echo ""
}

# Function to create data directories
setup_directories() {
    echo -e "${PURPLE}📁 Setting up data directories...${NC}"
    
    local data_dir="$PROJECT_ROOT/public/data"
    
    mkdir -p "$data_dir/market-analysis"
    mkdir -p "$data_dir/monday-analysis" 
    mkdir -p "$data_dir/strategy-optimization"
    
    echo -e "${GREEN}✅ Data directories created${NC}"
    echo ""
}

# Function to display summary
display_summary() {
    echo -e "${PURPLE}📊 ANALYSIS SUMMARY${NC}"
    echo "═══════════════════════════════════════════════════════════"
    
    local data_dir="$PROJECT_ROOT/public/data"
    
    if [ -f "$data_dir/market-analysis/latest-analysis.json" ]; then
        echo -e "${GREEN}✅ Weekly Market Analysis: Available${NC}"
        echo "   📄 Location: public/data/market-analysis/latest-analysis.json"
    else
        echo -e "${RED}❌ Weekly Market Analysis: Failed${NC}"
    fi
    
    if [ -f "$data_dir/monday-analysis/latest-monday-analysis.json" ]; then
        echo -e "${GREEN}✅ Monday Range Analysis: Available${NC}"
        echo "   📄 Location: public/data/monday-analysis/latest-monday-analysis.json"
    else
        echo -e "${RED}❌ Monday Range Analysis: Failed${NC}"
    fi
    
    if [ -f "$data_dir/strategy-optimization/latest-strategy-recommendation.json" ]; then
        echo -e "${GREEN}✅ Strategy Optimization: Available${NC}"
        echo "   📄 Location: public/data/strategy-optimization/latest-strategy-recommendation.json"
    else
        echo -e "${RED}❌ Strategy Optimization: Failed${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}🎮 Ready for RPG Challenge Planning Session!${NC}"
    echo -e "${BLUE}🌐 Navigate to: http://localhost:3000/challenge/planning${NC}"
    echo ""
}

# Main execution
main() {
    local symbol="${1:-SPY}"
    
    echo -e "${BLUE}🎯 Target Symbol: $symbol${NC}"
    echo ""
    
    # Run checks
    check_prerequisites
    setup_directories
    
    # Run analysis scripts
    echo -e "${PURPLE}🎮 RUNNING TRADING RPG ANALYSIS SUITE${NC}"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    
    # 1. Weekly Market Analysis
    run_analysis "weekly-market-analysis.ts" "Weekly Market Intelligence Gathering" "$symbol"
    
    # 2. Monday Range Analysis
    run_analysis "monday-range-calculator.ts" "Monday Range Battle Setup Analysis" "$symbol"
    
    # 3. Strategy Optimization
    run_analysis "strategy-optimizer.ts" "Strategy Class Optimization" "$symbol"
    
    # Display summary
    display_summary
    
    echo -e "${GREEN}🏆 All analysis scripts completed successfully!${NC}"
    echo -e "${YELLOW}💡 Tip: Run this script every Sunday evening for optimal RPG challenge preparation${NC}"
}

# Help function
show_help() {
    echo "Trading RPG Analysis Suite"
    echo ""
    echo "Usage: $0 [SYMBOL]"
    echo ""
    echo "Arguments:"
    echo "  SYMBOL    Stock symbol to analyze (default: SPY)"
    echo ""
    echo "Examples:"
    echo "  $0        # Analyze SPY"
    echo "  $0 QQQ    # Analyze QQQ"
    echo "  $0 AAPL   # Analyze AAPL"
    echo ""
    echo "This script runs all trading analysis tools needed for the RPG challenge:"
    echo "  • Weekly Market Analysis"
    echo "  • Monday Range Calculation"
    echo "  • Strategy Class Optimization"
    echo ""
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac