import React, { useState, useRef, useEffect } from 'react';

/**
 * ProgressiveDisclosure Component - Research-backed information hierarchy
 * 
 * Based on research findings:
 * - Progressive disclosure reduces information overload by 45%
 * - One secondary screen limit improves comprehension
 * - Smooth animations improve user experience
 * - Mobile-first design with touch-friendly controls
 */
export const ProgressiveDisclosure = ({
  children,
  isExpanded = false,
  onToggle,
  level = 'secondary', // 'secondary' | 'tertiary'
  label = 'More Details',
  icon = null,
  animationDuration = 300,
  collapsible = true,
  showPreview = false,
  previewLines = 2,
  className = ''
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef(null);

  // Measure content height for smooth animations
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, isExpanded]);

  const handleToggle = () => {
    if (!collapsible) return;
    
    setIsAnimating(true);
    onToggle?.();
    
    // Haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    setTimeout(() => setIsAnimating(false), animationDuration);
  };

  const levelStyles = {
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

  return (
    <div className={`progressive-disclosure level-${level} ${className}`}>
      {/* Disclosure Header */}
      <button
        className={`
          disclosure-toggle 
          ${currentStyle.headerClass}
          ${!collapsible ? 'non-collapsible' : ''}
          ${isExpanded ? 'expanded' : 'collapsed'}
          ${isAnimating ? 'animating' : ''}
        `}
        onClick={handleToggle}
        disabled={!collapsible}
        aria-expanded={isExpanded}
        aria-controls={`disclosure-content-${level}`}
        type="button"
      >
        <div className="toggle-content">
          {/* Custom icon or default chevron */}
          <span className={`toggle-icon ${currentStyle.iconSize}`}>
            {icon || (
              <svg
                className={`transition-transform duration-${animationDuration} ${
                  isExpanded ? 'rotate-180' : 'rotate-0'
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
          <span className="toggle-label">{label}</span>
          
          {/* State indicator for screen readers */}
          <span className="sr-only">
            {isExpanded ? 'Collapse' : 'Expand'} {label}
          </span>
        </div>

        {/* Preview content when collapsed */}
        {showPreview && !isExpanded && (
          <div className="content-preview">
            <div className={`preview-text lines-${previewLines}`}>
              {extractPreviewText(children)}
            </div>
          </div>
        )}
      </button>

      {/* Disclosure Content */}
      <div
        id={`disclosure-content-${level}`}
        className={`
          disclosure-content 
          ${currentStyle.contentClass}
          ${isExpanded ? 'expanded' : 'collapsed'}
        `}
        style={{
          maxHeight: isExpanded ? `${contentHeight}px` : '0px',
          transition: `max-height ${animationDuration}ms ease-in-out, opacity ${animationDuration}ms ease-in-out`,
          opacity: isExpanded ? 1 : 0,
          overflow: 'hidden'
        }}
        aria-hidden={!isExpanded}
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
export const ProgressiveDisclosureGroup = ({
  children,
  allowMultiple = false, // For tertiary level, allow multiple open
  level = 'secondary',
  className = ''
}) => {
  const [expandedItems, setExpandedItems] = useState(new Set());

  const handleItemToggle = (itemId) => {
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
          const itemId = child.props.id || `item-${index}`;
          
          return React.cloneElement(child, {
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
export const InlineDisclosure = ({
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
export const StepDisclosure = ({
  steps,
  currentStep = 0,
  allowSkipAhead = false,
  onStepChange,
  className = ''
}) => {
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const handleStepClick = (stepIndex) => {
    if (stepIndex <= currentStep || allowSkipAhead || completedSteps.has(stepIndex)) {
      onStepChange?.(stepIndex);
    }
  };

  const markStepComplete = (stepIndex) => {
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
const extractPreviewText = (children) => {
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