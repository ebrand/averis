import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const CollapsibleSection = ({ 
  title, 
  children, 
  defaultOpen = false,
  stats = null,
  className = "",
  headerClassName = ""
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <button
        onClick={toggleOpen}
        className={`w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between ${headerClassName}`}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {isOpen ? (
              <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-gray-500" />
            )}
          </div>
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          {stats && (
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              {typeof stats === 'string' ? (
                <span className="bg-gray-200 px-2 py-1 rounded-full">{stats}</span>
              ) : (
                stats.map((stat, index) => (
                  <span key={index} className="bg-gray-200 px-2 py-1 rounded-full">
                    {stat}
                  </span>
                ))
              )}
            </div>
          )}
        </div>
      </button>
      
      {isOpen && (
        <div className="px-4 py-3 bg-white border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;