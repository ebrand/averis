import React, { useState } from 'react';
import CollapsibleSection from '../common/CollapsibleSection';
import { PlusIcon, XMarkIcon, TagIcon } from '@heroicons/react/24/outline';

const TabSpecificFormSection = ({ formData, onChange, errors, readOnly = false, tabId }) => {
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

  // Helper function to determine if a field is required based on business rules
  const isFieldRequired = (fieldKey, formData) => {
    // Base required fields (marked with 'x' in requirements) - excluding boolean flags which are always valid
    const baseRequiredFields = [
      // Marketing - Core Product Information
      'sku_code', 'name', 'display_name', 'description', 'brand', 'manufacturer',
      // Marketing - Product Classification  
      'type', 'sub_type', 'class', 'categorization',
      // Marketing - E-commerce & Customer Experience
      'sku', 'category', 'slug', 'short_description', 'long_description',
      // Marketing - Sales & Marketing Flags (only non-boolean fields)
      'lifecycle_status',
      // Finance - Tax & Accounting, Pricing & Financial
      'ava_tax_code', 'tax_schedule', 'income_account', 'deferred_revenue_account', 
      'rev_rec_rule', 'rev_rec_forecast_rule', 'rev_allocation_group',
      'base_price', 'list_price', 'cost_price', 'unit_of_measure', 'weight', 'item_revenue_category',
      // Sales - Operations & Fulfillment (only non-boolean fields)
      'allocation_type',
      // Note: Boolean flags like available_flag, web_display_flag, license_required_flag, 
      // seat_based_pricing_flag, can_be_fulfilled_flag, include_children_flag, 
      // direct_revenue_posting_flag, contract_item_flag are NOT required as both true/false are valid
    ];

    // Check if field is in base required list
    if (baseRequiredFields.includes(fieldKey)) {
      return true;
    }

    // Conditional requirements based on flag states
    const conditionalRequirements = {
      // License-related fields (required if license_required_flag is true)
      'license_key_type': formData.license_required_flag,
      'license_count': formData.license_required_flag,
      'license_description': formData.license_required_flag,
      'renewal_required_flag': formData.license_required_flag,
      
      // Seat-based pricing fields (required if seat_based_pricing_flag is true)
      'seat_adjustment_flag': formData.seat_based_pricing_flag,
      'seat_min_price_break_level': formData.seat_based_pricing_flag,
      'seat_max_price_break_level': formData.seat_based_pricing_flag,
      
      // Contract fields (required if contract_item_flag is true)
      'contract_item_type': formData.contract_item_flag,
      'contract_billing_frequency': formData.contract_item_flag,
      'contract_term_months': formData.contract_item_flag,
      'contract_end_of_term_action': formData.contract_item_flag,
      'initial_contract_line_status_code': formData.contract_item_flag
    };

    // Return conditional requirement if it exists
    return conditionalRequirements[fieldKey] || false;
  };

  // Helper function to get only required fields for completion calculation
  const getRequiredFieldCount = (fields, formData) => {
    return fields.filter(field => isFieldRequired(field.key, formData)).length;
  };

  // Helper function to get filled required fields count
  const getFilledRequiredFieldCount = (fields, formData) => {
    return fields.filter(field => {
      if (!isFieldRequired(field.key, formData)) return false;
      const value = formData[field.key];
      // For boolean fields, both true and false are valid values
      if (typeof value === 'boolean') return true;
      // For other fields, check if they have meaningful content
      return value !== null && value !== undefined && value !== '';
    }).length;
  };

  // Define all field groups with tab assignments - matching data dictionary exactly
  const allFieldGroups = [
    // MARKETING SECTION (13 fields) - product_marketing role
    {
      title: 'Core Product Information',
      key: 'core',
      tabs: ['marketing'],
      defaultOpen: true,
      fields: [
        { key: 'sku', label: 'SKU Code', type: 'text', placeholder: 'e.g. PROD-2024-001' },
        { key: 'name', label: 'Product Name', type: 'text', placeholder: 'Product name' },
        { key: 'description', label: 'Product Description', type: 'textarea', placeholder: 'Detailed product description', rows: 4 },
        { key: 'brand', label: 'Brand', type: 'text', placeholder: 'Product brand' },
        { key: 'manufacturer', label: 'Manufacturer', type: 'text', placeholder: 'Manufacturing company' }
      ]
    },
    {
      title: 'Product Classification',
      key: 'classification',
      tabs: ['marketing'],
      defaultOpen: false,
      fields: [
        { key: 'type', label: 'Product Type', type: 'select', options: ['Software', 'Hardware', 'Cloud Service', 'Professional Services', 'Training', 'Mobile App', 'Platform'] },
        { key: 'categorization', label: 'Categories', type: 'text', placeholder: 'e.g., Software, Enterprise, Security', isArray: true },
        { key: 'categoryId', label: 'Category ID', type: 'text', placeholder: 'Category identifier' }
      ],
      customContent: true
    },
    {
      title: 'Web & E-commerce',
      key: 'web_ecommerce',
      tabs: ['marketing'],
      defaultOpen: false,
      fields: [
        { key: 'slug', label: 'URL Slug', type: 'text', placeholder: 'url-friendly-product-name' },
        { key: 'longDescription', label: 'Long Description', type: 'textarea', placeholder: 'Detailed customer-facing product description', rows: 4 },
        { key: 'webDisplayFlag', label: 'Web Display', type: 'boolean' }
      ]
    },
    
    // FINANCE SECTION (4 fields) - product_finance role
    {
      title: 'Pricing & Financial',
      key: 'pricing',
      tabs: ['finance'],
      defaultOpen: true,
      fields: [
        { key: 'basePrice', label: 'Base Price', type: 'currency', placeholder: '0.00' },
        { key: 'listPrice', label: 'List Price', type: 'currency', placeholder: '0.00' },
        { key: 'costPrice', label: 'Cost Price', type: 'currency', placeholder: '0.00' },
        { key: 'currency', label: 'Currency', type: 'select', options: ['USD', 'EUR', 'GBP', 'CAD'] }
      ]
    },
    
    // LEGAL SECTION (4 fields) - product_legal role
    {
      title: 'Licensing & Compliance',
      key: 'licensing',
      tabs: ['legal'],
      defaultOpen: true,
      fields: [
        { key: 'licenseRequiredFlag', label: 'License Required', type: 'boolean' },
        { key: 'regulatoryStatus', label: 'Regulatory Status', type: 'select', options: ['Compliant', 'Under Review', 'Non-Compliant'] },
        { key: 'complianceNotes', label: 'Compliance Notes', type: 'textarea', placeholder: 'Compliance requirements and notes', rows: 3 }
      ]
    },
    {
      title: 'Tax & Accounting',
      key: 'accounting',
      tabs: ['legal'],
      defaultOpen: false,
      fields: [
        { key: 'avaTaxCode', label: 'Avalara Tax Code', type: 'text', placeholder: 'SW054000' }
      ]
    },
    
    // SALESOPS SECTION (2 fields) - product_salesops role
    {
      title: 'Sales Configuration',
      key: 'sales_config',
      tabs: ['sales'],
      defaultOpen: true,
      fields: [
        { key: 'salesChannel', label: 'Sales Channel', type: 'select', options: ['Direct', 'Partner', 'Online', 'Retail'] },
        { key: 'availabilityRegion', label: 'Availability Region', type: 'select', options: ['North America', 'Europe', 'Asia Pacific', 'Global'] }
      ]
    },
    
    // CONTRACTS SECTION (1 field) - product_contracts role
    {
      title: 'Contract Management',
      key: 'contracts',
      tabs: ['contracts'],
      defaultOpen: true,
      fields: [
        { key: 'contractItemFlag', label: 'Contract Item', type: 'boolean' }
      ]
    },
    
    // SYSTEM SECTION (9 fields) - system role (visible on all tabs)
    {
      title: 'System Settings',
      key: 'system_settings',
      tabs: ['marketing', 'finance', 'legal', 'sales', 'contracts'],
      defaultOpen: false,
      fields: [
        { key: 'status', label: 'Status', type: 'select', options: ['draft', 'active', 'deprecated', 'archived'] },
        { key: 'availableFlag', label: 'Available', type: 'boolean', defaultValue: true },
        { key: 'seatBasedPricingFlag', label: 'Seat-Based Pricing', type: 'boolean' },
        { key: 'canBeFulfilledFlag', label: 'Can Be Fulfilled', type: 'boolean' }
      ]
    },
    {
      title: 'System Data',
      key: 'system_data',
      tabs: ['marketing', 'finance', 'legal', 'sales', 'contracts'],
      defaultOpen: false,
      fields: [
        { key: 'id', label: 'Product ID', type: 'text', disabled: true },
        { key: 'createdAt', label: 'Created Date', type: 'text', disabled: true },
        { key: 'updatedAt', label: 'Last Updated', type: 'text', disabled: true }
      ]
    },
    {
      title: 'Complex Data',
      key: 'complex_data',
      tabs: ['marketing', 'finance', 'legal', 'sales', 'contracts'],
      defaultOpen: false,
      fields: [
        { key: 'pricing', label: 'Pricing Data', type: 'textarea', placeholder: 'JSON pricing configuration', rows: 3 },
        { key: 'approvals', label: 'Approvals Data', type: 'textarea', placeholder: 'JSON approvals configuration', rows: 3 },
        { key: 'attributes', label: 'Product Attributes', type: 'textarea', placeholder: 'System-maintained product attributes', rows: 3 },
        { key: 'metadata', label: 'Metadata', type: 'textarea', placeholder: 'System-maintained metadata', rows: 3 }
      ]
    }
  ];

  // Filter field groups by current tab
  const fieldGroups = allFieldGroups.filter(group => group.tabs.includes(tabId));

  // Get important stats for each group with specific attributes per your requirements
  const getGroupStats = (group) => {
    // Calculate based on required fields only
    const requiredCount = getRequiredFieldCount(group.fields, formData);
    const filledRequiredCount = getFilledRequiredFieldCount(group.fields, formData);
    
    // Calculate completion percentage for progress bar based on required fields
    const completionPercentage = requiredCount > 0 ? Math.round((filledRequiredCount / requiredCount) * 100) : 0;
    
    // Start with attribute badges (show all required fields, use dash for empty values)
    const stats = [];
    
    // Add specific attribute values based on group and tab (show key fields)
    switch (group.key) {
      case 'core':
        // Core: SKU, Name, Brand, Manufacturer
        stats.push(<><strong>SKU:</strong> {formData.sku || ' -'}</>);
        stats.push(<><strong>Name:</strong> {formData.name || ' -'}</>);
        stats.push(<><strong>Brand:</strong> {formData.brand || ' -'}</>);
        stats.push(<><strong>Mfg:</strong> {formData.manufacturer || ' -'}</>);
        break;
        
      case 'classification':
        // Product Classification: Type, Categories
        stats.push(<><strong>Type:</strong> {formData.type || ' -'}</>);
        if (formData.categorization && formData.categorization.length > 0) {
          const categories = formData.categorization.slice(0, 2).join(', ') + (formData.categorization.length > 2 ? '...' : '');
          stats.push(<><strong>Categories:</strong> {categories}</>);
        } else {
          stats.push(<><strong>Categories:</strong> -</>);
        }
        break;
        
      case 'web_ecommerce':
        // Web & E-commerce: Slug, Web Display
        stats.push(<><strong>Slug:</strong> {formData.slug || ' -'}</>);
        const webValue = typeof formData.webDisplayFlag === 'boolean' ? (formData.webDisplayFlag ? 'Yes' : 'No') : ' -';
        stats.push(<><strong>Web:</strong> {webValue}</>);
        break;
        
        
      case 'pricing':
        // Pricing & Financial: Base, List, Cost, Currency
        const baseValue = formData.basePrice ? `$${parseFloat(formData.basePrice).toFixed(2)}` : ' -';
        const listValue = formData.listPrice ? `$${parseFloat(formData.listPrice).toFixed(2)}` : ' -';
        const costValue = formData.costPrice ? `$${parseFloat(formData.costPrice).toFixed(2)}` : ' -';
        stats.push(<><strong>Base:</strong> {baseValue}</>);
        stats.push(<><strong>List:</strong> {listValue}</>);
        stats.push(<><strong>Cost:</strong> {costValue}</>);
        stats.push(<><strong>Currency:</strong> {formData.currency || ' -'}</>);
        break;
        
      case 'licensing':
        // License & Permissions: License Required, Regulatory Status
        const licenseValue = typeof formData.licenseRequiredFlag === 'boolean' ? (formData.licenseRequiredFlag ? 'Yes' : 'No') : ' -';
        stats.push(<><strong>Required:</strong> {licenseValue}</>);
        stats.push(<><strong>Regulatory:</strong> {formData.regulatoryStatus || ' -'}</>);
        break;
        
      case 'accounting':
        // Tax & Accounting: Tax Code
        stats.push(<><strong>Tax Code:</strong> {formData.avaTaxCode || ' -'}</>);
        break;
        
      case 'sales_config':
        // Sales Configuration: Channel, Region
        stats.push(<><strong>Channel:</strong> {formData.salesChannel || ' -'}</>);
        stats.push(<><strong>Region:</strong> {formData.availabilityRegion || ' -'}</>);
        break;
        
      case 'contracts':
        // Contract Management: Contract Item
        const contractValue = typeof formData.contractItemFlag === 'boolean' ? (formData.contractItemFlag ? 'Yes' : 'No') : ' -';
        stats.push(<><strong>Contract:</strong> {contractValue}</>);
        break;
        
      case 'system_settings':
        // System Settings: Status, Available
        stats.push(<><strong>Status:</strong> {formData.status || ' -'}</>);
        const availableValue = typeof formData.availableFlag === 'boolean' ? (formData.availableFlag ? 'Yes' : 'No') : ' -';
        stats.push(<><strong>Available:</strong> {availableValue}</>);
        break;
        
      case 'system_data':
        // System Data: ID, Created
        stats.push(<><strong>ID:</strong> {formData.id || ' -'}</>);
        stats.push(<><strong>Created:</strong> {formData.createdAt ? new Date(formData.createdAt).toLocaleDateString() : ' -'}</>);
        break;
        
      case 'complex_data':
        // Complex Data: Show if data exists
        const hasPricing = formData.pricing && formData.pricing.trim() ? 'Yes' : 'No';
        const hasApprovals = formData.approvals && formData.approvals.trim() ? 'Yes' : 'No';
        const hasAttributes = formData.attributes && formData.attributes.trim() ? 'Yes' : 'No';
        const hasMetadata = formData.metadata && formData.metadata.trim() ? 'Yes' : 'No';
        stats.push(<><strong>Pricing:</strong> {hasPricing}</>);
        stats.push(<><strong>Approvals:</strong> {hasApprovals}</>);
        stats.push(<><strong>Attributes:</strong> {hasAttributes}</>);
        stats.push(<><strong>Metadata:</strong> {hasMetadata}</>);
        break;
        
      default:
        break;
    }
    
    return { stats, completionPercentage };
  };

  // Render field based on type
  const renderField = (field) => {
    const value = formData[field.key] || '';
    const hasError = errors[field.key];
    // For boolean fields, both true and false are valid values
    const hasValue = typeof value === 'boolean' ? true : (value !== null && value !== undefined && value !== '');
    const isRequired = isFieldRequired(field.key, formData);

    const baseInputClasses = `block w-full rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
      hasError 
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
        : isRequired && !hasValue
          ? 'border-amber-300 dark:border-amber-600 focus:border-blue-500 focus:ring-blue-500'
          : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
    } ${readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-not-allowed' : ''}`;

    const fieldWrapper = (content) => (
      <div key={field.key} className={`${field.type === 'textarea' ? 'md:col-span-2' : ''} ${isRequired && !hasValue ? 'relative' : ''}`}>
        <label htmlFor={field.key} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {field.label} 
          {isRequired && (
            <span className="text-red-500 ml-1" title="Required field">*</span>
          )}
          {isRequired && !hasValue && (
            <span className="text-xs text-amber-600 dark:text-amber-400 ml-2 font-normal">(Required)</span>
          )}
        </label>
        {content}
        {isRequired && !hasValue && !hasError && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">This field is required</p>
        )}
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
      {fieldGroups.map((group) => {
        const groupStats = getGroupStats(group);
        return (
          <CollapsibleSection
            key={group.key}
            title={group.title}
            defaultOpen={group.defaultOpen}
            stats={groupStats.stats}
            completionPercentage={groupStats.completionPercentage}
            variant="card"
          >
            {group.customContent && group.key === 'classification' ? (
              // Custom content for classification section
              <div className="space-y-6">
                {/* Required fields summary */}
                {(() => {
                  const requiredFields = group.fields.filter(field => isFieldRequired(field.key, formData));
                  const missingRequired = requiredFields.filter(field => {
                    const value = formData[field.key];
                    // For boolean fields, both true and false are valid values
                    if (typeof value === 'boolean') return false;
                    // For other fields, check if they're empty
                    return !value || value === '';
                  });
                  
                  if (requiredFields.length > 0) {
                    return (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="text-sm">
                          <span className="font-medium text-blue-800 dark:text-blue-200">
                            Required fields in this section: 
                          </span>
                          <span className="text-blue-700 dark:text-blue-300 ml-1">
                            {requiredFields.length > 0 && missingRequired.length > 0 && (
                              <span className="text-amber-700 dark:text-amber-300">
                                {missingRequired.length} of {requiredFields.length} missing
                              </span>
                            )}
                            {requiredFields.length > 0 && missingRequired.length === 0 && (
                              <span className="text-green-700 dark:text-green-300">
                                All {requiredFields.length} completed
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                
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
              <div className="space-y-4">
                {/* Required fields summary */}
                {(() => {
                  const requiredFields = group.fields.filter(field => isFieldRequired(field.key, formData));
                  const missingRequired = requiredFields.filter(field => {
                    const value = formData[field.key];
                    // For boolean fields, both true and false are valid values
                    if (typeof value === 'boolean') return false;
                    // For other fields, check if they're empty
                    return !value || value === '';
                  });
                  
                  if (requiredFields.length > 0) {
                    return (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="text-sm">
                          <span className="font-medium text-blue-800 dark:text-blue-200">
                            Required fields in this section: 
                          </span>
                          <span className="text-blue-700 dark:text-blue-300 ml-1">
                            {missingRequired.length > 0 && (
                              <span className="text-amber-700 dark:text-amber-300">
                                {missingRequired.length} of {requiredFields.length} missing
                              </span>
                            )}
                            {missingRequired.length === 0 && (
                              <span className="text-green-700 dark:text-green-300">
                                All {requiredFields.length} completed
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.fields.map(renderField)}
                </div>
              </div>
            )}
          </CollapsibleSection>
        );
      })}
    </div>
  );
};

export default TabSpecificFormSection;