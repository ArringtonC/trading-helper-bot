import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Projection } from '../types/account';

interface ProjectionChartProps {
  projections: Projection[];
}

const ProjectionChart: React.FC<ProjectionChartProps> = ({ projections }) => {
  // Custom tooltip formatter to display dollar amounts
  const formatTooltipValue = (value: number) => {
    return [`$${value.toFixed(2)}`, 'Balance'];
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <h2 className="text-lg font-medium text-gray-800 mb-4">Balance Projection (2025)</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={projections}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: any) => formatTooltipValue(value as number)} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#3B82F6" 
              name="Account Balance" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProjectionChart; 