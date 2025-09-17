import React, { useState } from 'react';
import CollapsibleSection from '../common/CollapsibleSection';
import { PlusIcon, XMarkIcon, TagIcon } from '@heroicons/react/24/outline';

const ProductFormSection = ({ formData, onChange, errors, readOnly = false }) => {
  const [newCategory, setNewCategory] = useState('');

  // Helper function to get filled field count for a section
  const getFilledFieldCount = (fields) => {
    return fields.filter(field => {
      const value = formData[field.key];
      return value !== null && value !== undefined && value !== '' && value !== false;
    }).length;
  };

  // Helper function to format field value for display
  const formatValue = (value, type = 'text') => {
    if (value === null || value === undefined || value === '') return '-';
    
    switch (type) {
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'currency':
        return `$${parseFloat(value).toFixed(2)}`;
      case 'number':
        return parseFloat(value).toString();
      case 'array':
        return Array.isArray(value) ? value.join(', ') : value;
      default:
        return value.toString();
    }
  };

  // Category management
  const handleAddCategory = () => {
    if (newCategory.trim()) {
      const currentCategories = formData.categorization || [];
      onChange('categorization', [...currentCategories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (index) => {
    const currentCategories = formData.categorization || [];
    onChange('categorization', currentCategories.filter((_, i) => i !== index));
  };

  // Define comprehensive field groups
  const fieldGroups = [
    {
      title: 'Core Product Information',
      key: 'core',
      defaultOpen: true,
      fields: [
        { key: 'sku_code', label: 'SKU Code', type: 'text', required: true, placeholder: 'e.g. PROD-2024-001' },
        { key: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'Internal product name' },
        { key: 'display_name', label: 'Display Name', type: 'text', placeholder: 'Customer-facing name' },
        { key: 'description', label: 'Product Description', type: 'textarea', required: true, placeholder: 'Detailed product description for internal use', rows: 4 },
        { key: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'Product brand or vendor' },
        { key: 'manufacturer', label: 'Manufacturer', type: 'text', placeholder: 'Manufacturing company' },
        { key: 'base_product', label: 'Base Product', type: 'text', placeholder: 'Parent or base product SKU' },
        { key: 'change_code', label: 'Change Code', type: 'text', placeholder: 'Change tracking code' }
      ]
    },
    {
      title: 'Product Classification',
      key: 'classification',
      defaultOpen: false,
      fields: [
        { key: 'type', label: 'Product Type', type: 'select', options: ['Software License', 'SaaS Subscription', 'Hardware', 'Service', 'Support', 'Training', 'Consulting'] },
        { key: 'sub_type', label: 'Sub Type', type: 'text', placeholder: 'Product sub-category' },
        { key: 'class', label: 'Product Class', type: 'select', options: ['Core Product', 'Add-on', 'Extension', 'Bundle', 'Upgrade', 'Maintenance'] },
        { key: 'upgrade_type', label: 'Upgrade Type', type: 'select', options: ['major', 'minor', 'patch', 'feature', 'maintenance'] }
      ],
      customContent: true
    },
    {
      title: 'Pricing & Financial',
      key: 'pricing',
      defaultOpen: false,
      fields: [
        { key: 'base_price', label: 'Base Price', type: 'currency', placeholder: '0.00' },
        { key: 'list_price', label: 'List Price', type: 'currency', placeholder: '0.00' },
        { key: 'cost_price', label: 'Cost Price', type: 'currency', placeholder: '0.00' },
        { key: 'cost_basis', label: 'Cost Basis', type: 'currency', placeholder: '0.00' },
        { key: 'unit_of_measure', label: 'Unit of Measure', type: 'select', options: ['each', 'license', 'user', 'month', 'year', 'hour'] },
        { key: 'weight', label: 'Weight', type: 'number', placeholder: '0' },
        { key: 'revenue_category', label: 'Revenue Category', type: 'text', placeholder: 'Standard' },
        { key: 'item_revenue_category', label: 'Item Revenue Category', type: 'text', placeholder: 'Software' }
      ]
    },
    {
      title: 'Tax & Accounting',
      key: 'accounting',
      defaultOpen: false,
      fields: [
        { key: 'ava_tax_code', label: 'Avalara Tax Code', type: 'text', placeholder: 'SW054000' },
        { key: 'tax_schedule', label: 'Tax Schedule', type: 'text', placeholder: 'Software Tax Schedule' },
        { key: 'income_account', label: 'Income Account', type: 'text', placeholder: '4000-Software Revenue' },
        { key: 'deferred_revenue_account', label: 'Deferred Revenue Account', type: 'text' },
        { key: 'rev_rec_rule', label: 'Revenue Recognition Rule', type: 'text' },
        { key: 'rev_rec_forecast_rule', label: 'Revenue Recognition Forecast Rule', type: 'text' },
        { key: 'rev_allocation_group', label: 'Revenue Allocation Group', type: 'text' },
        { key: 'maintenance_item', label: 'Maintenance Item', type: 'text' },
        { key: 'renewal_item', label: 'Renewal Item', type: 'text' }
      ]
    },
    {
      title: 'License & Permissions',
      key: 'licensing',
      defaultOpen: false,
      fields: [
        { key: 'license_required_flag', label: 'License Required', type: 'boolean' },
        { key: 'license_key_type', label: 'License Key Type', type: 'text', placeholder: 'enterprise' },
        { key: 'license_count', label: 'License Count', type: 'number', placeholder: '0' },
        { key: 'license_description', label: 'License Description', type: 'textarea', placeholder: 'Description of licensing terms and conditions', rows: 3 },
        { key: 'app_id', label: 'Application ID', type: 'number', placeholder: '0' },
        { key: 'app_key', label: 'Application Key', type: 'number', placeholder: '0' },
        { key: 'renewal_required_flag', label: 'Renewal Required', type: 'boolean' },
        { key: 'portal_renewal_flag', label: 'Portal Renewal', type: 'boolean' },
        { key: 'grouped_license_flag', label: 'Grouped License', type: 'boolean' },
        { key: 'additional_license_flag', label: 'Additional License', type: 'boolean' },
        { key: 'additional_licenses_to_provision', label: 'Additional Licenses to Provision', type: 'text' },
        { key: 'term_license_flag', label: 'Term License', type: 'boolean' }
      ]
    },
    {
      title: 'Seat-Based Pricing',
      key: 'seating',
      defaultOpen: false,
      fields: [
        { key: 'seat_based_pricing_flag', label: 'Seat-Based Pricing', type: 'boolean' },
        { key: 'seat_adjustment_flag', label: 'Seat Adjustment', type: 'boolean' },
        { key: 'seat_min_price_break_level', label: 'Min Seat Price Break', type: 'text', placeholder: '1-10' },
        { key: 'seat_max_price_break_level', label: 'Max Seat Price Break', type: 'text', placeholder: '100+' }
      ]
    },
    {
      title: 'Sales & Marketing',
      key: 'sales',
      defaultOpen: false,
      fields: [
        { key: 'available_flag', label: 'Product Available', type: 'boolean' },
        { key: 'web_display_flag', label: 'Display on Web', type: 'boolean' },
        { key: 'sales_quotable_flag', label: 'Sales Quotable', type: 'boolean' },
        { key: 'channel_quotable_flag', label: 'Channel Quotable', type: 'boolean' },
        { key: 'web_quotable_flag', label: 'Web Quotable', type: 'boolean' },
        { key: 'team_approval_needed_flag', label: 'Team Approval Needed', type: 'boolean' },
        { key: 'availability_status', label: 'Availability Status', type: 'select', options: ['available', 'unavailable', 'discontinued', 'pre-order'] },
        { key: 'lifecycle_status', label: 'Lifecycle Status', type: 'select', options: ['draft', 'active', 'deprecated', 'retired'] }
      ]
    },
    {
      title: 'Contract & Billing',
      key: 'contracts',
      defaultOpen: false,
      fields: [
        { key: 'contract_item_flag', label: 'Contract Item', type: 'boolean' },
        { key: 'contract_item_type', label: 'Contract Type', type: 'select', options: ['subscription', 'one-time', 'usage-based', 'tiered'] },
        { key: 'contract_billing_frequency', label: 'Billing Frequency', type: 'select', options: ['monthly', 'quarterly', 'annually', 'one-time'] },
        { key: 'contract_term_months', label: 'Term (Months)', type: 'number', placeholder: '12' },
        { key: 'contract_end_of_term_action', label: 'End of Term Action', type: 'select', options: ['auto-renew', 'manual-renew', 'terminate', 'convert'] },
        { key: 'initial_contract_line_status_code', label: 'Initial Status Code', type: 'text', placeholder: 'ACTIVE' }
      ]
    },
    {
      title: 'Operations & Fulfillment',
      key: 'operations',
      defaultOpen: false,
      fields: [
        { key: 'can_be_fulfilled_flag', label: 'Can Be Fulfilled', type: 'boolean' },
        { key: 'exclude_from_autoprocess_flag', label: 'Exclude from Autoprocess', type: 'boolean' },
        { key: 'create_revenue_plans_on', label: 'Create Revenue Plans On', type: 'select', options: ['activation', 'billing', 'delivery', 'completion'] },
        { key: 'allocation_type', label: 'Allocation Type', type: 'select', options: ['percentage', 'fixed', 'usage', 'tiered'] },
        { key: 'subsidiary', label: 'Subsidiary', type: 'text', placeholder: 'Main' },
        { key: 'inactive_flag', label: 'Mark as Inactive', type: 'boolean' },
        { key: 'include_children_flag', label: 'Include Child Products', type: 'boolean' },
        { key: 'direct_revenue_posting_flag', label: 'Direct Revenue Posting', type: 'boolean' }
      ]
    },
    {
      title: 'E-commerce & Customer Experience',
      key: 'averis_ecomm',
      defaultOpen: false,
      fields: [
        { key: 'sku', label: 'E-commerce SKU', type: 'text', placeholder: 'Customer-facing SKU (if different)' },
        { key: 'category', label: 'E-commerce Category', type: 'text', placeholder: 'Customer-facing category' },
        { key: 'slug', label: 'URL Slug', type: 'text', placeholder: 'url-friendly-product-name' },
        { key: 'short_description', label: 'Short Description (E-commerce)', type: 'textarea', placeholder: 'Brief description for product listings and search results', rows: 2 },
        { key: 'long_description', label: 'Long Description (E-commerce)', type: 'textarea', placeholder: 'Detailed customer-facing product description', rows: 4 }
      ]
    }
  ];

  // Get important stats for each group
  const getGroupStats = (group) => {
    const filledCount = getFilledFieldCount(group.fields);
    const totalCount = group.fields.length;
    
    // Add group-specific important values
    const stats = [`${filledCount}/${totalCount} fields`];
    
    switch (group.key) {
      case 'core':
        if (formData.status) stats.push(formData.status);
        if (formData.brand) stats.push(formData.brand);
        break;
      case 'pricing':
        if (formData.base_price) stats.push(`$${formData.base_price}`);
        break;
      case 'licensing':
        if (formData.license_required_flag) stats.push('Licensed');
        break;
      case 'seating':
        if (formData.seat_based_pricing_flag) stats.push('Seat-based');
        break;
      case 'sales':
        if (formData.web_display_flag) stats.push('Web visible');
        break;
      case 'contracts':
        if (formData.contract_item_flag) stats.push('Contract');
        break;
      default:
        break;
    }
    
    return stats;
  };

  // Render field based on type
  const renderField = (field) => {
    const value = formData[field.key] || '';
    const hasError = errors[field.key];
    const hasValue = value !== null && value !== undefined && value !== '' && value !== false;

    const baseInputClasses = `block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
      hasError 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
    } ${readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''}`;

    const fieldWrapper = (content) => (
      <div key={field.key} className={`${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
        <label htmlFor={field.key} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
        {content}
        {hasError && (
          <p className="mt-1 text-sm text-red-600">{hasError}</p>
        )}
      </div>
    );

    switch (field.type) {
      case 'textarea':
        return fieldWrapper(
          <textarea
            id={field.key}
            rows={field.rows || 3}
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            disabled={readOnly}
            placeholder={field.placeholder}
            className={baseInputClasses}
          />
        );

      case 'select':
        return fieldWrapper(
          <select
            id={field.key}
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            disabled={readOnly}
            className={baseInputClasses}
          >
            <option value="">Select {field.label}</option>
            {field.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'boolean':
        return fieldWrapper(
          <label className="flex items-center mt-1">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(field.key, e.target.checked)}
              disabled={readOnly}
              className={`rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 ${
                readOnly ? 'cursor-not-allowed' : ''
              }`}
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              {formatValue(value, 'boolean')}
            </span>
          </label>
        );

      case 'number':
      case 'currency':
        return fieldWrapper(
          <input
            type="number"
            step={field.type === 'currency' ? '0.01' : '1'}
            id={field.key}
            value={value}
            onChange={(e) => onChange(field.key, field.type === 'currency' ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
            disabled={readOnly}
            placeholder={field.placeholder}
            className={baseInputClasses}
          />
        );

      default:
        return fieldWrapper(
          <input
            type="text"
            id={field.key}
            value={value}
            onChange={(e) => onChange(field.key, field.key === 'sku_code' ? e.target.value.toUpperCase() : e.target.value)}
            disabled={readOnly}
            placeholder={field.placeholder}
            className={baseInputClasses}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {fieldGroups.map((group) => (
        <CollapsibleSection
          key={group.key}
          title={group.title}
          defaultOpen={group.defaultOpen}
          stats={getGroupStats(group)}
          variant="card"
        >
          {group.customContent && group.key === 'classification' ? (
            // Custom content for classification section
            <div className="space-y-6">
              {/* Regular fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.fields.map(renderField)}
              </div>
              
              {/* Categories management */}
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
                      className="flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                    >
                      {category}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(index)}
                          className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
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
          ) : (
            // Regular field grid
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.fields.map(renderField)}
            </div>
          )}
        </CollapsibleSection>
      ))}
    </div>
  );
};

export default ProductFormSection;