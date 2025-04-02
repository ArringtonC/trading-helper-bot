import React from 'react';
import { Projection } from '../types/account';

interface ProjectionChartProps {
  projections: Projection[];
}

const ProjectionChart: React.FC<ProjectionChartProps> = ({ projections }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <h2 className="text-lg font-medium text-gray-800 mb-4">
        Balance Projection (2025)
      </h2>
      
      <div className="h-64 bg-gray-50 flex items-center justify-center border border-gray-200 rounded">
        <div className="w-full h-full p-4">
          <div className="w-full h-full flex items-end relative">
            <div className="absolute top-0 left-0 right-0 bottom-0 grid grid-cols-1">
              <div className="border-b border-gray-300"></div>
              <div className="border-b border-gray-300"></div>
              <div className="border-b border-gray-300"></div>
              <div className="border-b border-gray-300"></div>
            </div>
            
            {projections.map((projection, index) => {
              const height = `${(projection.balance / (projections[projections.length - 1].balance * 1.1)) * 100}%`;
              const width = `${90 / projections.length}%`;
              const marginLeft = `${(index * 90 / projections.length) + 5}%`;
              
              return (
                <div 
                  key={index}
                  className="absolute bottom-0 bg-blue-500 hover:bg-blue-600 transition-colors" 
                  style={{ 
                    height, 
                    width,
                    left: marginLeft
                  }}
                  title={`${projection.month}: $${projection.balance.toFixed(2)}`}
                >
                  <div className="absolute -top-5 w-full text-center text-xs">
                    {index % 2 === 0 && projection.month}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectionChart; 