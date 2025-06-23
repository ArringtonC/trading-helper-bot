import EducationalVisualizerEngine, {
  VisualizationConfig,
  VisualizationData,
  InteractionEvent,
  LearningAnalytics
} from '../EducationalVisualizerEngine';

describe('EducationalVisualizerEngine', () => {
  let visualizerEngine: EducationalVisualizerEngine;

  beforeEach(() => {
    visualizerEngine = new EducationalVisualizerEngine();
  });

  describe('Visualization Management', () => {
    it('should initialize with default visualizations', () => {
      const visualizations = visualizerEngine.getVisualizations();
      
      expect(visualizations).toHaveLength(5);
      expect(visualizations.map(v => v.id)).toContain('options-payoff-basic');
      expect(visualizations.map(v => v.id)).toContain('position-sizing-calculator');
      expect(visualizations.map(v => v.id)).toContain('kelly-criterion-simulator');
      expect(visualizations.map(v => v.id)).toContain('correlation-matrix');
      expect(visualizations.map(v => v.id)).toContain('vix-risk-analyzer');
    });

    it('should get specific visualization by ID', () => {
      const viz = visualizerEngine.getVisualization('options-payoff-basic');
      
      expect(viz).toBeDefined();
      expect(viz?.title).toBe('Interactive Options Payoff Diagram');
      expect(viz?.type).toBe('options-payoff');
      expect(viz?.difficulty).toBe('learning');
    });

    it('should return undefined for non-existent visualization', () => {
      const viz = visualizerEngine.getVisualization('non-existent');
      
      expect(viz).toBeUndefined();
    });

    it('should filter visualizations by type', () => {
      const optionsViz = visualizerEngine.getVisualizationsByType('options-payoff');
      const positionSizingViz = visualizerEngine.getVisualizationsByType('position-sizing');
      
      expect(optionsViz).toHaveLength(1);
      expect(positionSizingViz).toHaveLength(1);
      expect(optionsViz[0].type).toBe('options-payoff');
      expect(positionSizingViz[0].type).toBe('position-sizing');
    });

    it('should filter visualizations by difficulty', () => {
      const beginnerViz = visualizerEngine.getVisualizationsByDifficulty('learning');
      const intermediateViz = visualizerEngine.getVisualizationsByDifficulty('import');
      const advancedViz = visualizerEngine.getVisualizationsByDifficulty('broker');
      
      expect(beginnerViz).toHaveLength(2);
      expect(intermediateViz).toHaveLength(2);
      expect(advancedViz).toHaveLength(1);
      
      expect(beginnerViz.every(v => v.difficulty === 'learning')).toBe(true);
      expect(intermediateViz.every(v => v.difficulty === 'import')).toBe(true);
      expect(advancedViz.every(v => v.difficulty === 'broker')).toBe(true);
    });
  });

  describe('Visualization Data Generation', () => {
    it('should generate options payoff data', () => {
      const data = visualizerEngine.generateVisualizationData('options-payoff-basic');
      
      expect(data.chartData).toBeInstanceOf(Array);
      expect(data.chartData.length).toBeGreaterThan(0);
      expect(data.annotations).toBeInstanceOf(Array);
      expect(data.highlights).toBeInstanceOf(Array);
      expect(data.insights).toBeInstanceOf(Array);
      
      // Verify chart data structure
      const firstPoint = data.chartData[0];
      expect(firstPoint).toHaveProperty('stockPrice');
      expect(firstPoint).toHaveProperty('profitLoss');
      expect(firstPoint).toHaveProperty('breakEven');
      
      // Should have breakeven and current price annotations
      expect(data.annotations.some(a => a.id === 'breakeven')).toBe(true);
      expect(data.annotations.some(a => a.id === 'current-price')).toBe(true);
      
      // Should have profit zone highlight
      expect(data.highlights.some(h => h.id === 'profit-zone')).toBe(true);
      
      // Should have educational insights
      expect(data.insights.some(i => i.category === 'risk')).toBe(true);
      expect(data.insights.some(i => i.category === 'education')).toBe(true);
    });

    it('should generate position sizing data', () => {
      const data = visualizerEngine.generateVisualizationData('position-sizing-calculator');
      
      expect(data.chartData).toBeInstanceOf(Array);
      expect(data.chartData.length).toBeGreaterThan(0);
      
      // Should have capital allocation data
      const capitalData = data.chartData.find(d => d.category === 'Safe Capital');
      expect(capitalData).toBeDefined();
      expect(capitalData?.percentage).toBe(98); // 100% - 2% risk
      
      // Should have scenario analysis
      const scenarios = data.chartData.filter(d => d.riskPercentage);
      expect(scenarios.length).toBeGreaterThan(0);
      
      // Should have risk zone annotations
      expect(data.annotations.some(a => a.id === 'recommended-risk')).toBe(true);
      expect(data.annotations.some(a => a.id === 'danger-zone')).toBe(true);
    });

    it('should generate Kelly criterion data', () => {
      const data = visualizerEngine.generateVisualizationData('kelly-criterion-simulator');
      
      expect(data.chartData).toBeInstanceOf(Array);
      expect(data.chartData.length).toBeGreaterThan(0);
      
      // Verify simulation data structure
      const firstPoint = data.chartData[0];
      expect(firstPoint).toHaveProperty('trade');
      expect(firstPoint).toHaveProperty('kellyMethod');
      expect(firstPoint).toHaveProperty('fixedMethod');
      expect(firstPoint).toHaveProperty('difference');
      
      // Should have Kelly percentage annotation
      expect(data.annotations.some(a => a.id === 'kelly-percentage')).toBe(true);
      
      // Should have comparison insights
      expect(data.insights.some(i => i.id === 'kelly-advantage')).toBe(true);
      expect(data.insights.some(i => i.id === 'volatility-warning')).toBe(true);
    });

    it('should generate correlation matrix data', () => {
      const data = visualizerEngine.generateVisualizationData('correlation-matrix');
      
      expect(data.chartData).toBeInstanceOf(Array);
      expect(data.chartData.length).toBe(25); // 5x5 matrix
      
      // Verify correlation data structure
      const firstPoint = data.chartData[0];
      expect(firstPoint).toHaveProperty('x');
      expect(firstPoint).toHaveProperty('y');
      expect(firstPoint).toHaveProperty('correlation');
      expect(firstPoint).toHaveProperty('risk');
      
      // Diagonal should be perfect correlation
      const diagonalPoint = data.chartData.find(d => d.x === d.y);
      expect(diagonalPoint?.correlation).toBe(1);
      
      // Should have diversification insights
      expect(data.insights.some(i => i.id === 'diversification')).toBe(true);
    });

    it('should generate VIX risk data', () => {
      const data = visualizerEngine.generateVisualizationData('vix-risk-analyzer');
      
      expect(data.chartData).toBeInstanceOf(Array);
      expect(data.chartData.length).toBeGreaterThan(0);
      
      // Verify VIX scenario structure
      const firstScenario = data.chartData[0];
      expect(firstScenario).toHaveProperty('vix');
      expect(firstScenario).toHaveProperty('impliedVol');
      expect(firstScenario).toHaveProperty('vegaImpact');
      expect(firstScenario).toHaveProperty('scenario');
      
      // Should have current VIX annotation
      expect(data.annotations.some(a => a.id === 'current-vix')).toBe(true);
      
      // Should have high volatility zone highlight
      expect(data.highlights.some(h => h.id === 'high-vol-zone')).toBe(true);
    });

    it('should allow custom parameters for visualization generation', () => {
      const customParams = {
        strikePrice: 120,
        premium: 8,
        currentPrice: 115
      };
      
      const data = visualizerEngine.generateVisualizationData('options-payoff-basic', customParams);
      
      // Verify custom parameters were used
      const currentPriceAnnotation = data.annotations.find(a => a.id === 'current-price');
      expect(currentPriceAnnotation?.text).toContain('115');
    });

    it('should throw error for unsupported visualization type', () => {
      expect(() => {
        visualizerEngine.generateVisualizationData('non-existent');
      }).toThrow('Visualization non-existent not found');
    });
  });

  describe('User Interaction Tracking', () => {
    const userId = 'test-user';
    const visualizationId = 'options-payoff-basic';

    it('should record user interactions', () => {
      const event: InteractionEvent = {
        type: 'slider-change',
        timestamp: new Date(),
        data: { parameter: 'strikePrice', value: 110 },
        userId,
        visualizationId
      };
      
      visualizerEngine.recordInteraction(event);
      
      // Verify interaction was recorded (indirectly through analytics)
      const analytics = visualizerEngine.getAnalytics(userId);
      expect(analytics).toBeDefined();
      expect(analytics?.interactionCount).toBe(1);
    });

    it('should track concept exploration', () => {
      const event: InteractionEvent = {
        type: 'concept-explored',
        timestamp: new Date(),
        data: { concept: 'breakeven-point' },
        userId,
        visualizationId
      };
      
      visualizerEngine.recordInteraction(event);
      
      const analytics = visualizerEngine.getAnalytics(userId);
      expect(analytics?.conceptsExplored).toContain('breakeven-point');
    });

    it('should track mistakes and hints', () => {
      const mistakeEvent: InteractionEvent = {
        type: 'mistake',
        timestamp: new Date(),
        data: { question: 'quiz-1', wrongAnswer: 'B' },
        userId,
        visualizationId
      };
      
      const hintEvent: InteractionEvent = {
        type: 'hint-used',
        timestamp: new Date(),
        data: { hint: 'remember-premium-cost' },
        userId,
        visualizationId
      };
      
      visualizerEngine.recordInteraction(mistakeEvent);
      visualizerEngine.recordInteraction(hintEvent);
      
      const analytics = visualizerEngine.getAnalytics(userId);
      expect(analytics?.mistakesCount).toBe(1);
      expect(analytics?.hintsUsed).toBe(1);
    });

    it('should handle anonymous users', () => {
      const event: InteractionEvent = {
        type: 'click',
        timestamp: new Date(),
        data: { element: 'help-button' },
        visualizationId
      };
      
      visualizerEngine.recordInteraction(event);
      
      const analytics = visualizerEngine.getAnalytics('anonymous');
      expect(analytics?.interactionCount).toBe(1);
    });
  });

  describe('Learning Analytics', () => {
    const userId = 'test-user';

    it('should initialize analytics for new users', () => {
      const event: InteractionEvent = {
        type: 'start',
        timestamp: new Date(),
        data: {},
        userId,
        visualizationId: 'options-payoff-basic'
      };
      
      visualizerEngine.recordInteraction(event);
      
      const analytics = visualizerEngine.getAnalytics(userId);
      expect(analytics).toBeDefined();
      expect(analytics?.timeSpent).toBe(0);
      expect(analytics?.interactionCount).toBe(1);
      expect(analytics?.conceptsExplored).toEqual([]);
      expect(analytics?.mistakesCount).toBe(0);
      expect(analytics?.hintsUsed).toBe(0);
      expect(analytics?.completionPercentage).toBe(0);
      expect(analytics?.learningVelocity).toBe(0);
    });

    it('should return undefined for users without analytics', () => {
      const analytics = visualizerEngine.getAnalytics('non-existent-user');
      expect(analytics).toBeUndefined();
    });

    it('should avoid duplicate concept exploration', () => {
      const concept = 'option-premium';
      
      // Record same concept multiple times
      for (let i = 0; i < 3; i++) {
        const event: InteractionEvent = {
          type: 'concept-explored',
          timestamp: new Date(),
          data: { concept },
          userId,
          visualizationId: 'options-payoff-basic'
        };
        visualizerEngine.recordInteraction(event);
      }
      
      const analytics = visualizerEngine.getAnalytics(userId);
      expect(analytics?.conceptsExplored).toEqual([concept]);
      expect(analytics?.interactionCount).toBe(3);
    });
  });

  describe('Recommendation System', () => {
    const userId = 'test-user';

    it('should recommend visualizations for beginners', () => {
      const recommendation = visualizerEngine.getRecommendedVisualization(userId, 'learning');
      
      expect(recommendation).toBeDefined();
      expect(recommendation?.difficulty).toBe('learning');
      expect(recommendation?.type).toBe('options-payoff'); // Should prioritize options first
    });

    it('should recommend visualizations for intermediate users', () => {
      const recommendation = visualizerEngine.getRecommendedVisualization(userId, 'import');
      
      expect(recommendation).toBeDefined();
      expect(['learning', 'import']).toContain(recommendation?.difficulty);
    });

    it('should recommend visualizations for advanced users', () => {
      const recommendation = visualizerEngine.getRecommendedVisualization(userId, 'broker');
      
      expect(recommendation).toBeDefined();
      expect(['learning', 'import', 'broker']).toContain(recommendation?.difficulty);
    });

    it('should exclude completed visualizations', () => {
      // Mark options payoff as completed
      const completedEvent: InteractionEvent = {
        type: 'completed',
        timestamp: new Date(),
        data: {},
        userId,
        visualizationId: 'options-payoff-basic'
      };
      visualizerEngine.recordInteraction(completedEvent);
      
      const recommendation = visualizerEngine.getRecommendedVisualization(userId, 'learning');
      
      expect(recommendation).toBeDefined();
      expect(recommendation?.id).not.toBe('options-payoff-basic');
      expect(recommendation?.type).toBe('position-sizing'); // Next in priority
    });

    it('should return null when no recommendations available', () => {
      // Mark all beginner visualizations as completed
      const beginnerViz = visualizerEngine.getVisualizationsByDifficulty('learning');
      beginnerViz.forEach(viz => {
        const event: InteractionEvent = {
          type: 'completed',
          timestamp: new Date(),
          data: {},
          userId,
          visualizationId: viz.id
        };
        visualizerEngine.recordInteraction(event);
      });
      
      const recommendation = visualizerEngine.getRecommendedVisualization(userId, 'learning');
      expect(recommendation).toBeNull();
    });
  });

  describe('Visualization Structure Validation', () => {
    it('should have well-formed visualization configs', () => {
      const visualizations = visualizerEngine.getVisualizations();
      
      visualizations.forEach(viz => {
        expect(viz.id).toBeDefined();
        expect(viz.type).toBeDefined();
        expect(viz.title).toBeDefined();
        expect(viz.description).toBeDefined();
        expect(viz.difficulty).toMatch(/^(beginner|intermediate|advanced)$/);
        expect(viz.parameters).toBeDefined();
        expect(viz.learningGoals).toBeInstanceOf(Array);
        expect(viz.interactionTypes).toBeInstanceOf(Array);
        
        // Validate learning goals
        expect(viz.learningGoals.length).toBeGreaterThan(0);
        viz.learningGoals.forEach(goal => {
          expect(typeof goal).toBe('string');
          expect(goal.length).toBeGreaterThan(0);
        });
        
        // Validate interaction types
        expect(viz.interactionTypes.length).toBeGreaterThan(0);
        viz.interactionTypes.forEach(type => {
          expect(['slider', 'input', 'dropdown', 'checkbox', 'drag', 'click', 'hover']).toContain(type);
        });
      });
    });

    it('should generate valid visualization data structure', () => {
      const visualizations = visualizerEngine.getVisualizations();
      
      visualizations.forEach(viz => {
        const data = visualizerEngine.generateVisualizationData(viz.id);
        
        expect(data.chartData).toBeInstanceOf(Array);
        expect(data.annotations).toBeInstanceOf(Array);
        expect(data.highlights).toBeInstanceOf(Array);
        expect(data.insights).toBeInstanceOf(Array);
        
        // Validate annotations
        data.annotations.forEach(annotation => {
          expect(annotation.id).toBeDefined();
          expect(typeof annotation.x).toBe('number');
          expect(typeof annotation.y).toBe('number');
          expect(annotation.text).toBeDefined();
          expect(['info', 'warning', 'success', 'danger']).toContain(annotation.type);
        });
        
        // Validate highlights
        data.highlights.forEach(highlight => {
          expect(highlight.id).toBeDefined();
          expect(highlight.area).toBeDefined();
          expect(highlight.color).toBeDefined();
          expect(typeof highlight.opacity).toBe('number');
          expect(highlight.opacity).toBeGreaterThanOrEqual(0);
          expect(highlight.opacity).toBeLessThanOrEqual(1);
        });
        
        // Validate insights
        data.insights.forEach(insight => {
          expect(insight.id).toBeDefined();
          expect(['risk', 'opportunity', 'education', 'warning']).toContain(insight.category);
          expect(insight.title).toBeDefined();
          expect(insight.description).toBeDefined();
          expect(typeof insight.confidence).toBe('number');
          expect(insight.confidence).toBeGreaterThanOrEqual(0);
          expect(insight.confidence).toBeLessThanOrEqual(1);
          expect(typeof insight.relevance).toBe('number');
          expect(insight.relevance).toBeGreaterThanOrEqual(0);
          expect(insight.relevance).toBeLessThanOrEqual(1);
        });
      });
    });
  });

  describe('Trading Simulation', () => {
    it('should simulate realistic trading outcomes', () => {
      // Test via Kelly criterion visualization
      const data = visualizerEngine.generateVisualizationData('kelly-criterion-simulator', {
        winRate: 0.6,
        avgWin: 10,
        avgLoss: 5,
        initialCapital: 1000,
        numberOfTrades: 10
      });
      
      expect(data.chartData).toHaveLength(11); // Initial + 10 trades
      
      // First point should be initial capital
      expect(data.chartData[0].kellyMethod).toBe(1000);
      expect(data.chartData[0].fixedMethod).toBe(1000);
      
      // Subsequent points should show progression
      data.chartData.forEach((point, index) => {
        if (index > 0) {
          expect(point.kellyMethod).toBeGreaterThanOrEqual(0);
          expect(point.fixedMethod).toBeGreaterThanOrEqual(0);
          expect(typeof point.difference).toBe('number');
        }
      });
    });
  });
}); 