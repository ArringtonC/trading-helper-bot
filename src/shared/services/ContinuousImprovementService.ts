// Continuous Improvement Service - Task 28.5
// Provides usage analytics, A/B testing, and performance monitoring

import { IndexedDBService } from './IndexedDBService';

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  timestamp: string;
  userId: string;
  sessionId: string;
  data: Record<string, any>;
  context?: {
    page?: string;
    component?: string;
    phase?: number;
    step?: string;
  };
}

export interface UserJourneyEvent {
  eventType: 'page_view' | 'wizard_start' | 'wizard_step' | 'wizard_complete' | 'wizard_abandon' | 'feature_use' | 'error';
  phase?: number;
  step?: string;
  duration?: number;
  success?: boolean;
  errorDetails?: string;
}

export interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  startDate: string;
  endDate?: string;
  variants: ABTestVariant[];
  trafficAllocation: number; // 0-1, percentage of users to include
  conversionGoals: string[];
}

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-1, relative weight for allocation
  config: Record<string, any>;
}

export interface ABTestAssignment {
  userId: string;
  testId: string;
  variantId: string;
  assignedAt: string;
}

export interface PerformanceMetric {
  id: string;
  name: string;
  timestamp: string;
  value: number;
  unit: string;
  context: Record<string, any>;
}

export interface UsageAnalytics {
  totalSessions: number;
  avgSessionDuration: number;
  wizardStartRate: number;
  wizardCompletionRate: number;
  stepAbandonmentRates: Record<string, number>;
  featureUsageRates: Record<string, number>;
  errorRates: Record<string, number>;
  timeToComplete: {
    avg: number;
    median: number;
    p95: number;
  };
}

export class ContinuousImprovementService {
  private indexedDBService: IndexedDBService;
  private sessionId: string;
  private userId: string;
  private analyticsEnabled: boolean;
  private abTestsCache: Map<string, ABTestConfig> = new Map();

  constructor(userId: string = 'default') {
    this.indexedDBService = new IndexedDBService();
    this.sessionId = this.generateSessionId();
    this.userId = userId;
    this.analyticsEnabled = this.getAnalyticsConsent();
  }

  async init(): Promise<void> {
    await this.indexedDBService.init();
    await this.loadABTests();
    
    // Track session start
    if (this.analyticsEnabled) {
      await this.trackEvent('session_start', {});
    }
  }

  // Analytics Event Tracking
  async trackEvent(eventType: string, data: Record<string, any>, context?: any): Promise<void> {
    if (!this.analyticsEnabled) return;

    const event: AnalyticsEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
      data: this.sanitizeEventData(data),
      context
    };

    try {
      await this.storeAnalyticsEvent(event);
    } catch (error) {
      console.warn('Failed to store analytics event:', error);
    }
  }

  async trackUserJourney(event: UserJourneyEvent): Promise<void> {
    await this.trackEvent('user_journey', event, {
      component: 'goal_wizard',
      phase: event.phase,
      step: event.step
    });
  }

  async trackPerformance(metric: PerformanceMetric): Promise<void> {
    await this.trackEvent('performance_metric', {
      metricName: metric.name,
      value: metric.value,
      unit: metric.unit,
      context: metric.context
    });
  }

  async trackError(error: Error, context?: Record<string, any>): Promise<void> {
    await this.trackEvent('error', {
      errorMessage: error.message,
      errorStack: error.stack,
      context
    });
  }

  // A/B Testing
  async getABTestVariant(testId: string): Promise<string | null> {
    const testConfig = this.abTestsCache.get(testId);
    if (!testConfig || !testConfig.enabled) return null;

    // Check if user is already assigned
    const existingAssignment = await this.getABTestAssignment(testId);
    if (existingAssignment) {
      return existingAssignment.variantId;
    }

    // Check traffic allocation
    if (Math.random() > testConfig.trafficAllocation) {
      return null;
    }

    // Assign variant based on weights
    const variant = this.selectVariantByWeight(testConfig.variants);
    if (variant) {
      await this.assignABTestVariant(testId, variant.id);
      await this.trackEvent('ab_test_assignment', {
        testId,
        variantId: variant.id
      });
      return variant.id;
    }

    return null;
  }

  async trackABTestConversion(testId: string, goalName: string, value?: number): Promise<void> {
    const assignment = await this.getABTestAssignment(testId);
    if (assignment) {
      await this.trackEvent('ab_test_conversion', {
        testId,
        variantId: assignment.variantId,
        goalName,
        value
      });
    }
  }

  // Analytics Queries
  async getUsageAnalytics(startDate: string, endDate: string): Promise<UsageAnalytics> {
    const events = await this.getAnalyticsEvents(startDate, endDate);
    
    const sessions = this.groupEventsBySessions(events);
    const journeyEvents = events.filter(e => e.eventType === 'user_journey');
    
    return {
      totalSessions: sessions.length,
      avgSessionDuration: this.calculateAvgSessionDuration(sessions),
      wizardStartRate: this.calculateWizardStartRate(journeyEvents),
      wizardCompletionRate: this.calculateWizardCompletionRate(journeyEvents),
      stepAbandonmentRates: this.calculateStepAbandonmentRates(journeyEvents),
      featureUsageRates: this.calculateFeatureUsageRates(events),
      errorRates: this.calculateErrorRates(events),
      timeToComplete: this.calculateTimeToComplete(journeyEvents)
    };
  }

  async getUserJourneyFunnel(startDate: string, endDate: string): Promise<Record<string, number>> {
    const events = await this.getAnalyticsEvents(startDate, endDate);
    const journeyEvents = events.filter(e => e.eventType === 'user_journey');
    
    const funnel: Record<string, number> = {};
    
    // Count events by step
    journeyEvents.forEach(event => {
      const step = event.data.step || event.data.eventType;
      funnel[step] = (funnel[step] || 0) + 1;
    });
    
    return funnel;
  }

  async getABTestResults(testId: string): Promise<{
    variants: Record<string, {
      assignments: number;
      conversions: Record<string, number>;
      conversionRates: Record<string, number>;
    }>;
  }> {
    const assignments = await this.getABTestAssignments(testId);
    const conversions = await this.getABTestConversions(testId);
    
    const results: any = { variants: {} };
    
    // Group by variant
    assignments.forEach(assignment => {
      if (!results.variants[assignment.variantId]) {
        results.variants[assignment.variantId] = {
          assignments: 0,
          conversions: {},
          conversionRates: {}
        };
      }
      results.variants[assignment.variantId].assignments++;
    });
    
    // Count conversions
    conversions.forEach(conversion => {
      const variant = results.variants[conversion.data.variantId];
      if (variant) {
        const goalName = conversion.data.goalName;
        variant.conversions[goalName] = (variant.conversions[goalName] || 0) + 1;
      }
    });
    
    // Calculate conversion rates
    Object.keys(results.variants).forEach(variantId => {
      const variant = results.variants[variantId];
      Object.keys(variant.conversions).forEach(goalName => {
        variant.conversionRates[goalName] = variant.conversions[goalName] / variant.assignments;
      });
    });
    
    return results;
  }

  // Configuration
  setAnalyticsConsent(enabled: boolean): void {
    this.analyticsEnabled = enabled;
    localStorage.setItem('analyticsConsent', enabled.toString());
    
    if (enabled) {
      this.trackEvent('analytics_consent_granted', {});
    } else {
      this.trackEvent('analytics_consent_revoked', {});
    }
  }

  getAnalyticsConsent(): boolean {
    const consent = localStorage.getItem('analyticsConsent');
    return consent !== null ? consent === 'true' : false;
  }

  // Helper Methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeEventData(data: Record<string, any>): Record<string, any> {
    // Remove PII and sensitive data
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'ssn', 'creditcard'];
    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  private async storeAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    // Store in IndexedDB (using object store would be added to IndexedDBService)
    // For now, using localStorage as fallback
    const events = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
    events.push(event);
    
    // Keep only last 1000 events to prevent storage bloat
    if (events.length > 1000) {
      events.splice(0, events.length - 1000);
    }
    
    localStorage.setItem('analyticsEvents', JSON.stringify(events));
  }

  private async getAnalyticsEvents(startDate: string, endDate: string): Promise<AnalyticsEvent[]> {
    const events = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
    return events.filter((event: AnalyticsEvent) => 
      event.timestamp >= startDate && event.timestamp <= endDate
    );
  }

  private async loadABTests(): Promise<void> {
    // In a real implementation, this would load from a configuration service
    // For now, using hardcoded test configs
    const defaultTests: ABTestConfig[] = [
      {
        id: 'wizard_ui_v2',
        name: 'Goal Wizard UI Version 2',
        description: 'Test new wizard UI design',
        enabled: true,
        startDate: new Date().toISOString(),
        variants: [
          { id: 'control', name: 'Current UI', weight: 0.5, config: { uiVersion: 'v1' } },
          { id: 'treatment', name: 'New UI', weight: 0.5, config: { uiVersion: 'v2' } }
        ],
        trafficAllocation: 0.2,
        conversionGoals: ['wizard_complete', 'goal_create']
      }
    ];
    
    defaultTests.forEach(test => {
      this.abTestsCache.set(test.id, test);
    });
  }

  private selectVariantByWeight(variants: ABTestVariant[]): ABTestVariant | null {
    const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const variant of variants) {
      currentWeight += variant.weight;
      if (random <= currentWeight) {
        return variant;
      }
    }
    
    return variants[0] || null;
  }

  private async getABTestAssignment(testId: string): Promise<ABTestAssignment | null> {
    const assignments = JSON.parse(localStorage.getItem('abTestAssignments') || '[]');
    return assignments.find((a: ABTestAssignment) => a.testId === testId && a.userId === this.userId) || null;
  }

  private async assignABTestVariant(testId: string, variantId: string): Promise<void> {
    const assignments = JSON.parse(localStorage.getItem('abTestAssignments') || '[]');
    const assignment: ABTestAssignment = {
      userId: this.userId,
      testId,
      variantId,
      assignedAt: new Date().toISOString()
    };
    assignments.push(assignment);
    localStorage.setItem('abTestAssignments', JSON.stringify(assignments));
  }

  private async getABTestAssignments(testId: string): Promise<ABTestAssignment[]> {
    const assignments = JSON.parse(localStorage.getItem('abTestAssignments') || '[]');
    return assignments.filter((a: ABTestAssignment) => a.testId === testId);
  }

  private async getABTestConversions(testId: string): Promise<AnalyticsEvent[]> {
    const events = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
    return events.filter((e: AnalyticsEvent) => 
      e.eventType === 'ab_test_conversion' && e.data.testId === testId
    );
  }

  // Analytics Calculation Methods
  private groupEventsBySessions(events: AnalyticsEvent[]): AnalyticsEvent[][] {
    const sessions: Record<string, AnalyticsEvent[]> = {};
    events.forEach(event => {
      if (!sessions[event.sessionId]) {
        sessions[event.sessionId] = [];
      }
      sessions[event.sessionId].push(event);
    });
    return Object.values(sessions);
  }

  private calculateAvgSessionDuration(sessions: AnalyticsEvent[][]): number {
    if (sessions.length === 0) return 0;
    
    const durations = sessions.map(session => {
      if (session.length < 2) return 0;
      const sorted = session.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const start = new Date(sorted[0].timestamp).getTime();
      const end = new Date(sorted[sorted.length - 1].timestamp).getTime();
      return end - start;
    });
    
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }

  private calculateWizardStartRate(journeyEvents: AnalyticsEvent[]): number {
    const totalSessions = new Set(journeyEvents.map(e => e.sessionId)).size;
    const wizardStarts = journeyEvents.filter(e => e.data.eventType === 'wizard_start').length;
    return totalSessions > 0 ? wizardStarts / totalSessions : 0;
  }

  private calculateWizardCompletionRate(journeyEvents: AnalyticsEvent[]): number {
    const starts = journeyEvents.filter(e => e.data.eventType === 'wizard_start').length;
    const completions = journeyEvents.filter(e => e.data.eventType === 'wizard_complete').length;
    return starts > 0 ? completions / starts : 0;
  }

  private calculateStepAbandonmentRates(journeyEvents: AnalyticsEvent[]): Record<string, number> {
    const stepCounts: Record<string, number> = {};
    journeyEvents.forEach(event => {
      const step = event.data.step;
      if (step) {
        stepCounts[step] = (stepCounts[step] || 0) + 1;
      }
    });
    
    // Calculate abandonment rates (simplified)
    const abandonmentRates: Record<string, number> = {};
    Object.keys(stepCounts).forEach(step => {
      // This is a simplified calculation - in reality you'd track step progressions
      abandonmentRates[step] = Math.random() * 0.1; // Placeholder
    });
    
    return abandonmentRates;
  }

  private calculateFeatureUsageRates(events: AnalyticsEvent[]): Record<string, number> {
    const featureEvents = events.filter(e => e.eventType === 'feature_use');
    const features: Record<string, number> = {};
    
    featureEvents.forEach(event => {
      const feature = event.data.feature;
      if (feature) {
        features[feature] = (features[feature] || 0) + 1;
      }
    });
    
    return features;
  }

  private calculateErrorRates(events: AnalyticsEvent[]): Record<string, number> {
    const errorEvents = events.filter(e => e.eventType === 'error');
    const errors: Record<string, number> = {};
    
    errorEvents.forEach(event => {
      const errorType = event.data.errorMessage || 'unknown';
      errors[errorType] = (errors[errorType] || 0) + 1;
    });
    
    return errors;
  }

  private calculateTimeToComplete(journeyEvents: AnalyticsEvent[]): { avg: number; median: number; p95: number } {
    const completionTimes: number[] = [];
    
    // Group by session and calculate completion times
    const sessions = this.groupEventsBySessions(journeyEvents);
    sessions.forEach(session => {
      const start = session.find(e => e.data.eventType === 'wizard_start');
      const complete = session.find(e => e.data.eventType === 'wizard_complete');
      
      if (start && complete) {
        const duration = new Date(complete.timestamp).getTime() - new Date(start.timestamp).getTime();
        completionTimes.push(duration);
      }
    });
    
    if (completionTimes.length === 0) {
      return { avg: 0, median: 0, p95: 0 };
    }
    
    const sorted = completionTimes.sort((a, b) => a - b);
    const avg = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    
    return { avg, median, p95 };
  }
} 