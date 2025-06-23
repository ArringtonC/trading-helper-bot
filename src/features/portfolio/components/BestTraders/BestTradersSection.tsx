import React from 'react';
import { Users } from 'lucide-react';
import TraderProfileCard from './TraderProfileCard';
import { TraderProfile } from './types';

interface BestTradersSectionProps {
  traders?: TraderProfile[];
}

const BestTradersSection: React.FC<BestTradersSectionProps> = ({ traders = [] }) => {
  // Handle undefined or empty traders array
  if (!traders || traders.length === 0) {
    return (
      <div className="py-12">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Trader Profiles Available</h3>
          <p className="text-gray-500">Check back later for more legendary traders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:gap-10">
      {traders.map(trader => (
        <TraderProfileCard key={trader.id} trader={trader} />
      ))}
    </div>
  );
};

export default BestTradersSection; 