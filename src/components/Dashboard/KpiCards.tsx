import React from 'react';

type Card = { 
  label: string; 
  value: string; 
  trend?: 'up' | 'down' | 'neutral';
  color?: 'green' | 'red' | 'blue' | 'gray';
};

export const KpiCards: React.FC<{ cards: Card[] }> = ({ cards }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {cards.map(card => (
      <div 
        key={card.label} 
        className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 shadow-sm flex flex-col items-center hover:shadow-md transition-shadow"
      >
        <span className={`text-2xl font-semibold ${getValueColor(card.color)}`}>
          {card.value}
        </span>
        <span className="mt-1 text-sm text-gray-500 text-center">{card.label}</span>
        {card.trend && (
          <div className={`mt-1 text-xs ${getTrendColor(card.trend)}`}>
            {getTrendIcon(card.trend)}
          </div>
        )}
      </div>
    ))}
  </div>
);

function getValueColor(color?: string): string {
  switch (color) {
    case 'green': return 'text-green-600';
    case 'red': return 'text-red-600';
    case 'blue': return 'text-blue-600';
    default: return 'text-gray-800';
  }
}

function getTrendColor(trend: string): string {
  switch (trend) {
    case 'up': return 'text-green-500';
    case 'down': return 'text-red-500';
    default: return 'text-gray-500';
  }
}

function getTrendIcon(trend: string): string {
  switch (trend) {
    case 'up': return '↗';
    case 'down': return '↘';
    default: return '→';
  }
} 
 
 
 