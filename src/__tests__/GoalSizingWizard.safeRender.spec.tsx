import React from 'react';
import GoalSizingWizard from '../components/Wizards/GoalSizingWizard';
import { renderWithLoopGuard } from '../testUtils/renderWithLoopGuard';
import { GoalSizingProvider } from '../context/GoalSizingContext';



describe('GoalSizingWizard renders without infinite loop', () => {
  it('mounts once and does NOT trip the loop guard', () => {
    renderWithLoopGuard(
      <GoalSizingProvider>
        <GoalSizingWizard
          isOpen={true}
          onClose={() => {}}
          onComplete={() => {}}
        />
      </GoalSizingProvider>
    );
  });
}); 