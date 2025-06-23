import React, { useState, useEffect } from 'react';
import { SP500PriceData, MarketNewsData } from '../../services/DatabaseService';
import { TradingSignal, CorrectionAnalysis, VolatilityIndex, RiskManagement } from '../../services/TradingSignalService';
import { EnhancedNewsEvent } from '../../services/AINewsAnalysisService';
import TerminalChart from './TerminalChart';

// Bloomberg Terminal Styles
const terminalStyles = `
  .bloomberg-terminal {
    background: #000000;
    color: #ffffff;
    font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.2;
    height: 100vh;
    overflow: hidden;
  }

  .terminal-ticker {
    background: #1a1a1a;
    color: #ff6b35;
    padding: 8px 16px;
    border-bottom: 1px solid #333333;
    white-space: nowrap;
    overflow: hidden;
    font-weight: bold;
    font-size: 11px;
    letter-spacing: 0.5px;
  }

  .terminal-grid {
    display: grid;
    grid-template-columns: 1fr 400px;
    height: calc(100vh - 40px);
    gap: 2px;
    background: #333333;
  }

  .left-panel {
    background: #000000;
    display: flex;
    flex-direction: column;
  }

  .right-panel {
    background: #0a0a0a;
    overflow-y: auto;
    border-left: 1px solid #333333;
  }

  .terminal-header {
    background: #1a1a1a;
    color: #ff6b35;
    padding: 4px 8px;
    border-bottom: 1px solid #333333;
    font-weight: bold;
    font-size: 10px;
    letter-spacing: 1px;
  }

  .signal-terminal {
    background: #0a0a0a;
    border: 1px solid #333333;
    margin-bottom: 2px;
  }

  .signal-data {
    display: flex;
    justify-content: space-between;
    padding: 2px 8px;
    border-bottom: 1px solid #222222;
  }

  .signal-label {
    color: #cccccc;
    font-size: 10px;
    width: 60px;
  }

  .signal-value {
    color: #ffffff;
    font-weight: bold;
  }

  .signal-value.buy { color: #00ff41; }
  .signal-value.sell { color: #ff3366; }
  .signal-value.hold { color: #ffaa00; }

  .text-green { color: #00ff41; }
  .text-red { color: #ff3366; }
  .text-orange { color: #ff6b35; }

  .signal-reasoning {
    padding: 4px 8px;
    font-size: 9px;
    color: #999999;
    background: #111111;
    border-top: 1px solid #333333;
  }

  .terminal-chart {
    background: #000000;
    border: 1px solid #333333;
    flex: 1;
    margin: 2px;
    position: relative;
  }

  .data-panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    height: 200px;
  }

  .tech-panel, .risk-panel, .news-panel {
    background: #0a0a0a;
    border: 1px solid #333333;
  }

  .panel-header {
    background: #1a1a1a;
    color: #ff6b35;
    padding: 4px 8px;
    border-bottom: 1px solid #333333;
    font-weight: bold;
    font-size: 10px;
    letter-spacing: 1px;
  }

  .data-grid {
    padding: 4px;
  }

  .data-row {
    display: flex;
    justify-content: space-between;
    padding: 1px 4px;
    font-size: 10px;
  }

  .data-row:nth-child(even) {
    background: #111111;
  }

  .news-item {
    border-bottom: 1px solid #222222;
    padding: 4px 8px;
  }

  .news-timestamp {
    color: #666666;
    font-size: 9px;
  }

  .news-headline {
    color: #ffffff;
    font-size: 10px;
    margin: 2px 0;
  }

  .news-impact {
    color: #cccccc;
    font-size: 9px;
  }

  .risk-item {
    display: flex;
    justify-content: space-between;
    padding: 2px 8px;
    font-size: 10px;
    border-bottom: 1px solid #222222;
  }

  .terminal-input {
    background: #000000;
    border: 1px solid #333333;
    color: #00ff41;
    font-family: inherit;
    font-size: 11px;
    padding: 4px 8px;
    margin: 2px;
  }

  .terminal-input:focus {
    outline: none;
    border-color: #ff6b35;
  }

  .blink {
    animation: blink 1s infinite;
  }

  @keyframes blink {
    50% { opacity: 0.5; }
  }

  .volume-bar {
    height: 3px;
    background: #333333;
    margin: 1px 0;
  }

  .volume-bar.high { background: #ff6b35; }
  .volume-bar.medium { background: #ffaa00; }
  .volume-bar.low { background: #666666; }
`;

export interface BloombergTerminalProps {
  priceData: SP500PriceData[];
  newsData: MarketNewsData[];
  enhancedNewsData: EnhancedNewsEvent[];
  tradingSignal: TradingSignal | null;
  correctionAnalysis: CorrectionAnalysis | null;
  volatilityIndex: VolatilityIndex | null;
  riskManagement: RiskManagement | null;
  onExit: () => void;
}

const BloombergTerminal: React.FC<BloombergTerminalProps> = ({
  priceData,
  newsData,
  enhancedNewsData,
  tradingSignal,
  correctionAnalysis,
  volatilityIndex,
  riskManagement,
  onExit
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentPrice = priceData[priceData.length - 1]?.close || 0;
  const previousPrice = priceData[priceData.length - 2]?.close || 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = (priceChange / previousPrice) * 100;

  const vixValue = volatilityIndex?.vixEquivalent || 16.9;
  const volume = priceData[priceData.length - 1]?.volume || 0;

  return (
    <>
      <style>{terminalStyles}</style>
      <div className="bloomberg-terminal">
        {/* Terminal Ticker */}
        <div className="terminal-ticker">
          <span className="blink">●</span> LIVE | 
          SPX {currentPrice.toFixed(2)} {priceChange >= 0 ? '▲' : '▼'}{priceChangePercent.toFixed(2)}% | 
          VIX {vixValue.toFixed(1)} | 
          VOL {(volume / 1000000).toFixed(1)}M | 
          TIME {currentTime.toLocaleTimeString()} | 
          <span style={{ color: '#ff3366', cursor: 'pointer' }} onClick={onExit}>
            [EXIT TERMINAL]
          </span>
        </div>

        <div className="terminal-grid">
          {/* Left Panel - Chart and Data */}
          <div className="left-panel">
            {/* Terminal Chart Area */}
            <div className="terminal-chart">
              <div className="terminal-header">
                S&P 500 FUTURES | SPX | REAL-TIME CHART
              </div>
              <TerminalChart 
                priceData={priceData} 
                width={800} 
                height={300}
              />
            </div>

            {/* Bottom Data Panels */}
            <div className="data-panels">
              {/* Technical Analysis Panel */}
              <div className="tech-panel">
                <div className="panel-header">TECHNICAL ANALYSIS</div>
                <div className="data-grid">
                  <div className="data-row">
                    <span>RSI(14):</span><span className="text-orange">67.3</span>
                  </div>
                  <div className="data-row">
                    <span>MACD:</span><span className="text-red">-12.4</span>
                  </div>
                  <div className="data-row">
                    <span>BB(20):</span><span>5,950/6,100</span>
                  </div>
                  <div className="data-row">
                    <span>VOL(20):</span><span className="text-orange">{vixValue.toFixed(1)}%</span>
                  </div>
                  <div className="data-row">
                    <span>ATR(14):</span><span>47.8</span>
                  </div>
                  <div className="data-row">
                    <span>SUPPORT:</span><span className="text-green">5,862</span>
                  </div>
                  <div className="data-row">
                    <span>RESIST:</span><span className="text-red">6,144</span>
                  </div>
                </div>
              </div>

              {/* Volume Analysis Panel */}
              <div className="tech-panel">
                <div className="panel-header">VOLUME PROFILE</div>
                <div className="data-grid">
                  <div className="data-row">
                    <span>TODAY VOL:</span><span className="text-orange">{(volume / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="data-row">
                    <span>AVG VOL:</span><span>3.2M</span>
                  </div>
                  <div className="data-row">
                    <span>REL VOL:</span><span className="text-green">1.4x</span>
                  </div>
                  <div className="data-row">
                    <span>VWAP:</span><span>5,987.34</span>
                  </div>
                  <div className="data-row">
                    <span>POC:</span><span>5,982.15</span>
                  </div>
                  <div className="data-row">
                    <span>VAH:</span><span>6,012.88</span>
                  </div>
                  <div className="data-row">
                    <span>VAL:</span><span>5,951.67</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Signals, News, Risk */}
          <div className="right-panel">
            {/* Trading Signal Terminal */}
            {tradingSignal && (
              <div className="signal-terminal">
                <div className="terminal-header">
                  TRADING SIGNAL | CONFIDENCE: {tradingSignal.confidence}%
                </div>
                <div className="signal-data">
                  <span className="signal-label">ACTION:</span>
                  <span className={`signal-value ${tradingSignal.signal.toLowerCase()}`}>
                    {tradingSignal.signal}
                  </span>
                </div>
                <div className="signal-data">
                  <span className="signal-label">ENTRY:</span>
                  <span className="signal-value">{currentPrice.toFixed(2)}</span>
                </div>
                <div className="signal-data">
                  <span className="signal-label">TARGET:</span>
                  <span className="signal-value text-green">6,144.15</span>
                </div>
                <div className="signal-data">
                  <span className="signal-label">STOP:</span>
                  <span className="signal-value text-red">5,800.00</span>
                </div>
                <div className="signal-data">
                  <span className="signal-label">R:R:</span>
                  <span className="signal-value text-orange">1:2.1</span>
                </div>
                <div className="signal-reasoning">
                  {tradingSignal.reasoning?.toUpperCase() || 'TECHNICAL ANALYSIS + VOLUME CONFIRMATION'}
                </div>
              </div>
            )}

            {/* Risk Metrics Panel */}
            <div className="risk-panel">
              <div className="panel-header">RISK MANAGEMENT</div>
              <div className="risk-item">
                <span>POSITION SIZE:</span>
                <span className="text-green">167 SHARES</span>
              </div>
              <div className="risk-item">
                <span>CAPITAL RISK:</span>
                <span className="text-orange">$30,500 (2.0%)</span>
              </div>
              <div className="risk-item">
                <span>STOP DISTANCE:</span>
                <span className="text-red">182.77 (-3.0%)</span>
              </div>
              <div className="risk-item">
                <span>MAX LOSS:</span>
                <span className="text-red">$30,463</span>
              </div>
              <div className="risk-item">
                <span>TARGET GAIN:</span>
                <span className="text-green">$64,098</span>
              </div>
              <div className="risk-item">
                <span>PORTFOLIO %:</span>
                <span className="text-orange">12.8%</span>
              </div>
            </div>

            {/* Terminal News Feed */}
            <div className="news-panel">
              <div className="panel-header">MARKET NEWS | REAL-TIME</div>
              {(enhancedNewsData.length > 0 ? enhancedNewsData : newsData).slice(0, 8).map((news, index) => (
                <div key={news.id || index} className="news-item">
                  <div className="news-timestamp">
                    {new Date(news.date).toLocaleTimeString()} | {(news as any).source || 'BLOOMBERG'}
                  </div>
                  <div className="news-headline">
                    {(news as any).aiAnalysis?.impactLevel === 'HIGH' && '🔴'} 
                    {news.title.toUpperCase().substring(0, 60)}...
                  </div>
                  <div className="news-impact">
                    IMPACT: {(news as any).relevance_score || 7}/10 | 
                    EST MOVE: ±{((news as any).relevance_score || 7) * 0.3}%
                  </div>
                </div>
              ))}
            </div>

            {/* Terminal Input */}
            <div style={{ margin: '8px' }}>
              <input 
                type="text" 
                className="terminal-input" 
                placeholder="COMMAND: TYPE 'HELP' FOR OPTIONS..."
                style={{ width: 'calc(100% - 16px)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BloombergTerminal; 