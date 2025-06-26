/**
 * Utility functions for formatting numbers, currencies, percentages, and other data types
 * Used throughout the trading application for consistent data presentation
 */

// Currency formatting
export const formatCurrency = (
  value: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  if (isNaN(value)) return '-';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Percentage formatting
export const formatPercentage = (
  value: number,
  decimals: number = 2,
  locale: string = 'en-US'
): string => {
  if (isNaN(value)) return '-';
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
};

// Number formatting with abbreviation (K, M, B)
export const formatNumber = (
  value: number,
  decimals: number = 2,
  locale: string = 'en-US'
): string => {
  if (isNaN(value)) return '-';
  
  const absValue = Math.abs(value);
  let formattedValue: string;
  
  if (absValue >= 1e9) {
    formattedValue = (value / 1e9).toFixed(decimals) + 'B';
  } else if (absValue >= 1e6) {
    formattedValue = (value / 1e6).toFixed(decimals) + 'M';
  } else if (absValue >= 1e3) {
    formattedValue = (value / 1e3).toFixed(decimals) + 'K';
  } else {
    formattedValue = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    }).format(value);
  }
  
  return formattedValue;
};

// Volume formatting
export const formatVolume = (volume: number): string => {
  return formatNumber(volume, 1);
};

// Price change formatting with sign
export const formatPriceChange = (
  value: number,
  currency: string = 'USD',
  showSign: boolean = true
): string => {
  if (isNaN(value)) return '-';
  
  const sign = showSign && value > 0 ? '+' : '';
  return sign + formatCurrency(value, currency);
};

// Percentage change formatting with sign and color indication
export const formatPercentageChange = (
  value: number,
  decimals: number = 2,
  showSign: boolean = true
): string => {
  if (isNaN(value)) return '-';
  
  const sign = showSign && value > 0 ? '+' : '';
  return sign + formatPercentage(value, decimals);
};

// Date formatting
export const formatDate = (
  date: Date | string | number,
  format: 'short' | 'medium' | 'long' | 'time' = 'medium',
  locale: string = 'en-US'
): string => {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) return '-';
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric'
      });
    case 'medium':
      return dateObj.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    case 'long':
      return dateObj.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'time':
      return dateObj.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit'
      });
    default:
      return dateObj.toLocaleDateString(locale);
  }
};

// Time ago formatting (e.g., "2 hours ago")
export const formatTimeAgo = (date: Date | string | number): string => {
  const now = new Date();
  const past = new Date(date);
  
  if (isNaN(past.getTime())) return '-';
  
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
};

// Market cap formatting
export const formatMarketCap = (value: number): string => {
  return formatNumber(value, 1);
};

// P/E ratio formatting
export const formatPERatio = (value: number): string => {
  if (isNaN(value) || value <= 0) return 'N/A';
  return value.toFixed(2);
};

// Option strike price formatting
export const formatStrike = (value: number): string => {
  if (isNaN(value)) return '-';
  return value.toFixed(2);
};

// Option expiration date formatting
export const formatExpiration = (date: Date | string): string => {
  const expDate = new Date(date);
  if (isNaN(expDate.getTime())) return '-';
  
  return expDate.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: '2-digit'
  });
};

// Volatility formatting
export const formatVolatility = (value: number): string => {
  if (isNaN(value)) return '-';
  return formatPercentage(value, 1);
};

// Greek formatting (Delta, Gamma, Theta, Vega)
export const formatGreek = (value: number, decimals: number = 3): string => {
  if (isNaN(value)) return '-';
  return value.toFixed(decimals);
};

// Bid/Ask spread formatting
export const formatSpread = (bid: number, ask: number): string => {
  if (isNaN(bid) || isNaN(ask)) return '-';
  const spread = ask - bid;
  return formatCurrency(spread);
};

// Risk/Reward ratio formatting
export const formatRiskReward = (risk: number, reward: number): string => {
  if (isNaN(risk) || isNaN(reward) || risk <= 0) return '-';
  const ratio = reward / risk;
  return `1:${ratio.toFixed(2)}`;
};

// Position size formatting
export const formatPositionSize = (size: number, symbol?: string): string => {
  if (isNaN(size)) return '-';
  
  const formattedSize = Math.abs(size).toLocaleString();
  const direction = size >= 0 ? '' : '-';
  
  return symbol ? `${direction}${formattedSize} ${symbol}` : `${direction}${formattedSize}`;
};

// Portfolio allocation formatting
export const formatAllocation = (value: number, total: number): string => {
  if (isNaN(value) || isNaN(total) || total === 0) return '0%';
  return formatPercentage((value / total) * 100, 1);
};

// Sharpe ratio formatting
export const formatSharpeRatio = (value: number): string => {
  if (isNaN(value)) return '-';
  return value.toFixed(3);
};

// Win rate formatting
export const formatWinRate = (wins: number, total: number): string => {
  if (total === 0) return '0%';
  return formatPercentage((wins / total) * 100, 1);
};

// Average return formatting
export const formatAverageReturn = (totalReturn: number, periods: number): string => {
  if (periods === 0) return '0%';
  return formatPercentage(totalReturn / periods, 2);
};

// Drawdown formatting
export const formatDrawdown = (value: number): string => {
  if (isNaN(value)) return '-';
  return formatPercentage(Math.abs(value), 2);
};

// Trade duration formatting
export const formatTradeDuration = (startDate: Date, endDate: Date): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '-';
  
  const diffInMs = end.getTime() - start.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffInMinutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffInDays > 0) {
    return `${diffInDays}d ${diffInHours}h`;
  } else if (diffInHours > 0) {
    return `${diffInHours}h ${diffInMinutes}m`;
  } else {
    return `${diffInMinutes}m`;
  }
};

// Utility function to determine color class based on value
export const getValueColorClass = (value: number): string => {
  if (isNaN(value)) return '';
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-600';
};

// Utility function to format with proper color styling
export const formatValueWithColor = (
  value: number,
  formatter: (val: number) => string,
  includeSign: boolean = false
): { text: string; colorClass: string } => {
  const sign = includeSign && value > 0 ? '+' : '';
  return {
    text: sign + formatter(value),
    colorClass: getValueColorClass(value)
  };
};

// Export all formatters as a collection
export const formatters = {
  currency: formatCurrency,
  percentage: formatPercentage,
  number: formatNumber,
  volume: formatVolume,
  priceChange: formatPriceChange,
  percentageChange: formatPercentageChange,
  date: formatDate,
  timeAgo: formatTimeAgo,
  marketCap: formatMarketCap,
  peRatio: formatPERatio,
  strike: formatStrike,
  expiration: formatExpiration,
  volatility: formatVolatility,
  greek: formatGreek,
  spread: formatSpread,
  riskReward: formatRiskReward,
  positionSize: formatPositionSize,
  allocation: formatAllocation,
  sharpeRatio: formatSharpeRatio,
  winRate: formatWinRate,
  averageReturn: formatAverageReturn,
  drawdown: formatDrawdown,
  tradeDuration: formatTradeDuration,
  valueWithColor: formatValueWithColor
};