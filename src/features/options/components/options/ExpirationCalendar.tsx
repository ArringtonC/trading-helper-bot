import React, { useState } from 'react';
import { OptionTrade } from '../../../../shared/types/options';

interface ExpirationCalendarProps {
  trades: OptionTrade[];
  onTradeClick?: (trade: OptionTrade) => void;
}

/**
 * Calendar component to display option expiration dates
 */
const ExpirationCalendar: React.FC<ExpirationCalendarProps> = ({ trades, onTradeClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Get options expiring on a specific date
  const getOptionsForDate = (date: Date) => {
    return trades.filter(trade => {
      const expiry = new Date(trade.expiry);
      return (
        expiry.getFullYear() === date.getFullYear() &&
        expiry.getMonth() === date.getMonth() &&
        expiry.getDate() === date.getDate() &&
        !trade.closeDate // Only show open positions
      );
    });
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() - 1);
      return newMonth;
    });
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + 1);
      return newMonth;
    });
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  };
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border bg-gray-50"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const optionsForDay = getOptionsForDate(date);
      const isToday = 
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`h-24 border p-1 ${isToday ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}
        >
          <div className="flex justify-between">
            <span className={`text-sm ${isToday ? 'font-bold text-blue-600' : ''}`}>{day}</span>
            {optionsForDay.length > 0 && (
              <span className="text-xs bg-green-600 text-white px-1 rounded">
                {optionsForDay.length}
              </span>
            )}
          </div>
          
          <div className="mt-1 overflow-y-auto max-h-16">
            {optionsForDay.map((option, index) => (
              <div 
                key={option.id}
                onClick={() => onTradeClick && onTradeClick(option)}
                className={`text-xs p-1 mb-1 rounded truncate cursor-pointer ${
                  option.putCall === 'CALL' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
                title={`${option.symbol} ${option.putCall} $${option.strike}`}
              >
                {option.symbol} {option.strike}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return days;
  };
  
  const calendarDays = generateCalendarDays();
  
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800">Options Expiration Calendar</h2>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-1 rounded hover:bg-gray-200"
          >
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <span className="text-sm font-medium">
            {formatDate(currentMonth)}
          </span>
          
          <button
            onClick={goToNextMonth}
            className="p-1 rounded hover:bg-gray-200"
          >
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-px">
        {/* Calendar header - days of week */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center py-1 font-medium text-sm text-gray-600">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays}
      </div>
      
      <div className="mt-3 flex justify-between text-xs text-gray-600 px-1">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-600 mr-1"></div>
          <span>Call options</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-600 mr-1"></div>
          <span>Put options</span>
        </div>
      </div>
    </div>
  );
};

export default ExpirationCalendar; 