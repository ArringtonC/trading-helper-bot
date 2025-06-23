import React, { useState, useRef, useEffect, useCallback } from 'react';

interface PopoverProps {
  content: React.ReactNode;
  children: React.ReactElement;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  offset?: number;
  trigger?: 'click' | 'hover';
  isOpen?: boolean;
  onClose?: () => void;
  clickable?: boolean;
  arrow?: boolean;
}

const Popover: React.FC<PopoverProps> = ({
  content,
  children,
  title,
  position = 'bottom',
  className = '',
  offset = 12,
  trigger = 'click',
  isOpen: controlledIsOpen,
  onClose,
  clickable = false,
  arrow = true,
}) => {
  const [internalIsVisible, setInternalIsVisible] = useState(false);
  const popoverPosition = useRef({ top: 0, left: 0 });
  const childRef = useRef<HTMLElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const ARROW_SIZE = 8;

  const isControlled = typeof controlledIsOpen === 'boolean';
  const isVisible = isControlled ? controlledIsOpen : internalIsVisible;

  const closePopover = useCallback(() => {
    if (onClose) {
      onClose();
    }
    if (!isControlled) {
      setInternalIsVisible(false);
    }
  }, [onClose, isControlled]);

  const updatePosition = useCallback(() => {
    if (!childRef.current || !popoverRef.current) return;

    const childRect = childRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = childRect.top - popoverRect.height - offset;
        left = childRect.left + childRect.width / 2 - popoverRect.width / 2;
        break;
      case 'bottom':
        top = childRect.bottom + offset;
        left = childRect.left + childRect.width / 2 - popoverRect.width / 2;
        break;
      case 'left':
        top = childRect.top + childRect.height / 2 - popoverRect.height / 2;
        left = childRect.left - popoverRect.width - offset;
        break;
      case 'right':
        top = childRect.top + childRect.height / 2 - popoverRect.height / 2;
        left = childRect.right + offset;
        break;
    }

    top += window.scrollY;
    left += window.scrollX;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight + window.scrollY;

    if (left < ARROW_SIZE) left = ARROW_SIZE;
    if (top < ARROW_SIZE + window.scrollY) top = ARROW_SIZE + window.scrollY;

    if (left + popoverRect.width > viewportWidth - ARROW_SIZE) {
      left = viewportWidth - popoverRect.width - ARROW_SIZE;
    }
    if (top + popoverRect.height > viewportHeight - ARROW_SIZE) {
        if (position === 'bottom' || position === 'top') { 
            if (childRect.top - popoverRect.height - offset + window.scrollY > ARROW_SIZE + window.scrollY) {
                top = childRect.top - popoverRect.height - offset + window.scrollY;
            } else { 
                 top = viewportHeight - popoverRect.height - ARROW_SIZE;
            }
        } else { 
             top = viewportHeight - popoverRect.height - ARROW_SIZE;
        }
    }

    popoverPosition.current = { top, left };
    if (popoverRef.current) {
        popoverRef.current.style.top = `${top}px`;
        popoverRef.current.style.left = `${left}px`;
    }

  }, [position, offset, ARROW_SIZE]);

  useEffect(() => {
    if (isVisible && (childRef.current || !children)) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, updatePosition, children]);

  const handleTriggerInteraction = (e: React.MouseEvent | React.FocusEvent) => {
    if (isControlled) return;
    e.stopPropagation();
    
    if (trigger === 'click') {
        setInternalIsVisible(prev => !prev);
    } else if (trigger === 'hover') {
        // For hover, onMouseEnter sets true, onMouseLeave sets false
        // This specific handler might be more for click if we combine logic
    }
  };
  
  const handleMouseEnter = () => {
    if (isControlled || trigger !== 'hover') return;
    setInternalIsVisible(true);
  };

  const handleMouseLeave = () => {
    if (isControlled || trigger !== 'hover') return;
    setInternalIsVisible(false);
  };

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        isVisible &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        (!childRef.current || !childRef.current.contains(event.target as Node)) &&
        !clickable
      ) {
        closePopover();
      }
    },
    [closePopover, clickable, isVisible]
  );

  const handleEscapeKey = useCallback(
    (event: KeyboardEvent) => {
      if (isVisible && event.key === 'Escape') {
        closePopover();
      }
    },
    [closePopover, isVisible]
  );

  useEffect(() => {
    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isVisible, handleClickOutside, handleEscapeKey]);

  const childrenProps: any = {
    ref: childRef,
    'aria-haspopup': 'dialog',
    'aria-expanded': isVisible,
  };

  if (!isControlled) {
    if (trigger === 'click') {
      childrenProps.onClick = handleTriggerInteraction;
    } else if (trigger === 'hover') {
      childrenProps.onMouseEnter = handleMouseEnter;
      childrenProps.onMouseLeave = handleMouseLeave;
      childrenProps.onFocus = handleMouseEnter;
      childrenProps.onBlur = handleMouseLeave;
    }
  }

  const childrenWithProps = children ? React.cloneElement(children, childrenProps) : null;

  const getArrowStyles = useCallback(() => {
    const styles: React.CSSProperties = {
        position: 'absolute',
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderWidth: `${ARROW_SIZE}px`,
    };
    const popoverRect = popoverRef.current?.getBoundingClientRect();

    if (!popoverRect) return styles;

    const arrowHalf = ARROW_SIZE;

    switch (position) {
        case 'top':
            styles.borderColor = '#fff transparent transparent transparent';
            styles.top = '100%';
            styles.left = `${popoverRect.width / 2 - arrowHalf}px`;
            break;
        case 'bottom':
            styles.borderColor = 'transparent transparent #fff transparent';
            styles.bottom = '100%';
            styles.left = `${popoverRect.width / 2 - arrowHalf}px`;
            break;
        case 'left':
            styles.borderColor = 'transparent transparent transparent #fff';
            styles.left = '100%';
            styles.top = `${popoverRect.height / 2 - arrowHalf}px`;
            break;
        case 'right':
            styles.borderColor = 'transparent #fff transparent transparent';
            styles.right = '100%';
            styles.top = `${popoverRect.height / 2 - arrowHalf}px`;
            break;
    }
    return styles;
  }, [position, ARROW_SIZE]);

  const renderPopover = () => (
    <div
        ref={popoverRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby={title ? 'popover-title' : undefined}
        style={{
          position: 'absolute',
          top: `${popoverPosition.current.top}px`,
          left: `${popoverPosition.current.left}px`,
          zIndex: 1050,
          visibility: isVisible ? 'visible' : 'hidden',
        }}
        className={`bg-white border border-gray-300 rounded-lg shadow-xl p-4 min-w-[200px] max-w-xs ${className}`}
      >
        {arrow && <div style={getArrowStyles()} data-testid="popover-arrow" />}
        {title && (
          <h3 id="popover-title" className="text-lg font-semibold mb-2 border-b pb-2">
            {title}
          </h3>
        )}
        <button
          onClick={closePopover}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl leading-none"
          aria-label="Close popover"
        >
          &times;
        </button>
        <div className="text-sm text-gray-700">
            {content}
        </div>
      </div>
  );

  if (!childrenWithProps && isControlled && isVisible) {
    return renderPopover();
  }

  return (
    <>
      {childrenWithProps}
      {isVisible && renderPopover()}
    </>
  );
};

export default Popover; 