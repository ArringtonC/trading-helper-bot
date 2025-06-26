import { useState, useCallback } from 'react';

// Helper function to parse numbers from IBKR CSV fields
const parseNumber = (value: any): number => {
  if (value === undefined || value === null) return 0;
  return parseFloat(String(value).replace(/[$,]/g, '')) || 0;
};

interface RuleConfiguration {
  maxPositionSize: number;
  enableBackToBackLossDetection: boolean;
  enableCostBasisChecks: boolean;
  autoEvaluateOnUpload: boolean;
  evaluationMode: 'auto' | 'batch' | 'single';
}

export const useRuleEngine = (config?: RuleConfiguration) => {
  const [ruleLog, setRuleLog] = useState<string[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [batchResults, setBatchResults] = useState<any[] | null>(null);
  const [isBatchEvaluating] = useState(false);

  // Default configuration
  const defaultConfig: RuleConfiguration = {
    maxPositionSize: 10,
    enableBackToBackLossDetection: true,
    enableCostBasisChecks: true,
    autoEvaluateOnUpload: true,
    evaluationMode: 'auto'
  };

  const currentConfig = { ...defaultConfig, ...config };

  const addRuleLog = useCallback((msg: string) => {
    setRuleLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // Helper to get evaluation targets (prioritize individual trades over position summaries)
  const getEvaluationTargets = useCallback((parseResult: any) => {
    if (parseResult) {
      // Prioritize individual trade records for proper options trading analysis
      if (parseResult.trades && parseResult.trades.length > 0) 
        return { arr: parseResult.trades, label: 'Trades' };
      if (parseResult.optionTrades && parseResult.optionTrades.length > 0) 
        return { arr: parseResult.optionTrades, label: 'Option Trades' };
      if (parseResult.positions && parseResult.positions.length > 0) 
        return { arr: parseResult.positions, label: 'Positions' };
    }
    return { arr: [], label: 'Trades' };
  }, []);

  // COMPLETE SINGLE-PASS PROCESSING: Load entire CSV, sort by Date/Time, process sequentially
  const evaluateRules = useCallback(async (parseResult: any) => {
    const { arr: evalArr } = getEvaluationTargets(parseResult);
    if (!parseResult || !evalArr || evalArr.length === 0) return;
    
    if (isEvaluating || isBatchEvaluating || batchResults) return;

    setIsEvaluating(true);
    setRuleLog([]);
    setBatchResults(null);

    try {
      // STEP 1: Load entire CSV into memory and sort by Date/Time
      const allTrades = [...evalArr].sort((a, b) => {
        const dateA = new Date(a.dateTime || 0).getTime();
        const dateB = new Date(b.dateTime || 0).getTime();
        return dateA - dateB;
      });

      addRuleLog(`📊 Loaded ${allTrades.length} trades into memory, sorted chronologically`);

      // STEP 2: Process each row sequentially, carrying state forward
      const results: any[] = [];
      
      // State to carry forward across entire dataset (no resets)
      let prevRowType = "";
      let prevRowRealizedPL = 0;

      for (let i = 0; i < allTrades.length; i++) {
        const row = allTrades[i];
        
        // Parse numeric values using helper function
        const quantity = parseNumber(row.quantity);
        const proceeds = parseNumber(row.csvProceeds);
        const commissionFee = parseNumber(row.commissionFee);
        const price = parseNumber(row.tradePrice);
        const csvBasis = parseNumber(row.csvBasis);
        
        // STEP 3: Compute required fields for each row
        
        // 1. cashFlow = proceeds + commissionFee  
        const cashFlow = proceeds + commissionFee;
        
        // 2. realizedPL = 0 if Entry, else IBKR's realizedPL field DIRECTLY (no calculations!)
        const isEntry = row.code && row.code.startsWith('O');
        const realizedPL = row.code.startsWith('O') 
          ? 0 
          : parseNumber(row.realizedPL);
        
        // 3. type = "📥 Entry" if code starts with "O", else "📤 Exit"
        const type = isEntry ? "📥 Entry" : "📤 Exit";
        
        // 4. lossFlag = "⚠️ Back‑to‑Back Loss" only when both previous and current are exits with realizedPL < 0
        let lossFlag = "";
        if (currentConfig.enableBackToBackLossDetection && 
            !row.code.startsWith('O') && prevRowType === "📤 Exit" && prevRowRealizedPL < 0 && realizedPL < 0) {
          lossFlag = "⚠️ Back-to-Back Loss";
        }
        
        // 5. ruleStatus = "❌ Cost Basis: Reduce size" if abs(quantity) > maxPositionSize, else "✔️ OK"
        const ruleStatus = currentConfig.enableCostBasisChecks && Math.abs(quantity) > currentConfig.maxPositionSize
          ? "❌ Cost Basis: Reduce size" 
          : "✔️ OK";

        // Debug logging for first 5 trades to verify processing
        if (i < 5) {
          console.log(`🔍 Trade ${i}: ${row.symbol} @ ${row.dateTime}`);
          console.log(`  proceeds: ${proceeds}, commission: ${commissionFee}, cashFlow: ${cashFlow}`);
          console.log(`  code: ${row.code}, isEntry: ${isEntry}, type: ${type}`);
          console.log(`  IBKR realizedPL: ${row.realizedPL}, final realizedPL: ${realizedPL}`);
          console.log(`  prevType: ${prevRowType}, prevPL: ${prevRowRealizedPL}, lossFlag: ${lossFlag}`);
          console.log(`  quantity: ${quantity}, ruleStatus: ${ruleStatus}`);
        }

        // Store result with clean formatting
        results.push({
          index: i,
          symbol: row.symbol,
          dateTime: row.dateTime,
          quantity: quantity,
          price: price,
          cashFlow: cashFlow,
          realizedPL: realizedPL,
          costBasis: csvBasis,
          type: type,
          lossFlag: lossFlag,
          ruleStatus: ruleStatus,
          // Additional fields for compatibility
          consecutiveLosses: 0, // Can be computed if needed
          consecutiveLossFlag: lossFlag,
          ruleTriggered: ruleStatus.includes("❌"),
          actionTaken: ruleStatus.includes("❌") ? "reducePositionSize" : null,
          localLog: ruleStatus.includes("❌") ? [`Rule triggered: Position size exceeded`] : [],
          isEntry: isEntry,
          isExit: !isEntry,
          amountUsed: cashFlow
        });

        // STEP 4: Update state for next iteration (carry forward across entire dataset)
        prevRowType = type;
        prevRowRealizedPL = realizedPL;
      }

      setBatchResults(results);
      addRuleLog(`✅ Single-pass processing completed: ${results.length} trades processed`);
      addRuleLog(`📋 Rules triggered: ${results.filter(r => r.ruleTriggered).length} trades`);
      addRuleLog(`⚠️ Back-to-back losses: ${results.filter(r => r.lossFlag).length} trades`);
      
    } catch (err) {
      addRuleLog('❌ Error during single-pass evaluation: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsEvaluating(false);
    }
      }, [isEvaluating, isBatchEvaluating, batchResults, getEvaluationTargets, addRuleLog, currentConfig.enableBackToBackLossDetection, currentConfig.enableCostBasisChecks, currentConfig.maxPositionSize]);

  const clearResults = useCallback(() => {
    setBatchResults(null);
    setRuleLog([]);
  }, []);

  return {
    ruleLog,
    isEvaluating,
    batchResults,
    isBatchEvaluating,
    evaluateRules,
    clearResults,
    addRuleLog,
    setBatchResults: (results: any[] | null) => setBatchResults(results)
  };
}; 
 
 
 