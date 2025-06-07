import React, { useState, useEffect } from 'react';
import { useGoalSizing } from '../../context/GoalSizingContext';
import { DatabaseService } from '../../services/DatabaseService';
import { Card } from '../ui/Card';
import { Button } from '../ui/button';
import { Alert } from '../ui/alert';

interface FeedbackData {
  id: string;
  userId: string;
  type: 'goal_effectiveness' | 'wizard_experience' | 'feature_suggestion' | 'general';
  rating: number; // 1-5 scale
  category: string;
  subject: string;
  message: string;
  touchpoint: string; // Where the feedback was collected
  goalId?: string;
  context?: any; // Additional context data
  createdAt: string;
  status: 'new' | 'reviewed' | 'implemented' | 'declined';
}

interface FeedbackSummary {
  totalFeedback: number;
  averageRating: number;
  categoryBreakdown: Record<string, number>;
  recentTrends: Array<{
    date: string;
    rating: number;
    count: number;
  }>;
}

interface FeedbackCollectionProps {
  triggerPoint: 'goal_completion' | 'wizard_exit' | 'dashboard_view' | 'manual';
  goalId?: string;
  context?: any;
  onFeedbackSubmitted?: (feedback: FeedbackData) => void;
  className?: string;
}

const FEEDBACK_CATEGORIES = [
  'Goal Setting Experience',
  'Wizard Usability',
  'Data Analysis Quality',
  'Performance Tracking',
  'Feature Request',
  'Bug Report',
  'General Improvement'
];

const TOUCHPOINTS = {
  goal_completion: 'After Goal Achievement',
  wizard_exit: 'Goal Wizard Completion',
  dashboard_view: 'Analytics Dashboard',
  manual: 'User-Initiated Feedback'
};

export const FeedbackCollection: React.FC<FeedbackCollectionProps> = ({
  triggerPoint,
  goalId,
  context,
  onFeedbackSubmitted,
  className = ''
}) => {
  const { config } = useGoalSizing();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [feedbackForm, setFeedbackForm] = useState({
    type: 'general' as FeedbackData['type'],
    rating: 5,
    category: '',
    subject: '',
    message: ''
  });

  // Auto-trigger feedback collection based on certain conditions
  useEffect(() => {
    const shouldAutoTrigger = () => {
      // Auto-trigger after goal completion
      if (triggerPoint === 'goal_completion') {
        return true;
      }
      
      // Auto-trigger after wizard completion for first-time users
      if (triggerPoint === 'wizard_exit' && !localStorage.getItem('feedbackCollected')) {
        return true;
      }
      
      // Auto-trigger periodically for dashboard users (weekly)
      if (triggerPoint === 'dashboard_view') {
        const lastFeedbackDate = localStorage.getItem('lastFeedbackDate');
        if (!lastFeedbackDate) return true;
        
        const daysSinceLastFeedback = Math.floor(
          (Date.now() - new Date(lastFeedbackDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceLastFeedback >= 7;
      }
      
      return false;
    };

    if (shouldAutoTrigger()) {
      // Delay to avoid interrupting user flow
      const timer = setTimeout(() => setIsOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [triggerPoint]);

  const handleSubmitFeedback = async () => {
    if (!feedbackForm.category || !feedbackForm.subject || !feedbackForm.message) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const feedback: FeedbackData = {
        id: generateFeedbackId(),
        userId: 'default', // In real app, get from auth context
        type: feedbackForm.type,
        rating: feedbackForm.rating,
        category: feedbackForm.category,
        subject: feedbackForm.subject,
        message: feedbackForm.message,
        touchpoint: TOUCHPOINTS[triggerPoint],
        goalId,
        context: {
          ...context,
          currentGoalType: config?.goalType,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        status: 'new'
      };

      // Store feedback in database
      await storeFeedback(feedback);

      // Mark feedback as collected
      localStorage.setItem('feedbackCollected', 'true');
      localStorage.setItem('lastFeedbackDate', new Date().toISOString());

      setSuccess(true);
      setIsOpen(false);

      // Notify parent component
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(feedback);
      }

      // Reset form
      setFeedbackForm({
        type: 'general',
        rating: 5,
        category: '',
        subject: '',
        message: ''
      });

    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateFeedbackId = (): string => {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const storeFeedback = async (feedback: FeedbackData): Promise<void> => {
    try {
      // Import and initialize IndexedDBService
      const { IndexedDBService } = await import('../../services/IndexedDBService');
      const indexedDBService = new IndexedDBService();
      await indexedDBService.init();

      // Store in IndexedDB for web persistence
      await indexedDBService.saveUserContext('default', `feedback_${feedback.id}`, feedback);

      // Also store in localStorage as backup
      const existingFeedback = JSON.parse(localStorage.getItem('userFeedback') || '[]');
      existingFeedback.push(feedback);
      localStorage.setItem('userFeedback', JSON.stringify(existingFeedback));

    } catch (error) {
      console.error('Error storing feedback:', error);
      throw error;
    }
  };

  const renderFeedbackForm = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Share Your Feedback</h3>
        <p className="text-sm text-gray-600 mb-4">
          Help us improve your goal-setting and trading analysis experience.
        </p>
      </div>

      {/* Feedback Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Feedback Type
        </label>
        <select
          value={feedbackForm.type}
          onChange={(e) => setFeedbackForm(prev => ({ 
            ...prev, 
            type: e.target.value as FeedbackData['type'] 
          }))}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="general">General Feedback</option>
          <option value="goal_effectiveness">Goal Effectiveness</option>
          <option value="wizard_experience">Wizard Experience</option>
          <option value="feature_suggestion">Feature Suggestion</option>
        </select>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Overall Rating
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setFeedbackForm(prev => ({ ...prev, rating }))}
              className={`p-2 rounded-full ${
                feedbackForm.rating >= rating 
                  ? 'text-yellow-500' 
                  : 'text-gray-300'
              } hover:text-yellow-400 transition-colors`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <select
          value={feedbackForm.category}
          onChange={(e) => setFeedbackForm(prev => ({ ...prev, category: e.target.value }))}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Select Category</option>
          {FEEDBACK_CATEGORIES.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subject *
        </label>
        <input
          type="text"
          value={feedbackForm.subject}
          onChange={(e) => setFeedbackForm(prev => ({ ...prev, subject: e.target.value }))}
          placeholder="Brief summary of your feedback"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Detailed Feedback *
        </label>
        <textarea
          value={feedbackForm.message}
          onChange={(e) => setFeedbackForm(prev => ({ ...prev, message: e.target.value }))}
          placeholder="Please provide detailed feedback about your experience, suggestions for improvement, or any issues you encountered..."
          rows={4}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <div className="text-sm">{error}</div>
        </Alert>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleSubmitFeedback}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsOpen(false)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  const renderSuccessMessage = () => (
    <div className="text-center space-y-4">
      <div className="text-green-600 text-4xl">✓</div>
      <h3 className="text-lg font-semibold">Thank You!</h3>
      <p className="text-sm text-gray-600">
        Your feedback has been submitted successfully. We appreciate your input and will use it to improve your experience.
      </p>
      <Button
        onClick={() => setSuccess(false)}
        variant="outline"
      >
        Close
      </Button>
    </div>
  );

  // Manual trigger button
  const renderTriggerButton = () => {
    if (triggerPoint !== 'manual') return null;

    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className={className}
      >
        Provide Feedback
      </Button>
    );
  };

  if (!isOpen && triggerPoint === 'manual') {
    return renderTriggerButton();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white">
          <div className="p-6">
            {success ? renderSuccessMessage() : renderFeedbackForm()}
          </div>
        </Card>
      </div>

      {/* Manual trigger button when modal is closed */}
      {triggerPoint === 'manual' && renderTriggerButton()}
    </>
  );
};

// Feedback Summary Dashboard Component
export const FeedbackSummaryDashboard: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary | null>(null);
  const [recentFeedback, setRecentFeedback] = useState<FeedbackData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFeedbackSummary();
  }, []);

  const loadFeedbackSummary = async () => {
    try {
      setIsLoading(true);

      // Load feedback from localStorage
      const feedbackData: FeedbackData[] = JSON.parse(
        localStorage.getItem('userFeedback') || '[]'
      );

      if (feedbackData.length === 0) {
        setFeedbackSummary({
          totalFeedback: 0,
          averageRating: 0,
          categoryBreakdown: {},
          recentTrends: []
        });
        setRecentFeedback([]);
        return;
      }

      // Calculate summary metrics
      const totalFeedback = feedbackData.length;
      const averageRating = feedbackData.reduce((sum, f) => sum + f.rating, 0) / totalFeedback;
      
      const categoryBreakdown = feedbackData.reduce((acc, feedback) => {
        acc[feedback.category] = (acc[feedback.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Recent trends (last 30 days, grouped by week)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentFeedbackData = feedbackData.filter(
        f => new Date(f.createdAt) >= thirtyDaysAgo
      );

      const weeklyTrends = groupFeedbackByWeek(recentFeedbackData);

      setFeedbackSummary({
        totalFeedback,
        averageRating,
        categoryBreakdown,
        recentTrends: weeklyTrends
      });

      setRecentFeedback(feedbackData.slice(-5).reverse()); // Last 5 feedback items

    } catch (error) {
      console.error('Error loading feedback summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupFeedbackByWeek = (feedback: FeedbackData[]) => {
    const weeklyData = new Map<string, { ratings: number[]; count: number }>();

    feedback.forEach(f => {
      const date = new Date(f.createdAt);
      const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, { ratings: [], count: 0 });
      }

      const weekData = weeklyData.get(weekKey)!;
      weekData.ratings.push(f.rating);
      weekData.count++;
    });

    return Array.from(weeklyData.entries()).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString(),
      rating: data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length,
      count: data.count
    }));
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!feedbackSummary || feedbackSummary.totalFeedback === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">Feedback Summary</h3>
        <p className="text-gray-500">No feedback collected yet.</p>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Feedback Summary</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <div className="text-sm text-gray-500">Total Feedback</div>
          <div className="text-2xl font-bold">{feedbackSummary.totalFeedback}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Average Rating</div>
          <div className="text-2xl font-bold text-yellow-600">
            {feedbackSummary.averageRating.toFixed(1)} ★
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Categories</div>
          <div className="text-2xl font-bold">{Object.keys(feedbackSummary.categoryBreakdown).length}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Category Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(feedbackSummary.categoryBreakdown).map(([category, count]) => (
              <div key={category} className="flex justify-between text-sm">
                <span>{category}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Recent Feedback</h4>
          <div className="space-y-2">
            {recentFeedback.map((feedback) => (
              <div key={feedback.id} className="p-3 bg-gray-50 rounded text-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium">{feedback.subject}</span>
                  <span className="text-yellow-600">{'★'.repeat(feedback.rating)}</span>
                </div>
                <p className="text-gray-600 line-clamp-2">{feedback.message}</p>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(feedback.createdAt).toLocaleDateString()} • {feedback.category}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}; 