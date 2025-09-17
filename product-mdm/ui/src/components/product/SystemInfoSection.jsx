import React, { useState } from 'react'
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  ServerIcon,
  ClockIcon,
  CogIcon
} from '@heroicons/react/24/outline'

const SystemInfoSection = ({ formData, onChange, errors, readOnly, allowStatusEdit = false }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not set'
    try {
      return new Date(dateString).toLocaleString()
    } catch (e) {
      return 'Invalid date'
    }
  }

  const sourceSystemOptions = [
    'product-mdm',
    'external-erp',
    'legacy-system',
    'manual-entry',
    'data-import'
  ]

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'gray' },
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'deprecated', label: 'Deprecated', color: 'yellow' },
    { value: 'archived', label: 'Archived', color: 'purple' }
  ]

  const getStatusColor = (status) => {
    const statusObj = statusOptions.find(s => s.value === status)
    return statusObj ? statusObj.color : 'gray'
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg mt-8">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center">
          <ServerIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
          <div className="text-left">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">System Information</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Technical metadata and synchronization details</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Status Badge */}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            getStatusColor(formData.status) === 'green' ? 'bg-green-100 text-green-800' :
            getStatusColor(formData.status) === 'red' ? 'bg-red-100 text-red-800' :
            getStatusColor(formData.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
            getStatusColor(formData.status) === 'purple' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {statusOptions.find(s => s.value === formData.status)?.label || formData.status}
          </span>
          
          {isExpanded ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-6 space-y-8">
          {/* Product Status & Lifecycle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Product Status
              </label>
              <select
                id="status"
                value={formData.status || 'draft'}
                onChange={(e) => onChange('status', e.target.value)}
                disabled={readOnly && !allowStatusEdit}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 ${
                  (readOnly && !allowStatusEdit) ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                } ${
                  allowStatusEdit ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
                }`}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Controls product visibility and availability
                {allowStatusEdit && (
                  <span className="block text-blue-600 dark:text-blue-400 font-medium">
                    ⚡ Editable for debugging - Controls validation behavior
                  </span>
                )}
              </p>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active || false}
                  onChange={(e) => onChange('is_active', e.target.checked)}
                  disabled={readOnly}
                  className={`rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 ${
                    readOnly ? 'cursor-not-allowed' : ''
                  }`}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">System Active Flag</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">Technical active state (separate from business status)</p>
            </div>
          </div>

          {/* Data Source & Synchronization */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center mb-4">
              <CogIcon className="h-4 w-4 text-gray-500 mr-2" />
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Data Source & Synchronization</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="source_system" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Source System
                </label>
                <select
                  id="source_system"
                  value={formData.source_system || 'product-mdm'}
                  onChange={(e) => onChange('source_system', e.target.value)}
                  disabled={readOnly}
                  className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 ${
                    readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                  }`}
                >
                  {sourceSystemOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sync_version" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sync Version
                </label>
                <input
                  type="number"
                  id="sync_version"
                  value={formData.sync_version || 1}
                  onChange={(e) => onChange('sync_version', parseInt(e.target.value) || 1)}
                  disabled={readOnly}
                  className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 ${
                    readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  <ClockIcon className="h-4 w-4 inline mr-1" />
                  Last Sync
                </label>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                  {formatDateTime(formData.last_sync_at)}
                </div>
              </div>
            </div>
          </div>

          {/* Audit Information */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center mb-4">
              <ClockIcon className="h-4 w-4 text-gray-500 mr-2" />
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Audit Trail</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created</label>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDateTime(formData.created_at)}
                    {formData.created_by && (
                      <span className="block text-xs">by {formData.created_by}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</label>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDateTime(formData.updated_at)}
                    {formData.updated_by && (
                      <span className="block text-xs">by {formData.updated_by}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemInfoSection