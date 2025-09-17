import React from 'react'
import { DocumentTextIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import GoForLaunchApproval from '../GoForLaunchApproval'

const ContractsTab = ({ formData, onChange, errors, readOnly, approvals, onApprove, onScrub }) => {
  const billingFrequencies = [
    'Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 
    'Bi-Annual', 'One-Time', 'Usage-Based'
  ]

  const endOfTermActions = [
    'Auto Renew', 'Manual Renewal Required', 'Terminate', 
    'Convert to Perpetual', 'Renegotiate Terms'
  ]

  const contractItemTypes = [
    'Primary Product', 'Add-On Service', 'Professional Services', 
    'Support Package', 'Training Module', 'Maintenance Contract'
  ]

  const contractLineStatuses = [
    'Draft', 'Active', 'Pending Approval', 'On Hold', 
    'Cancelled', 'Expired', 'Suspended'
  ]

  return (
    <div className="space-y-8">
      {/* Contract Configuration */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Contract Configuration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Define contract terms and billing arrangements</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Contract Item Flag */}
          <div className="border border-green-200 bg-green-50 rounded-lg p-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.contract_item_flag || false}
                onChange={(e) => onChange('contract_item_flag', e.target.checked)}
                disabled={readOnly}
                className={`rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 ${
                  readOnly ? 'cursor-not-allowed' : ''
                }`}
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-green-900">Contract Item</span>
                <p className="text-xs text-green-700">
                  Enable this if the product requires a contract for purchase
                </p>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contract Billing Frequency */}
            <div>
              <label htmlFor="contract_billing_frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Billing Frequency
              </label>
              <select
                id="contract_billing_frequency"
                value={formData.contract_billing_frequency || ''}
                onChange={(e) => onChange('contract_billing_frequency', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Billing Frequency</option>
                {billingFrequencies.map(freq => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
            </div>

            {/* Contract Item Type */}
            <div>
              <label htmlFor="contract_item_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contract Item Type
              </label>
              <select
                id="contract_item_type"
                value={formData.contract_item_type || ''}
                onChange={(e) => onChange('contract_item_type', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Contract Type</option>
                {contractItemTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Terms */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Contract Terms & Duration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Set contract duration and renewal policies</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contract Term Months */}
            <div>
              <label htmlFor="contract_term_months" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contract Term (Months)
              </label>
              <select
                id="contract_term_months"
                value={formData.contract_term_months || 0}
                onChange={(e) => onChange('contract_term_months', parseInt(e.target.value) || 0)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value={0}>No Fixed Term</option>
                <option value={1}>1 Month</option>
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
                <option value={24}>24 Months</option>
                <option value={36}>36 Months</option>
                <option value={60}>60 Months</option>
              </select>
            </div>

            {/* End of Term Action */}
            <div>
              <label htmlFor="contract_end_of_term_action" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                End of Term Action
              </label>
              <select
                id="contract_end_of_term_action"
                value={formData.contract_end_of_term_action || ''}
                onChange={(e) => onChange('contract_end_of_term_action', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Action</option>
                {endOfTermActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>

            {/* Initial Contract Line Status */}
            <div className="md:col-span-2">
              <label htmlFor="initial_contract_line_status_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Initial Contract Line Status
              </label>
              <select
                id="initial_contract_line_status_code"
                value={formData.initial_contract_line_status_code || ''}
                onChange={(e) => onChange('initial_contract_line_status_code', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Initial Status</option>
                {contractLineStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contract Term Examples */}
          <div className="bg-gray-50 border border-gray-200 dark:border-gray-700 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Common Contract Terms</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <strong>Software Licenses:</strong>
                <ul className="mt-1 list-disc list-inside text-xs">
                  <li>12-36 months typical</li>
                  <li>Auto-renew common</li>
                  <li>Annual billing preferred</li>
                </ul>
              </div>
              <div>
                <strong>Services:</strong>
                <ul className="mt-1 list-disc list-inside text-xs">
                  <li>6-12 months typical</li>
                  <li>Manual renewal required</li>
                  <li>Monthly/quarterly billing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Workflow */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-purple-600 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Approval Workflow</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Configure required approvals for contracts</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Approvals would be stored in JSONB - this is a simplified UI */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Approval Configuration</h3>
            <p className="mt-1 text-sm text-gray-500">
              Advanced approval workflows will be configured here
            </p>
            {!readOnly && (
              <div className="mt-6">
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-400 cursor-not-allowed"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Configure Approvals (Coming Soon)
                </button>
              </div>
            )}
          </div>

          {/* Approval Guidelines */}
          <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-purple-400" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-purple-800">Approval Requirements</h4>
                <div className="mt-2 text-sm text-purple-700">
                  <p>Contract approvals may be required based on:</p>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>Contract value thresholds</li>
                    <li>Contract term length</li>
                    <li>Customer risk profile</li>
                    <li>Non-standard terms</li>
                    <li>Pricing discounts</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Templates */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <DocumentTextIcon className="h-5 w-5 text-indigo-600 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Contract Templates</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Available contract templates for this product type</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-green-300 cursor-pointer">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Standard Software License</div>
              <div className="text-xs text-gray-500 mt-1">Most common template for software products</div>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-green-300 cursor-pointer">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Enterprise Agreement</div>
              <div className="text-xs text-gray-500 mt-1">For large enterprise customers</div>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-green-300 cursor-pointer">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Service Contract</div>
              <div className="text-xs text-gray-500 mt-1">For professional services</div>
            </div>
          </div>
          
          <p className="mt-4 text-xs text-gray-500">
            Contract templates can be customized based on product type and customer requirements
          </p>
        </div>
      </div>
      {/* Go for Launch Approval */}
      <GoForLaunchApproval
        tabId="contracts"
        formData={formData}
        approvals={approvals}
        onApprove={onApprove}
        onScrub={onScrub}
      />
    </div>
  )
}

export default ContractsTab