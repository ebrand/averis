import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const CollapsibleSection = ({ 
  title, 
  children, 
  defaultOpen = false,
  stats = null,
  completionPercentage = null,
  className = "",
  variant = "default" // 'default', 'compact', 'card'
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return {
          container: 'border border-gray-200 dark:border-gray-700 rounded-lg',
          header: 'px-4 py-3 bg-gray-50 dark:bg-gray-800',
          content: 'px-4 py-3'
        };
      case 'card':
        return {
          container: 'bg-white dark:bg-gray-800 shadow rounded-lg',
          header: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700',
          content: 'px-6 py-4'
        };
      default:
        return {
          container: 'bg-white dark:bg-gray-800 shadow rounded-lg',
          header: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700',
          content: 'px-6 py-6'
        };
    }
  };

  const variantClasses = getVariantClasses();

  return (
    <div className={`${variantClasses.container} ${className}`}>
      {/* Header with toggle */}
      <div 
        className={`${variantClasses.header} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
        onClick={toggleOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Chevron icon */}
            <div className="flex-shrink-0">
              {isOpen ? (
                <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              )}
            </div>
            
            {/* Title */}
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
          
          {/* Right side: Stats badges and Progress bar */}
          <div className="flex items-center space-x-4">
            {/* Stats badges */}
            {stats && (
              <div className="flex items-center space-x-2">
                {Array.isArray(stats) ? (
                  stats.map((stat, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                    >
                      {stat}
                    </span>
                  ))
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                    {stats}
                  </span>
                )}
              </div>
            )}
            
            {/* Progress bar */}
            {completionPercentage !== null && (
              <div className="flex items-center space-x-2">
                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400 transition-all duration-300 ease-out"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 min-w-[2rem] text-right">
                  {completionPercentage}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible content */}
      {isOpen && (
        <div className={variantClasses.content}>
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;