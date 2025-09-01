import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

const Tooltip = ({ children, content, side = 'right', className }) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  if (!content) return children;

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipEl = tooltipRef.current;
      const tooltipRect = tooltipEl.getBoundingClientRect();
      const offset = 8; // 8px gap

      let top = 0;
      let left = 0;

      switch (side) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - offset;
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + offset;
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'left':
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          left = triggerRect.left - tooltipRect.width - offset;
          break;
        case 'right':
        default:
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          left = triggerRect.right + offset;
          break;
      }

      tooltipEl.style.top = `${top + window.scrollY}px`;
      tooltipEl.style.left = `${left + window.scrollX}px`;
      tooltipEl.style.opacity = '1';
    }
  }, [isVisible, side, content]);

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          className={cn(
            "fixed z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap",
            "pointer-events-none transition-opacity opacity-0",
            className
          )}
        >
          {content}
          {/* Arrow */}
          <div className={cn(
            "absolute w-2 h-2 bg-gray-900 transform rotate-45",
            side === 'right' && "-left-1 top-1/2 -translate-y-1/2",
            side === 'left' && "-right-1 top-1/2 -translate-y-1/2",
            side === 'top' && "-bottom-1 left-1/2 -translate-x-1/2",
            side === 'bottom' && "-top-1 left-1/2 -translate-x-1/2"
          )} />
        </div>,
        document.body
      )}
    </>
  );
};

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  content: PropTypes.node,
  side: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
  className: PropTypes.string,
};

export default Tooltip;