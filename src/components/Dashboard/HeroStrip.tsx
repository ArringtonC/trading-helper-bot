import React from 'react';

type Props = {
  headline: string;
  hoursSaved: number;
};

export const HeroStrip: React.FC<Props> = ({ headline, hoursSaved }) => (
  <section className="grid lg:grid-cols-12 items-center gap-8 py-8">
    <div className="lg:col-span-7">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{headline}</h1>
      <p className="mt-4 text-lg text-gray-600">
        You've saved <strong>{hoursSaved.toFixed(1)} h</strong> this month.
      </p>
    </div>
    <div className="lg:col-span-5 flex justify-center">
      {/* TODO: insert illustration */}
      <div className="w-64 h-32 bg-gradient-to-r from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">Dashboard Illustration</span>
      </div>
    </div>
  </section>
); 
 
 
 