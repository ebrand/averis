import React from 'react'
import { CurrencyDollarIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import GoForLaunchApproval from '../GoForLaunchApproval'

const FinanceTab = ({ formData, onChange, errors, readOnly, approvals, onApprove, onScrub }) => {
  const taxCodes = [
    'SW030000', 'SW054000', 'SW056000', 'SV300000', 'SV010000', 'HW020000'
  ]

  const revenueCategories = [
    'Software License', 'Software Maintenance', 'Professional Services', 
    'Training', 'Support', 'Hardware', 'SaaS Subscription'
  ]

  const revRecRules = [
    'Recognize Immediately', 'Straight Line', 'Usage Based', 
    'Milestone Based', 'Percentage Complete'
  ]

  const accounts = [
    '4000-Software Revenue', '4100-Service Revenue', '4200-Maintenance Revenue',
    '2400-Deferred Revenue', '2410-Deferred Maintenance'
  ]

  return (
    <div className="space-y-8">
      {/* Pricing Configuration */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pricing Configuration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Set base pricing and pricing structure</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Base Price */}
            <div>
              <label htmlFor="base_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Base Price ($)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  id="base_price"
                  value={formData.base_price || 0}
                  onChange={(e) => onChange('base_price', parseFloat(e.target.value) || 0)}
                  disabled={readOnly}
                  className={`block w-full pl-7 pr-3 py-2 rounded-md shadow-sm border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                    readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* Revenue Category */}
            <div>
              <label htmlFor="revenue_category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Revenue Category
              </label>
              <select
                id="revenue_category"
                value={formData.revenue_category || ''}
                onChange={(e) => onChange('revenue_category', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Category</option>
                {revenueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Item Revenue Category */}
            <div>
              <label htmlFor="item_revenue_category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Item Revenue Category
              </label>
              <select
                id="item_revenue_category"
                value={formData.item_revenue_category || ''}
                onChange={(e) => onChange('item_revenue_category', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Category</option>
                {revenueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Direct Revenue Posting */}
            <div className="flex items-center pt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.direct_revenue_posting_flag || false}
                  onChange={(e) => onChange('direct_revenue_posting_flag', e.target.checked)}
                  disabled={readOnly}
                  className={`rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 ${
                    readOnly ? 'cursor-not-allowed' : ''
                  }`}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Direct Revenue Posting</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Configuration */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tax Configuration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Configure tax codes and schedules</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Avalara Tax Code */}
            <div>
              <label htmlFor="ava_tax_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Avalara Tax Code
              </label>
              <select
                id="ava_tax_code"
                value={formData.ava_tax_code || ''}
                onChange={(e) => onChange('ava_tax_code', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Tax Code</option>
                {taxCodes.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>

            {/* Tax Schedule */}
            <div>
              <label htmlFor="tax_schedule" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tax Schedule
              </label>
              <input
                type="text"
                id="tax_schedule"
                value={formData.tax_schedule || ''}
                onChange={(e) => onChange('tax_schedule', e.target.value)}
                disabled={readOnly}
                placeholder="e.g. Standard, Exempt, International"
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Accounting Configuration */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <ChartBarIcon className="h-5 w-5 text-purple-600 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Accounting Configuration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Configure account mapping and revenue recognition</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Account */}
            <div>
              <label htmlFor="income_account" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Income Account
              </label>
              <select
                id="income_account"
                value={formData.income_account || ''}
                onChange={(e) => onChange('income_account', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Income Account</option>
                {accounts.filter(acc => acc.includes('Revenue')).map(account => (
                  <option key={account} value={account}>{account}</option>
                ))}
              </select>
            </div>

            {/* Deferred Revenue Account */}
            <div>
              <label htmlFor="deferred_revenue_account" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Deferred Revenue Account
              </label>
              <select
                id="deferred_revenue_account"
                value={formData.deferred_revenue_account || ''}
                onChange={(e) => onChange('deferred_revenue_account', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Deferred Account</option>
                {accounts.filter(acc => acc.includes('Deferred')).map(account => (
                  <option key={account} value={account}>{account}</option>
                ))}
              </select>
            </div>

            {/* Revenue Recognition Rule */}
            <div>
              <label htmlFor="rev_rec_rule" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Revenue Recognition Rule
              </label>
              <select
                id="rev_rec_rule"
                value={formData.rev_rec_rule || ''}
                onChange={(e) => onChange('rev_rec_rule', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Rev Rec Rule</option>
                {revRecRules.map(rule => (
                  <option key={rule} value={rule}>{rule}</option>
                ))}
              </select>
            </div>

            {/* Revenue Recognition Forecast Rule */}
            <div>
              <label htmlFor="rev_rec_forecast_rule" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Revenue Forecast Rule
              </label>
              <select
                id="rev_rec_forecast_rule"
                value={formData.rev_rec_forecast_rule || ''}
                onChange={(e) => onChange('rev_rec_forecast_rule', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Forecast Rule</option>
                {revRecRules.map(rule => (
                  <option key={rule} value={rule}>{rule}</option>
                ))}
              </select>
            </div>

            {/* Revenue Allocation Group */}
            <div>
              <label htmlFor="rev_allocation_group" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Revenue Allocation Group
              </label>
              <input
                type="text"
                id="rev_allocation_group"
                value={formData.rev_allocation_group || ''}
                onChange={(e) => onChange('rev_allocation_group', e.target.value)}
                disabled={readOnly}
                placeholder="e.g. Software Bundle, Service Package"
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* Subsidiary */}
            <div>
              <label htmlFor="subsidiary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subsidiary
              </label>
              <input
                type="text"
                id="subsidiary"
                value={formData.subsidiary || ''}
                onChange={(e) => onChange('subsidiary', e.target.value)}
                disabled={readOnly}
                placeholder="e.g. US, EMEA, APAC"
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          {/* Maintenance and Renewal Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="maintenance_item" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Maintenance Item
              </label>
              <input
                type="text"
                id="maintenance_item"
                value={formData.maintenance_item || ''}
                onChange={(e) => onChange('maintenance_item', e.target.value)}
                disabled={readOnly}
                placeholder="Related maintenance product SKU"
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              />
            </div>

            <div>
              <label htmlFor="renewal_item" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Renewal Item
              </label>
              <input
                type="text"
                id="renewal_item"
                value={formData.renewal_item || ''}
                onChange={(e) => onChange('renewal_item', e.target.value)}
                disabled={readOnly}
                placeholder="Related renewal product SKU"
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Go for Launch Approval */}
      <GoForLaunchApproval
        tabId="finance"
        formData={formData}
        approvals={approvals}
        onApprove={onApprove}
        onScrub={onScrub}
      />
    </div>
  )
}

export default FinanceTab