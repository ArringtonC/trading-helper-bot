import React, { useState, useRef, useEffect, ReactNode, ReactElement, MouseEvent } from 'react';

// Type definitions
type DisclosureLevel = 'secondary' | 'tertiary';

interface LevelStyle {
  headerClass: string;
  contentClass: string;
  iconSize: string;
}

interface ProgressiveDisclosureProps {
  children: ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
  level?: DisclosureLevel;
  label?: string;
  icon?: ReactNode;
  animationDuration?: number;
  collapsible?: boolean;
  showPreview?: boolean;
  previewLines?: number;
  className?: string;
  id?: string;
  title?: string;
  variant?: 'inline' | 'grouped' | 'default';
  defaultOpen?: boolean;
}

interface ProgressiveDisclosureGroupProps {
  children: ReactNode;
  allowMultiple?: boolean;
  level?: DisclosureLevel;
  className?: string;
}

interface InlineDisclosureProps {
  children: ReactNode;
  trigger?: string;
  maxLines?: number;
  className?: string;
}

interface Step {
  title: string;
  content: ReactNode;
  onComplete?: (index: number) => void;
}

interface StepDisclosureProps {
  steps: Step[];
  currentStep?: number;
  allowSkipAhead?: boolean;
  onStepChange?: (stepIndex: number) => void;
  className?: string;
}

/**
 * ProgressiveDisclosure Component - Research-backed information hierarchy
 * 
 * Based on research findings:
 * - Progressive disclosure reduces information overload by 45%
 * - One secondary screen limit improves comprehension
 * - Smooth animations improve user experience
 * - Mobile-first design with touch-friendly controls
 */
export const ProgressiveDisclosure: React.FC<ProgressiveDisclosureProps> = ({
  children,
  isExpanded = false,
  onToggle,
  level = 'secondary',
  label = 'More Details',
  icon = null,
  animationDuration = 300,
  collapsible = true,
  showPreview = false,
  previewLines = 2,
  className = '',
  id,
  title,
  variant = 'default',
  defaultOpen = false
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [internalExpanded, setInternalExpanded] = useState(defaultOpen);

  // Use internal state if no external control provided
  const expanded = onToggle ? isExpanded : internalExpanded;

  // Measure content height for smooth animations
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, expanded]);

  const handleToggle = (): void => {
    if (!collapsible) return;
    
    setIsAnimating(true);
    
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
    
    // Haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    setTimeout(() => setIsAnimating(false), animationDuration);
  };

  const levelStyles: Record<DisclosureLevel, LevelStyle> = {
    secondary: {
      headerClass: 'disclosure-header-secondary',
      contentClass: 'disclosure-content-secondary',
      iconSize: 'w-5 h-5'
    },
    tertiary: {
      headerClass: 'disclosure-header-tertiary', 
      contentClass: 'disclosure-content-tertiary',
      iconSize: 'w-4 h-4'
    }
  };

  const currentStyle = levelStyles[level];
  const displayLabel = title || label;
  const contentId = id ? `disclosure-content-${id}` : `disclosure-content-${level}`;

  return (
    <div className={`progressive-disclosure level-${level} variant-${variant} ${className}`}>
      {/* Disclosure Header */}
      <button
        className={`
          disclosure-toggle 
          ${currentStyle.headerClass}
          ${!collapsible ? 'non-collapsible' : ''}
          ${expanded ? 'expanded' : 'collapsed'}
          ${isAnimating ? 'animating' : ''}
        `}
        onClick={handleToggle}
        disabled={!collapsible}
        aria-expanded={expanded}
        aria-controls={contentId}
        type="button"
      >
        <div className="toggle-content">
          {/* Custom icon or default chevron */}
          <span className={`toggle-icon ${currentStyle.iconSize}`}>
            {icon || (
              <svg
                className={`transition-transform duration-${animationDuration} ${
                  expanded ? 'rotate-180' : 'rotate-0'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 9l-7 7-7-7" 
                />
              </svg>
            )}
          </span>
          
          {/* Label */}
          <span className="toggle-label">{displayLabel}</span>
          
          {/* State indicator for screen readers */}
          <span className="sr-only">
            {expanded ? 'Collapse' : 'Expand'} {displayLabel}
          </span>
        </div>

        {/* Preview content when collapsed */}
        {showPreview && !expanded && (
          <div className="content-preview">
            <div className={`preview-text lines-${previewLines}`}>
              {extractPreviewText(children)}
            </div>
          </div>
        )}
      </button>

      {/* Disclosure Content */}
      <div
        id={contentId}
        className={`
          disclosure-content 
          ${currentStyle.contentClass}
          ${expanded ? 'expanded' : 'collapsed'}
        `}
        style={{
          maxHeight: expanded ? `${contentHeight}px` : '0px',
          transition: `max-height ${animationDuration}ms ease-in-out, opacity ${animationDuration}ms ease-in-out`,
          opacity: expanded ? 1 : 0,
          overflow: 'hidden'
        }}
        aria-hidden={!expanded}
      >
        <div 
          ref={contentRef}
          className="disclosure-inner-content"
        >
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * ProgressiveDisclosureGroup - Manages multiple disclosure sections
 * Implements research finding: "one secondary screen limit"
 */
export const ProgressiveDisclosureGroup: React.FC<ProgressiveDisclosureGroupProps> = ({
  children,
  allowMultiple = false, // For tertiary level, allow multiple open
  level = 'secondary',
  className = ''
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleItemToggle = (itemId: string): void => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        if (!allowMultiple && level === 'secondary') {
          // One secondary screen limit - close others
          newSet.clear();
        }
        newSet.add(itemId);
      }
      
      return newSet;
    });
  };

  return (
    <div className={`progressive-disclosure-group level-${level} ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && child.type === ProgressiveDisclosure) {
          const itemId = (child.props as ProgressiveDisclosureProps).id || `item-${index}`;
          
          return React.cloneElement(child as ReactElement<ProgressiveDisclosureProps>, {
            isExpanded: expandedItems.has(itemId),
            onToggle: () => handleItemToggle(itemId),
            key: itemId
          });
        }
        return child;
      })}
    </div>
  );
};

/**
 * InlineDisclosure - Compact version for text-based progressive disclosure
 */
export const InlineDisclosure: React.FC<InlineDisclosureProps> = ({
  children,
  trigger,
  maxLines = 3,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`inline-disclosure ${className}`}>
      <div className={`content ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div 
          className={`text-content ${!isExpanded ? `line-clamp-${maxLines}` : ''}`}
        >
          {children}
        </div>
      </div>
      
      <button
        className="inline-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        {isExpanded ? 'Show Less' : (trigger || 'Show More')}
      </button>
    </div>
  );
};

/**
 * StepDisclosure - For multi-step processes
 */
export const StepDisclosure: React.FC<StepDisclosureProps> = ({
  steps,
  currentStep = 0,
  allowSkipAhead = false,
  onStepChange,
  className = ''
}) => {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const handleStepClick = (stepIndex: number): void => {
    if (stepIndex <= currentStep || allowSkipAhead || completedSteps.has(stepIndex)) {
      onStepChange?.(stepIndex);
    }
  };

  const markStepComplete = (stepIndex: number): void => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
  };

  return (
    <div className={`step-disclosure ${className}`}>
      {steps.map((step, index) => {
        const isAccessible = index <= currentStep || allowSkipAhead || completedSteps.has(index);
        const isCompleted = completedSteps.has(index);
        const isCurrent = index === currentStep;

        return (
          <div 
            key={index}
            className={`
              step-item 
              ${isCurrent ? 'current' : ''} 
              ${isCompleted ? 'completed' : ''}
              ${isAccessible ? 'accessible' : 'locked'}
            `}
          >
            <button
              className="step-header"
              onClick={() => handleStepClick(index)}
              disabled={!isAccessible}
              aria-expanded={isCurrent}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-title">{step.title}</span>
              <span className="step-status">
                {isCompleted ? '✓' : isCurrent ? '→' : '○'}
              </span>
            </button>
            
            {isCurrent && (
              <div className="step-content">
                {step.content}
                {step.onComplete && (
                  <button
                    className="complete-step-btn"
                    onClick={() => {
                      markStepComplete(index);
                      step.onComplete?.(index);
                    }}
                  >
                    Complete Step
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Helper function to extract preview text from React children
const extractPreviewText = (children: ReactNode): string => {
  if (typeof children === 'string') return children;
  if (React.isValidElement(children)) {
    return extractPreviewText(children.props.children);
  }
  if (Array.isArray(children)) {
    return children.map(extractPreviewText).join(' ');
  }
  return '';
};

export default ProgressiveDisclosure;