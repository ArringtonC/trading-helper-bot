import React, { useEffect, useRef } from 'react';
import { SP500PriceData } from '../../services/DatabaseService';

interface TerminalChartProps {
  priceData: SP500PriceData[];
  width?: number;
  height?: number;
}

const TerminalChart: React.FC<TerminalChartProps> = ({ 
  priceData, 
  width = 800, 
  height = 400 
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

    // Bloomberg Terminal Colors
    const bgColor = '#000000';
    const gridColor = '#333333';
    const priceColor = '#00ff41';
    const textColor = '#ffffff';
    const orangeColor = '#ff6b35';

    // Clear canvas
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    if (priceData.length < 2) return;

    // Calculate price range
    const prices = priceData.map(d => d.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1;

    // Chart dimensions
    const chartPadding = 40;
    const chartWidth = width - chartPadding * 2;
    const chartHeight = height - chartPadding * 2;

    // Draw grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = chartPadding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(chartPadding, y);
      ctx.lineTo(width - chartPadding, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 8; i++) {
      const x = chartPadding + (chartWidth / 8) * i;
      ctx.beginPath();
      ctx.moveTo(x, chartPadding);
      ctx.lineTo(x, height - chartPadding);
      ctx.stroke();
    }

    // Draw price line
    ctx.strokeStyle = priceColor;
    ctx.lineWidth = 2;
    ctx.beginPath();

    priceData.forEach((data, index) => {
      const x = chartPadding + (index / (priceData.length - 1)) * chartWidth;
      const y = height - chartPadding - ((data.close - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw price labels
    ctx.fillStyle = textColor;
    ctx.font = '10px Monaco, Consolas, monospace';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 5; i++) {
      const price = maxPrice + padding - ((priceRange + padding * 2) / 5) * i;
      const y = chartPadding + (chartHeight / 5) * i + 3;
      ctx.fillText(price.toFixed(2), chartPadding - 5, y);
    }

    // Draw current price indicator
    const currentPrice = priceData[priceData.length - 1].close;
    const currentY = height - chartPadding - ((currentPrice - minPrice + padding) / (priceRange + padding * 2)) * chartHeight;
    
    // Current price line
    ctx.strokeStyle = orangeColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(chartPadding, currentY);
    ctx.lineTo(width - chartPadding, currentY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current price label
    ctx.fillStyle = orangeColor;
    ctx.fillRect(width - chartPadding + 5, currentY - 8, 60, 16);
    ctx.fillStyle = bgColor;
    ctx.font = 'bold 10px Monaco, Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(currentPrice.toFixed(2), width - chartPadding + 8, currentY + 2);

    // Draw volume bars at bottom
    const volumeHeight = 40;
    const volumeY = height - chartPadding + 10;
    const volumes = priceData.map(d => d.volume || 0);
    const maxVolume = Math.max(...volumes) || 1;

    priceData.forEach((data, index) => {
      const x = chartPadding + (index / (priceData.length - 1)) * chartWidth;
      const volume = data.volume || 0;
      const barHeight = (volume / maxVolume) * volumeHeight;
      
      const prevClose = priceData[index - 1]?.close || data.close;
      ctx.fillStyle = data.close > prevClose ? priceColor : '#ff3366';
      ctx.fillRect(x - 1, volumeY + volumeHeight - barHeight, 2, barHeight);
    });

    // Add title
    ctx.fillStyle = orangeColor;
    ctx.font = 'bold 12px Monaco, Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('S&P 500 | LIVE CHART', chartPadding, 20);

    // Add timestamp
    ctx.fillStyle = textColor;
    ctx.font = '10px Monaco, Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(new Date().toLocaleTimeString(), width - chartPadding, 20);

  }, [priceData, width, height]);

  return (
    <div style={{ 
      background: '#000000', 
      border: '1px solid #333333',
      padding: '5px'
    }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          display: 'block',
          background: '#000000'
        }}
      />
    </div>
  );
};

export default TerminalChart; 