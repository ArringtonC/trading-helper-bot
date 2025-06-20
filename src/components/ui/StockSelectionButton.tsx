import React, { useState } from 'react';
import { Button } from './button';
import { Star, Plus } from 'lucide-react';
import WatchlistService from '../../services/WatchlistService';

interface StockSelectionButtonProps {
  stock: {
    symbol: string;
    name: string;
    price: number;
    riskLevel?: 'low' | 'medium' | 'high';
  };
  source: 'curated-lists' | 'screening' | 'template-matching' | 'manual';
  category?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'outline' | 'default' | 'ghost';
  showText?: boolean;
  className?: string;
  onSuccess?: () => void;
}

const StockSelectionButton: React.FC<StockSelectionButtonProps> = ({
  stock,
  source,
  category = '',
  size = 'default',
  variant = 'outline',
  showText = false,
  className = '',
  onSuccess
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  
  const isInWatchlist = WatchlistService.isInWatchlist(stock.symbol);

  const handleAddToWatchlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isInWatchlist || isAdding) return;
    
    setIsAdding(true);
    
    try {
      const success = WatchlistService.addStock({
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        source,
        category,
        riskLevel: stock.riskLevel || 'medium'
      });

      if (success) {
        setJustAdded(true);
        onSuccess?.();
        
        setTimeout(() => setJustAdded(false), 2000);
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const getButtonContent = () => {
    if (isAdding) {
      return (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {showText && <span className="ml-2">Adding...</span>}
        </>
      );
    }
    
    if (isInWatchlist || justAdded) {
      return (
        <>
          <Star className="h-4 w-4 fill-current" />
          {showText && <span className="ml-2">In Watchlist</span>}
        </>
      );
    }
    
    return (
      <>
        <Plus className="h-4 w-4" />
        {showText && <span className="ml-2">Add to Watchlist</span>}
      </>
    );
  };

  const getButtonClass = () => {
    if (isInWatchlist || justAdded) {
      return 'text-yellow-600 border-yellow-300 bg-yellow-50 hover:bg-yellow-100';
    }
    return '';
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleAddToWatchlist}
      disabled={isInWatchlist || isAdding || justAdded}
      className={`${getButtonClass()} ${className}`}
      title={
        isInWatchlist 
          ? 'Already in watchlist' 
          : justAdded 
          ? 'Added to watchlist!' 
          : `Add ${stock.symbol} to watchlist`
      }
    >
      {getButtonContent()}
    </Button>
  );
};

export default StockSelectionButton; 