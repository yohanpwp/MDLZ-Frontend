import { useState } from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

const Tooltip = ({ children, content, side = 'right', className }) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!content) return children;

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={cn(
          "absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap",
          "pointer-events-none",
          side === 'right' && "left-full top-1/2 transform -translate-y-1/2 ml-2",
          side === 'left' && "right-full top-1/2 transform -translate-y-1/2 mr-2",
          side === 'top' && "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
          side === 'bottom' && "top-full left-1/2 transform -translate-x-1/2 mt-2",
          className
        )}>
          {content}
          {/* Arrow */}
          <div className={cn(
            "absolute w-2 h-2 bg-gray-900 transform rotate-45",
            side === 'right' && "-left-1 top-1/2 -translate-y-1/2",
            side === 'left' && "-right-1 top-1/2 -translate-y-1/2",
            side === 'top' && "-bottom-1 left-1/2 -translate-x-1/2",
            side === 'bottom' && "-top-1 left-1/2 -translate-x-1/2"
          )} />
        </div>
      )}
    </div>
  );
};

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  content: PropTypes.string,
  side: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
  className: PropTypes.string,
};

export default Tooltip;