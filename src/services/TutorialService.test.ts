import {
  getAllTutorialsMetadata,
  getTutorialById,
  getTutorialsByCategory,
  getTutorialsByTargetSelector
} from './TutorialService';
import { Tutorial, TutorialMetadata } from '../types/Tutorial';

// The MOCK_TUTORIALS_DB is not exported, so we'll define a subset here 
// for comparison, or trust the service's internal logic for now.
// For more thorough tests, one might export the mock DB or use a shared mock data module.

const expectedWelcomeTutorial: Partial<Tutorial> = {
    id: 'welcome-to-platform',
    title: 'Welcome to Your New Trading Dashboard!',
    category: 'onboarding',
};

const expectedRiskGaugesTutorial: Partial<Tutorial> = {
    id: 'understanding-risk-gauges',
    title: 'Understanding Your Risk Gauges',
    category: 'onboarding',
};

const expectedGoalWizardTutorial: Partial<Tutorial> = {
    id: 'using-the-goal-wizard',
    title: 'Setting Up Your Goals with the Wizard',
    category: 'features',
};

describe('TutorialService', () => {
  describe('getAllTutorialsMetadata', () => {
    it('should return metadata for all mock tutorials', async () => {
      const metadata = await getAllTutorialsMetadata();
      expect(metadata).toBeInstanceOf(Array);
      expect(metadata.length).toBe(3); // Based on current MOCK_TUTORIALS_DB
      expect(metadata[0].id).toBe(expectedWelcomeTutorial.id);
      expect(metadata[1].title).toBe(expectedRiskGaugesTutorial.title);
      // Check that content is not included
      expect((metadata[0] as any).content).toBeUndefined();
    });

    it('should return objects matching TutorialMetadata structure', async () => {
        const metadata = await getAllTutorialsMetadata();
        metadata.forEach(item => {
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('title');
            // sequence, category, targetElementSelectors are optional in type, check if they exist or are undefined
            expect('sequence' in item || item.sequence === undefined).toBeTruthy();
            expect('category' in item || item.category === undefined).toBeTruthy();
            expect('targetElementSelectors' in item || item.targetElementSelectors === undefined).toBeTruthy();
            expect(item).not.toHaveProperty('content'); // Ensure full content is stripped
        });
    });
  });

  describe('getTutorialById', () => {
    it('should return the correct tutorial with content when found', async () => {
      const tutorial = await getTutorialById('welcome-to-platform');
      expect(tutorial).toBeDefined();
      expect(tutorial?.id).toBe(expectedWelcomeTutorial.id);
      expect(tutorial?.title).toBe(expectedWelcomeTutorial.title);
      expect(tutorial?.content).toBeDefined();
      expect(tutorial?.content).toContain('# Welcome to the Platform!');
    });

    it('should return undefined for a non-existent ID', async () => {
      const tutorial = await getTutorialById('non-existent-id');
      expect(tutorial).toBeUndefined();
    });
  });

  describe('getTutorialsByCategory', () => {
    it('should return tutorials for an existing category, sorted by sequence', async () => {
        const onboardingTutorials = await getTutorialsByCategory('onboarding');
        expect(onboardingTutorials).toBeInstanceOf(Array);
        expect(onboardingTutorials.length).toBe(2);
        expect(onboardingTutorials[0].id).toBe(expectedWelcomeTutorial.id); // sequence 1
        expect(onboardingTutorials[1].id).toBe(expectedRiskGaugesTutorial.id); // sequence 2
        onboardingTutorials.forEach(item => {
            expect(item.category).toBe('onboarding');
            expect(item).not.toHaveProperty('content');
        });
    });

    it('should return an empty array for a non-existent category', async () => {
        const tutorials = await getTutorialsByCategory('non-existent-category');
        expect(tutorials).toEqual([]);
    });
  });

  describe('getTutorialsByTargetSelector', () => {
    it('should return tutorials matching a target selector, sorted by sequence', async () => {
        const dashboardTutorials = await getTutorialsByTargetSelector('.main-dashboard-area');
        expect(dashboardTutorials).toBeInstanceOf(Array);
        expect(dashboardTutorials.length).toBe(1);
        expect(dashboardTutorials[0].id).toBe(expectedWelcomeTutorial.id);
        dashboardTutorials.forEach(item => {
            expect(item.targetElementSelectors).toContain('.main-dashboard-area');
            expect(item).not.toHaveProperty('content');
        });

        const riskGaugeTutorials = await getTutorialsByTargetSelector('#risk-gauge-delta');
        expect(riskGaugeTutorials.length).toBe(1);
        expect(riskGaugeTutorials[0].id).toBe(expectedRiskGaugesTutorial.id);
    });

    it('should return an empty array if no tutorials match the selector', async () => {
        const tutorials = await getTutorialsByTargetSelector('.non-existent-selector');
        expect(tutorials).toEqual([]);
    });
  });

}); 