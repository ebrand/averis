import React from 'react'
import { UserGroupIcon, ShoppingCartIcon, CogIcon } from '@heroicons/react/24/outline'
import GoForLaunchApproval from '../GoForLaunchApproval'

const SalesTab = ({ formData, onChange, errors, readOnly, approvals, onApprove, onScrub }) => {
  const upgradeTypes = [
    'Major Version', 'Minor Version', 'Feature Upgrade', 
    'Maintenance Release', 'Security Patch', 'No Upgrade'
  ]

  const allocationTypes = [
    'Standard', 'Pooled', 'Named User', 'Concurrent', 
    'Site License', 'Enterprise', 'Per Device'
  ]

  const revenuePlanOptions = [
    'Order Booking', 'Invoice Creation', 'Product Delivery', 
    'Service Completion', 'Manual Creation'
  ]

  const changeCodeOptions = [
    'NEW', 'MOD', 'UPG', 'EOL', 'DIS', 'REV'
  ]

  return (
    <div className="space-y-8">
      {/* Sales Quotation Flags */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <ShoppingCartIcon className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sales & Quotation Settings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Configure sales channels and quotation permissions</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sales Quotable */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.sales_quotable_flag || false}
                onChange={(e) => onChange('sales_quotable_flag', e.target.checked)}
                disabled={readOnly}
                className={`rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 ${
                  readOnly ? 'cursor-not-allowed' : ''
                }`}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Sales Quotable</span>
            </label>

            {/* Channel Quotable */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.channel_quotable_flag || false}
                onChange={(e) => onChange('channel_quotable_flag', e.target.checked)}
                disabled={readOnly}
                className={`rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 ${
                  readOnly ? 'cursor-not-allowed' : ''
                }`}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Channel Quotable</span>
            </label>

            {/* Web Quotable */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.web_quotable_flag || false}
                onChange={(e) => onChange('web_quotable_flag', e.target.checked)}
                disabled={readOnly}
                className={`rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 ${
                  readOnly ? 'cursor-not-allowed' : ''
                }`}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Web Quotable</span>
            </label>
          </div>

          {/* Team Approval */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.team_approval_needed_flag || false}
                onChange={(e) => onChange('team_approval_needed_flag', e.target.checked)}
                disabled={readOnly}
                className={`rounded border-gray-300 dark:border-gray-600 text-orange-600 focus:ring-orange-500 ${
                  readOnly ? 'cursor-not-allowed' : ''
                }`}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Team Approval Needed</span>
            </label>
            <p className="ml-6 text-xs text-gray-500">
              Requires management approval before this product can be quoted
            </p>
          </div>
        </div>
      </div>

      {/* Product Lifecycle */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <UserGroupIcon className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Product Lifecycle & Classification</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage product changes and customer allocation</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Change Code */}
            <div>
              <label htmlFor="change_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Change Code
              </label>
              <select
                id="change_code"
                value={formData.change_code || ''}
                onChange={(e) => onChange('change_code', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Change Code</option>
                {changeCodeOptions.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                NEW=New, MOD=Modified, UPG=Upgrade, EOL=End of Life, DIS=Discontinued, REV=Revised
              </p>
            </div>

            {/* Upgrade Type */}
            <div>
              <label htmlFor="upgrade_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Upgrade Type
              </label>
              <select
                id="upgrade_type"
                value={formData.upgrade_type || ''}
                onChange={(e) => onChange('upgrade_type', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Upgrade Type</option>
                {upgradeTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Allocation Type */}
            <div>
              <label htmlFor="allocation_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Allocation Type
              </label>
              <select
                id="allocation_type"
                value={formData.allocation_type || ''}
                onChange={(e) => onChange('allocation_type', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Allocation Type</option>
                {allocationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Create Revenue Plans On */}
            <div>
              <label htmlFor="create_revenue_plans_on" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Create Revenue Plans On
              </label>
              <select
                id="create_revenue_plans_on"
                value={formData.create_revenue_plans_on || ''}
                onChange={(e) => onChange('create_revenue_plans_on', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Trigger</option>
                {revenuePlanOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Fulfillment & Processing */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <CogIcon className="h-5 w-5 text-purple-600 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Fulfillment & Processing</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Configure automated processing and fulfillment options</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Can Be Fulfilled */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.can_be_fulfilled_flag || false}
                onChange={(e) => onChange('can_be_fulfilled_flag', e.target.checked)}
                disabled={readOnly}
                className={`rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 ${
                  readOnly ? 'cursor-not-allowed' : ''
                }`}
              />
              <div className="ml-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">Can Be Fulfilled</span>
                <p className="text-xs text-gray-500">Product can be automatically fulfilled</p>
              </div>
            </label>

            {/* Exclude from Autoprocess */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.exclude_from_autoprocess_flag || false}
                onChange={(e) => onChange('exclude_from_autoprocess_flag', e.target.checked)}
                disabled={readOnly}
                className={`rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 ${
                  readOnly ? 'cursor-not-allowed' : ''
                }`}
              />
              <div className="ml-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">Exclude from Auto-Process</span>
                <p className="text-xs text-gray-500">Skip automated processing workflows</p>
              </div>
            </label>
          </div>

          {/* Processing Guidelines */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CogIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800">Processing Configuration</h4>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Can Be Fulfilled:</strong> Enables automatic fulfillment workflows for digital products</li>
                    <li><strong>Exclude from Auto-Process:</strong> Manual intervention required for special handling</li>
                    <li><strong>Revenue Plans:</strong> Determines when revenue recognition schedules are created</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <UserGroupIcon className="h-5 w-5 text-indigo-600 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sales Metrics & KPIs</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Track key sales performance indicators (Read-only)</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">--</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Quotes</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">--</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">--</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Deal Size</div>
            </div>
          </div>
          
          <p className="mt-4 text-xs text-gray-500 text-center">
            Metrics will be available after product creation and first sales activities
          </p>
        </div>
      </div>
      {/* Go for Launch Approval */}
      <GoForLaunchApproval
        tabId="sales"
        formData={formData}
        approvals={approvals}
        onApprove={onApprove}
        onScrub={onScrub}
      />
    </div>
  )
}

export default SalesTab