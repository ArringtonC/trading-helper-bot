import EducationalModules, { 
  EducationalModule, 
  ModuleProgress, 
  LearningPath,
  DifficultyLevel 
} from '../EducationalModules';

describe('EducationalModules', () => {
  let educationalModules: EducationalModules;

  beforeEach(() => {
    educationalModules = new EducationalModules();
  });

  describe('Module Management', () => {
    it('should initialize with default modules', () => {
      const modules = educationalModules.getModules();
      
      expect(modules).toHaveLength(3);
      expect(modules.map(m => m.id)).toContain('basic-options');
      expect(modules.map(m => m.id)).toContain('position-sizing');
      expect(modules.map(m => m.id)).toContain('risk-management');
    });

    it('should get specific module by ID', () => {
      const module = educationalModules.getModule('basic-options');
      
      expect(module).toBeDefined();
      expect(module?.title).toBe('Options Trading Fundamentals');
      expect(module?.difficulty).toBe('learning');
    });

    it('should return undefined for non-existent module', () => {
      const module = educationalModules.getModule('non-existent');
      
      expect(module).toBeUndefined();
    });

    it('should filter modules by difficulty', () => {
      const beginnerModules = educationalModules.getModulesByDifficulty('learning');
      const intermediateModules = educationalModules.getModulesByDifficulty('import');
      
      expect(beginnerModules).toHaveLength(2);
      expect(intermediateModules).toHaveLength(1);
      expect(beginnerModules.every(m => m.difficulty === 'learning')).toBe(true);
      expect(intermediateModules.every(m => m.difficulty === 'import')).toBe(true);
    });

    it('should filter modules by type', () => {
      const optionsModules = educationalModules.getModulesByType('basic-options');
      const positionSizingModules = educationalModules.getModulesByType('position-sizing');
      
      expect(optionsModules).toHaveLength(1);
      expect(positionSizingModules).toHaveLength(1);
      expect(optionsModules[0].type).toBe('basic-options');
      expect(positionSizingModules[0].type).toBe('position-sizing');
    });
  });

  describe('Learning Paths', () => {
    it('should initialize learning paths', () => {
      const paths = educationalModules.getLearningPaths();
      
      expect(paths).toHaveLength(2);
      expect(paths.map(p => p.id)).toContain('new-trader-foundation');
      expect(paths.map(p => p.id)).toContain('comprehensive-trader');
    });

    it('should get specific learning path', () => {
      const path = educationalModules.getLearningPath('new-trader-foundation');
      
      expect(path).toBeDefined();
      expect(path?.name).toBe('New Trader Foundation');
      expect(path?.modules).toEqual(['basic-options', 'position-sizing']);
    });
  });

  describe('User Progress Tracking', () => {
    const userId = 'test-user';
    const moduleId = 'basic-options';

    it('should start a module for a user', () => {
      const progress = educationalModules.startModule(userId, moduleId);
      
      expect(progress.userId).toBe(userId);
      expect(progress.moduleId).toBe(moduleId);
      expect(progress.startedAt).toBeInstanceOf(Date);
      expect(progress.completedContent).toEqual([]);
      expect(progress.timeSpentMinutes).toBe(0);
    });

    it('should throw error when starting non-existent module', () => {
      expect(() => {
        educationalModules.startModule(userId, 'non-existent');
      }).toThrow('Module non-existent not found');
    });

    it('should track user progress', () => {
      educationalModules.startModule(userId, moduleId);
      const userProgress = educationalModules.getUserProgress(userId);
      
      expect(userProgress).toHaveLength(1);
      expect(userProgress[0].moduleId).toBe(moduleId);
    });

    it('should update content progress', () => {
      educationalModules.startModule(userId, moduleId);
      educationalModules.updateContentProgress(userId, moduleId, 'options-intro', 10);
      
      const progress = educationalModules.getUserProgress(userId)[0];
      expect(progress.completedContent).toContain('options-intro');
      expect(progress.timeSpentMinutes).toBe(10);
    });

    it('should update current content to next uncompleted item', () => {
      educationalModules.startModule(userId, moduleId);
      educationalModules.updateContentProgress(userId, moduleId, 'options-intro');
      
      const progress = educationalModules.getUserProgress(userId)[0];
      expect(progress.currentContentId).toBe('calls-puts-visualization');
    });

    it('should mark module as completed when all content is done', () => {
      educationalModules.startModule(userId, moduleId);
      const module = educationalModules.getModule(moduleId)!;
      
      // Complete all content
      module.content.forEach(content => {
        educationalModules.updateContentProgress(userId, moduleId, content.id);
      });
      
      const progress = educationalModules.getUserProgress(userId)[0];
      expect(progress.completedAt).toBeInstanceOf(Date);
    });

    it('should check if module is completed', () => {
      educationalModules.startModule(userId, moduleId);
      
      expect(educationalModules.isModuleCompleted(userId, moduleId)).toBe(false);
      
      const module = educationalModules.getModule(moduleId)!;
      module.content.forEach(content => {
        educationalModules.updateContentProgress(userId, moduleId, content.id);
      });
      
      expect(educationalModules.isModuleCompleted(userId, moduleId)).toBe(true);
    });

    it('should calculate module completion percentage', () => {
      educationalModules.startModule(userId, moduleId);
      
      expect(educationalModules.getModuleCompletionPercentage(userId, moduleId)).toBe(0);
      
      educationalModules.updateContentProgress(userId, moduleId, 'options-intro');
      const percentage = educationalModules.getModuleCompletionPercentage(userId, moduleId);
      expect(percentage).toBeCloseTo(33.33, 1); // 1 of 3 content items
    });

    it('should record assessment scores', () => {
      educationalModules.startModule(userId, moduleId);
      educationalModules.recordAssessmentScore(userId, moduleId, 'options-quiz', 85);
      
      const progress = educationalModules.getUserProgress(userId)[0];
      expect(progress.assessmentScores['options-quiz']).toBe(85);
    });
  });

  describe('Overall Progress Analytics', () => {
    const userId = 'test-user';

    it('should calculate overall progress', () => {
      // Start multiple modules
      educationalModules.startModule(userId, 'basic-options');
      educationalModules.startModule(userId, 'position-sizing');
      
      // Complete one module
      const basicOptionsModule = educationalModules.getModule('basic-options')!;
      basicOptionsModule.content.forEach(content => {
        educationalModules.updateContentProgress(userId, 'basic-options', content.id, 5);
      });
      
      const overall = educationalModules.getOverallProgress(userId);
      
      expect(overall.modulesStarted).toBe(2);
      expect(overall.modulesCompleted).toBe(1);
      expect(overall.totalTimeSpent).toBe(15); // 5 minutes * 3 content items
      expect(overall.completionPercentage).toBeCloseTo(33.33, 1); // 1 of 3 total modules
    });

    it('should return empty progress for new user', () => {
      const overall = educationalModules.getOverallProgress('new-user');
      
      expect(overall.modulesStarted).toBe(0);
      expect(overall.modulesCompleted).toBe(0);
      expect(overall.totalTimeSpent).toBe(0);
      expect(overall.completionPercentage).toBe(0);
    });
  });

  describe('Recommendations', () => {
    it('should recommend modules based on user level', () => {
      const beginnerRecommendations = educationalModules.getRecommendedModules('learning');
      const intermediateRecommendations = educationalModules.getRecommendedModules('import');
      const advancedRecommendations = educationalModules.getRecommendedModules('broker');
      
      expect(beginnerRecommendations).toHaveLength(2); // Only beginner modules
      expect(intermediateRecommendations).toHaveLength(3); // Beginner + intermediate
      expect(advancedRecommendations).toHaveLength(3); // All modules
      
      expect(beginnerRecommendations.every(m => m.difficulty === 'learning')).toBe(true);
    });

    it('should exclude completed modules from recommendations', () => {
      const completedModules = ['basic-options'];
      const recommendations = educationalModules.getRecommendedModules('learning', completedModules);
      
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].id).toBe('position-sizing');
    });

    it('should sort recommendations by difficulty and time', () => {
      const recommendations = educationalModules.getRecommendedModules('broker');
      
      // Should be sorted by difficulty first, then by time
      for (let i = 0; i < recommendations.length - 1; i++) {
        const current = recommendations[i];
        const next = recommendations[i + 1];
        
        const difficultyOrder = { learning: 1, import: 2, broker: 3 };
        const currentDifficulty = difficultyOrder[current.difficulty];
        const nextDifficulty = difficultyOrder[next.difficulty];
        
        if (currentDifficulty === nextDifficulty) {
          expect(current.estimatedTimeMinutes).toBeLessThanOrEqual(next.estimatedTimeMinutes);
        } else {
          expect(currentDifficulty).toBeLessThanOrEqual(nextDifficulty);
        }
      }
    });

    it('should get next recommended content for user', () => {
      const userId = 'test-user';
      
      // No modules started - should suggest new module
      let nextContent = educationalModules.getNextContent(userId);
      expect(nextContent).toBeDefined();
      expect(nextContent?.isNewModule).toBe(true);
      
      // Start a module and complete some content
      educationalModules.startModule(userId, 'basic-options');
      educationalModules.updateContentProgress(userId, 'basic-options', 'options-intro');
      
      // Should suggest next content in current module
      nextContent = educationalModules.getNextContent(userId);
      expect(nextContent).toBeDefined();
      expect(nextContent?.isNewModule).toBe(false);
      expect(nextContent?.content.id).toBe('calls-puts-visualization');
    });

    it('should return null when no content available', () => {
      const userId = 'test-user';
      
      // Complete all beginner modules
      const beginnerModules = educationalModules.getModulesByDifficulty('learning');
      beginnerModules.forEach(module => {
        educationalModules.startModule(userId, module.id);
        module.content.forEach(content => {
          educationalModules.updateContentProgress(userId, module.id, content.id);
        });
      });
      
      // For a beginner user with all beginner modules completed
      const nextContent = educationalModules.getNextContent(userId);
      expect(nextContent).toBeNull();
    });
  });

  describe('Content Structure Validation', () => {
    it('should have well-formed module structure', () => {
      const modules = educationalModules.getModules();
      
      modules.forEach(module => {
        expect(module.id).toBeDefined();
        expect(module.title).toBeDefined();
        expect(module.description).toBeDefined();
        expect(module.difficulty).toMatch(/^(beginner|intermediate|advanced)$/);
        expect(module.estimatedTimeMinutes).toBeGreaterThan(0);
        expect(module.learningObjectives).toBeInstanceOf(Array);
        expect(module.content).toBeInstanceOf(Array);
        expect(module.tags).toBeInstanceOf(Array);
        expect(module.updatedAt).toBeInstanceOf(Date);
        
        // Validate learning objectives
        module.learningObjectives.forEach(objective => {
          expect(objective.id).toBeDefined();
          expect(objective.description).toBeDefined();
          expect(typeof objective.completed).toBe('boolean');
          expect(typeof objective.required).toBe('boolean');
        });
        
        // Validate content structure
        module.content.forEach(content => {
          expect(content.id).toBeDefined();
          expect(content.type).toMatch(/^(text|interactive|quiz|visualization|calculation)$/);
          expect(content.title).toBeDefined();
          expect(content.content).toBeDefined();
          expect(content.estimatedTimeMinutes).toBeGreaterThan(0);
          expect(content.prerequisites).toBeInstanceOf(Array);
        });
      });
    });

    it('should have valid content prerequisites', () => {
      const modules = educationalModules.getModules();
      
      modules.forEach(module => {
        const contentIds = new Set(module.content.map(c => c.id));
        
        module.content.forEach(content => {
          // All prerequisites should exist within the same module
          content.prerequisites.forEach(prereqId => {
            expect(contentIds.has(prereqId)).toBe(true);
          });
        });
      });
    });

    it('should have valid module prerequisites', () => {
      const modules = educationalModules.getModules();
      const moduleIds = new Set(modules.map(m => m.id));
      
      modules.forEach(module => {
        module.prerequisites.forEach(prereqId => {
          expect(moduleIds.has(prereqId)).toBe(true);
        });
      });
    });
  });

  describe('Quiz Data Validation', () => {
    it('should have well-formed quiz data', () => {
      const module = educationalModules.getModule('basic-options');
      const quizContent = module?.content.find(c => c.type === 'quiz');
      
      expect(quizContent).toBeDefined();
      expect(quizContent?.quizData).toBeDefined();
      
      const quizData = quizContent!.quizData!;
      expect(quizData.questions).toBeInstanceOf(Array);
      expect(quizData.passingScore).toBeGreaterThan(0);
      expect(quizData.passingScore).toBeLessThanOrEqual(100);
      expect(typeof quizData.allowRetries).toBe('boolean');
      
      quizData.questions.forEach(question => {
        expect(question.id).toBeDefined();
        expect(question.question).toBeDefined();
        expect(question.type).toMatch(/^(multiple-choice|true-false|numeric|drag-drop)$/);
        expect(question.correctAnswer).toBeDefined();
        expect(question.explanation).toBeDefined();
        expect(question.points).toBeGreaterThan(0);
        
        if (question.type === 'multiple-choice') {
          expect(question.options).toBeInstanceOf(Array);
          expect(question.options!.length).toBeGreaterThan(1);
          expect(question.options).toContain(question.correctAnswer);
        }
      });
    });
  });
}); 