import React from 'react';
import { useNavigate } from 'react-router-dom';
import GoalSizingWizard from '../../../features/goal-setting/components/Wizards/GoalSizingWizard';
import { GoalSizingConfig } from '../../../features/goal-setting/types/goalSizing';

export default function GoalSizingPage() {
  const navigate = useNavigate();
  
  const handleComplete = (cfg: GoalSizingConfig) => {
    console.log('Goal sizing wizard completed:', cfg);
    navigate('/unified-dashboard');
  };
  
  const handleClose = () => {
    navigate(-1); // Go back one page
  };
  
  return (
    <GoalSizingWizard
      /* wizard is always open on this page */
      isOpen={true}
      onClose={handleClose}
      onComplete={handleComplete}
      isFirstTimeUser={false}
    />
  );
} 