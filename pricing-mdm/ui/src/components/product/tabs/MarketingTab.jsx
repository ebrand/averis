import React, { useState } from 'react'
import { PlusIcon, XMarkIcon, TagIcon } from '@heroicons/react/24/outline'
import GoForLaunchApproval from '../GoForLaunchApproval'

const MarketingTab = ({ formData, onChange, errors, readOnly, approvals, onApprove, onScrub }) => {
  const [newCategory, setNewCategory] = useState('')
  
  const handleAddCategory = () => {
    if (newCategory.trim()) {
      const currentCategories = formData.categorization || []
      onChange('categorization', [...currentCategories, newCategory.trim()])
      setNewCategory('')
    }
  }
  
  const handleRemoveCategory = (index) => {
    const currentCategories = formData.categorization || []
    onChange('categorization', currentCategories.filter((_, i) => i !== index))
  }

  const productTypes = [
    'Software License',
    'SaaS Subscription', 
    'Hardware',
    'Service',
    'Support',
    'Training',
    'Consulting'
  ]

  const productClasses = [
    'Core Product',
    'Add-on',
    'Extension',
    'Bundle',
    'Upgrade',
    'Maintenance'
  ]

  return (
    <div className="space-y-8">
      {/* Basic Product Information */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Product Information</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Essential product details and identifiers</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SKU Code */}
            <div>
              <label htmlFor="sku_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                SKU Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="sku_code"
                value={formData.sku_code || ''}
                onChange={(e) => onChange('sku_code', e.target.value.toUpperCase())}
                disabled={readOnly}
                placeholder="e.g. PROD-2024-001"
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.sku_code 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500'
                } ${readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''}`}
              />
              {errors.sku_code && (
                <p className="mt-1 text-sm text-red-600">{errors.sku_code}</p>
              )}
            </div>

            {/* Product Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name || ''}
                onChange={(e) => onChange('name', e.target.value)}
                disabled={readOnly}
                placeholder="Internal product name"
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.name 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500'
                } ${readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''}`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Display Name
              </label>
              <input
                type="text"
                id="display_name"
                value={formData.display_name || ''}
                onChange={(e) => onChange('display_name', e.target.value)}
                disabled={readOnly}
                placeholder="Customer-facing name"
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* Base Product */}
            <div>
              <label htmlFor="base_product" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Base Product
              </label>
              <input
                type="text"
                id="base_product"
                value={formData.base_product || ''}
                onChange={(e) => onChange('base_product', e.target.value)}
                disabled={readOnly}
                placeholder="Parent or base product SKU"
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          {/* Product Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Product Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              disabled={readOnly}
              placeholder="Detailed product description for internal use"
              className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.description 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500'
              } ${readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''}`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* License Description */}
          <div>
            <label htmlFor="license_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              License Description
            </label>
            <textarea
              id="license_description"
              rows={3}
              value={formData.license_description || ''}
              onChange={(e) => onChange('license_description', e.target.value)}
              disabled={readOnly}
              placeholder="Description of licensing terms and conditions"
              className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Product Classification */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Product Classification</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Categorize and classify your product</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Product Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Product Type
              </label>
              <select
                id="type"
                value={formData.type || ''}
                onChange={(e) => onChange('type', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Type</option>
                {productTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Product Sub Type */}
            <div>
              <label htmlFor="sub_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sub Type
              </label>
              <input
                type="text"
                id="sub_type"
                value={formData.sub_type || ''}
                onChange={(e) => onChange('sub_type', e.target.value)}
                disabled={readOnly}
                placeholder="Product sub-category"
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* Product Class */}
            <div>
              <label htmlFor="class" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Product Class
              </label>
              <select
                id="class"
                value={formData.class || ''}
                onChange={(e) => onChange('class', e.target.value)}
                disabled={readOnly}
                className={`mt-1 block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 ${
                  readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select Class</option>
                {productClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <TagIcon className="h-4 w-4 inline mr-1" />
              Product Categories
            </label>
            
            {/* Add new category */}
            {!readOnly && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  placeholder="Add a category..."
                  className="flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-green-500 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            
            {/* Category tags */}
            <div className="flex flex-wrap gap-2">
              {(formData.categorization || []).map((category, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                >
                  {category}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(index)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
              
              {(formData.categorization || []).length === 0 && (
                <span className="text-sm text-gray-500 italic">No categories added yet</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Flags */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Product Status & Visibility</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Control product availability and display options</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Available Flag */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.available_flag || false}
                onChange={(e) => onChange('available_flag', e.target.checked)}
                disabled={readOnly}
                className={`rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 ${
                  readOnly ? 'cursor-not-allowed' : ''
                }`}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Product Available</span>
            </label>

            {/* Web Display Flag */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.web_display_flag || false}
                onChange={(e) => onChange('web_display_flag', e.target.checked)}
                disabled={readOnly}
                className={`rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 ${
                  readOnly ? 'cursor-not-allowed' : ''
                }`}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Display on Web</span>
            </label>

            {/* Inactive Flag */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.inactive_flag || false}
                onChange={(e) => onChange('inactive_flag', e.target.checked)}
                disabled={readOnly}
                className={`rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500 ${
                  readOnly ? 'cursor-not-allowed' : ''
                }`}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Mark as Inactive</span>
            </label>

            {/* Include Children Flag */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.include_children_flag || false}
                onChange={(e) => onChange('include_children_flag', e.target.checked)}
                disabled={readOnly}
                className={`rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500 ${
                  readOnly ? 'cursor-not-allowed' : ''
                }`}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include Child Products</span>
            </label>
          </div>
        </div>
      </div>

      {/* Go for Launch Approval */}
      <GoForLaunchApproval
        tabId="marketing"
        formData={formData}
        approvals={approvals}
        onApprove={onApprove}
        onScrub={onScrub}
      />
    </div>
  )
}

export default MarketingTab