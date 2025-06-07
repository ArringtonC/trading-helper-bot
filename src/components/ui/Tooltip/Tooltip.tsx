import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  offset?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
  offset = 8, // 8px default offset
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const childRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (childRef.current) {
      const childRect = childRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = childRect.top - (tooltipRect?.height || 0) - offset;
          left = childRect.left + childRect.width / 2 - (tooltipRect?.width || 0) / 2;
          break;
        case 'bottom':
          top = childRect.bottom + offset;
          left = childRect.left + childRect.width / 2 - (tooltipRect?.width || 0) / 2;
          break;
        case 'left':
          top = childRect.top + childRect.height / 2 - (tooltipRect?.height || 0) / 2;
          left = childRect.left - (tooltipRect?.width || 0) - offset;
          break;
        case 'right':
          top = childRect.top + childRect.height / 2 - (tooltipRect?.height || 0) / 2;
          left = childRect.right + offset;
          break;
      }
      // Adjust for scroll position
      top += window.scrollY;
      left += window.scrollX;

      setTooltipPosition({ top, left });
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };
  
  // Attach refs
  const isDOMElement = typeof children.type === 'string';
  const childrenWithRef = React.isValidElement(children)
    ? React.cloneElement(children, {
        ...(isDOMElement ? { ref: childRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
          onFocus: handleMouseEnter,
          onBlur: handleMouseLeave } : {}),
      })
    : children;

  // Re-calculate position if content changes and tooltip is visible
  useEffect(() => {
    if (isVisible && childRef.current && tooltipRef.current) {
         const childRect = childRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = childRect.top - tooltipRect.height - offset;
          left = childRect.left + childRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'bottom':
          top = childRect.bottom + offset;
          left = childRect.left + childRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'left':
          top = childRect.top + childRect.height / 2 - tooltipRect.height / 2;
          left = childRect.left - tooltipRect.width - offset;
          break;
        case 'right':
          top = childRect.top + childRect.height / 2 - tooltipRect.height / 2;
          left = childRect.right + offset;
          break;
      }
      top += window.scrollY;
      left += window.scrollX;
      
      // Boundary detection (simple version, can be expanded)
      if (left < 0) left = offset;
      if (top < 0) top = offset;
      if (tooltipRect && left + tooltipRect.width > window.innerWidth) {
        left = window.innerWidth - tooltipRect.width - offset;
      }
      if (tooltipRect && top + tooltipRect.height > window.innerHeight + window.scrollY) {
         // If it overflows bottom, try to reposition to top if original position was bottom
        if (position === 'bottom') {
            top = childRect.top - tooltipRect.height - offset + window.scrollY;
        } else {
            // For other positions, just cap it at the bottom of the viewport
             top = window.innerHeight + window.scrollY - tooltipRect.height - offset;
        }
      }


      setTooltipPosition({ top, left });
    }
  }, [isVisible, content, position, offset]);


  return (
    <>
      {childrenWithRef}
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          style={{
            position: 'absolute',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            zIndex: 1000, // Ensure tooltip is on top
          }}
          className={`bg-gray-800 text-white text-sm p-2 rounded shadow-lg ${className}`}
        >
          {content}
        </div>
      )}
    </>
  );
};

export default Tooltip; 