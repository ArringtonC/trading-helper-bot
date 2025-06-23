import React from 'react';
import { useNavigate } from 'react-router-dom';
import FixedIBKRImportTester from '../../../features/broker-integration/components/FixedIBKRImportTester';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

/**
 * Page for testing the fixed IBKR import functionality
 */
export default function ImportToDatabase() {
  const navigate = useNavigate();
  
  // Handle navigation back to options page
  const handleBack = () => {
    navigate('/options');
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={handleBack}
          className="mr-4 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Import to Database</h1>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              This page uses an improved parser specifically designed to handle your IBKR statement format. 
              It correctly identifies trades in the format you're using and imports them into your account.
            </p>
          </div>
        </div>
      </div>
      
      <FixedIBKRImportTester navigate={navigate} />
    </div>
  );
} 