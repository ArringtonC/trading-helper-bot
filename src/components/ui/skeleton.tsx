import React from 'react';

interface SkeletonProps {
  className?: string;
}
 
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
); 