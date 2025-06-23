import React, { useEffect, useRef } from 'react';
import { SP500PriceData } from '../../services/DatabaseService';

interface ProfessionalChartProps {
  priceData: SP500PriceData[];
  width?: number;
  height?: number;
  theme?: 'professional' | 'bloomberg';
}

const ProfessionalChart: React.FC<ProfessionalChartProps> = ({ 
  priceData, 
  width = 800, 
  height = 400,
  theme = 'professional'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !priceData.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Professional color scheme
    const colors = theme === 'bloomberg' ? {
      bgColor: '#000000',
      gridColor: '#333333',
      priceColor: '#00ff41',
      textColor: '#ffffff',
      accentColor: '#ff6b35',
      bearColor: '#ff3366'
    } : {
      bgColor: '#fafbfc',
      gridColor: '#e1e5e9',
      priceColor: '#1890ff',
      textColor: '#2c3e50',
      accentColor: '#722ed1',
      bearColor: '#ff4d4f'
    };

    // Clear canvas
    ctx.fillStyle = colors.bgColor;
    ctx.fillRect(0, 0, width, height);

    if (priceData.length < 2) return;

    // Calculate price range
    const prices = priceData.map(d => d.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1;

    // Chart dimensions
    const chartPadding = 60;
    const chartWidth = width - chartPadding * 2;
    const chartHeight = height - chartPadding * 2 - 60; // Extra space for volume

    // Draw grid
    ctx.strokeStyle = colors.gridColor;
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 8; i++) {
      const y = chartPadding + (chartHeight / 8) * i;
      ctx.beginPath();
      ctx.moveTo(chartPadding, y);
      ctx.lineTo(width - chartPadding, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = chartPadding + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, chartPadding);
      ctx.lineTo(x, chartPadding + chartHeight);
      ctx.stroke();
    }

    // Draw candlestick chart for professional look
    const candleWidth = Math.max(2, chartWidth / priceData.length * 0.8);
    
    priceData.forEach((data, index) => {
      const x = chartPadding + (index / (priceData.length - 1)) * chartWidth;
      
      // Calculate candlestick positions
      const openY = chartPadding + chartHeight - ((data.open - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;
      const closeY = chartPadding + chartHeight - ((data.close - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;
      const highY = chartPadding + chartHeight - ((data.high - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;
      const lowY = chartPadding + chartHeight - ((data.low - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;
      
      const isGreen = data.close >= data.open;
      ctx.strokeStyle = isGreen ? colors.priceColor : colors.bearColor;
      ctx.fillStyle = isGreen ? colors.priceColor : colors.bearColor;
      
      // Draw wick
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Draw body
      const bodyTop = Math.min(openY, closeY);
      const bodyBottom = Math.max(openY, closeY);
      const bodyHeight = bodyBottom - bodyTop;
      
      if (isGreen) {
        ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
      } else {
        ctx.strokeStyle = colors.bearColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
      }
    });

    // Draw price labels
    ctx.fillStyle = colors.textColor;
    ctx.font = theme === 'bloomberg' ? '10px Monaco, Consolas, monospace' : '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 8; i++) {
      const price = maxPrice + padding - ((priceRange + padding * 2) / 8) * i;
      const y = chartPadding + (chartHeight / 8) * i + 4;
      ctx.fillText(price.toFixed(2), chartPadding - 10, y);
    }

    // Draw date labels
    ctx.textAlign = 'center';
    const dateStep = Math.max(1, Math.floor(priceData.length / 8));
    for (let i = 0; i < priceData.length; i += dateStep) {
      const x = chartPadding + (i / (priceData.length - 1)) * chartWidth;
      const date = new Date(priceData[i].date);
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      ctx.fillText(label, x, height - 20);
    }

    // Draw current price indicator
    const currentPrice = priceData[priceData.length - 1].close;
    const currentY = chartPadding + chartHeight - ((currentPrice - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;
    
    // Current price line
    ctx.strokeStyle = colors.accentColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(chartPadding, currentY);
    ctx.lineTo(width - chartPadding, currentY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current price label
    ctx.fillStyle = colors.accentColor;
    ctx.fillRect(width - chartPadding + 5, currentY - 12, 80, 24);
    ctx.fillStyle = theme === 'bloomberg' ? '#000000' : '#ffffff';
    ctx.font = `bold ${theme === 'bloomberg' ? '10px Monaco' : '11px -apple-system'}`;
    ctx.textAlign = 'left';
    ctx.fillText(currentPrice.toFixed(2), width - chartPadding + 10, currentY + 4);

    // Draw volume bars at bottom
    const volumeHeight = 50;
    const volumeY = chartPadding + chartHeight + 10;
    const volumes = priceData.map(d => d.volume || 0);
    const maxVolume = Math.max(...volumes) || 1;

    priceData.forEach((data, index) => {
      const x = chartPadding + (index / (priceData.length - 1)) * chartWidth;
      const volume = data.volume || 0;
      const barHeight = (volume / maxVolume) * volumeHeight;
      
      const prevClose = priceData[index - 1]?.close || data.close;
      ctx.fillStyle = data.close > prevClose ? colors.priceColor : colors.bearColor;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(x - candleWidth/2, volumeY + volumeHeight - barHeight, candleWidth, barHeight);
      ctx.globalAlpha = 1;
    });

    // Add professional title and stats
    ctx.fillStyle = colors.textColor;
    ctx.font = `bold ${theme === 'bloomberg' ? '14px Monaco' : '16px -apple-system'}`;
    ctx.textAlign = 'left';
    ctx.fillText('S&P 500 Index', chartPadding, 25);

    // Add real-time stats
    const currentData = priceData[priceData.length - 1];
    const prevData = priceData[priceData.length - 2];
    const change = currentData.close - (prevData?.close || currentData.close);
    const changePercent = (change / (prevData?.close || currentData.close)) * 100;

    ctx.font = `${theme === 'bloomberg' ? '12px Monaco' : '14px -apple-system'}`;
    ctx.fillStyle = change >= 0 ? colors.priceColor : colors.bearColor;
    ctx.textAlign = 'right';
    ctx.fillText(
      `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)`,
      width - chartPadding,
      25
    );

    // Add timestamp
    ctx.fillStyle = colors.textColor;
    ctx.font = `${theme === 'bloomberg' ? '10px Monaco' : '12px -apple-system'}`;
    ctx.fillText(new Date().toLocaleTimeString(), width - chartPadding, 45);

  }, [priceData, width, height, theme]);

  const containerStyle = theme === 'bloomberg' ? {
    background: '#000000',
    border: '1px solid #333333',
    borderRadius: '4px',
    padding: '8px'
  } : {
    background: '#ffffff',
    border: '1px solid #e1e5e9',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  };

  return (
    <div style={containerStyle}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          display: 'block',
          background: 'transparent',
          borderRadius: theme === 'bloomberg' ? '0px' : '4px'
        }}
      />
    </div>
  );
};

export default ProfessionalChart; 