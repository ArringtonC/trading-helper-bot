import React from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleMESFuturesTutorial from '../../components/SimpleMESFuturesTutorial';

const MESFuturesTutorialPage: React.FC = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    // Navigate to tutorials overview or another relevant page
    navigate('/tutorials');
  };

  const handleNext = () => {
    // Navigate to next tutorial if applicable
    navigate('/tutorials');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleMESFuturesTutorial 
        onComplete={handleComplete}
        onNext={handleNext}
      />
    </div>
  );
};

export default MESFuturesTutorialPage; 