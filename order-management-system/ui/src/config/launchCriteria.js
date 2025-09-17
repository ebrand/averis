// Define "Go for Launch" criteria for each tab
// This configuration determines what constitutes readiness for approval in each department

export const LAUNCH_CRITERIA = {
  marketing: {
    name: 'Marketing & Product Info',
    requiredFields: [
      // Temporarily removed all required fields to allow Go for Launch without validation
      // { field: 'sku_code', label: 'SKU Code', description: 'Unique product identifier' },
      // { field: 'name', label: 'Product Name', description: 'Official product name' },
      // { field: 'display_name', label: 'Display Name', description: 'Customer-facing product name' },
      // { field: 'description', label: 'Description', description: 'Product description for customers' },
      // { field: 'type', label: 'Product Type', description: 'Product category classification' },
      // { field: 'categorization', label: 'Categorization', description: 'Product categorization tags' }
    ],
    checklistItems: [
      'Product name is customer-friendly and brand-compliant',
      'Description accurately represents product features',
      'Product categorization aligns with marketing strategy',
      'All marketing copy has been reviewed and approved'
    ]
  },
  
  legal: {
    name: 'Legal',
    requiredFields: [
      // Temporarily removed all required fields to allow Go for Launch without validation
      // { field: 'license_description', label: 'License Description', description: 'Legal licensing terms' },
      // { field: 'license_required_flag', label: 'License Required', description: 'Whether licensing is required' },
      // { field: 'license_key_type', label: 'License Key Type', description: 'Type of license key if required' }
    ],
    checklistItems: [
      'All licensing requirements have been defined',
      'Legal compliance has been verified',
      'Terms and conditions are finalized',
      'Intellectual property rights are cleared',
      'Export/import regulations have been reviewed'
    ]
  },
  
  finance: {
    name: 'Finance',
    requiredFields: [
      // Temporarily removed all required fields to allow Go for Launch without validation
      // { field: 'base_price', label: 'Base Price', description: 'Product base price', validator: (value) => value > 0 },
      // { field: 'revenue_category', label: 'Revenue Category', description: 'Revenue classification' },
      // { field: 'seat_based_pricing_flag', label: 'Seat-based Pricing', description: 'Pricing model type' }
    ],
    checklistItems: [
      'Pricing strategy has been approved',
      'Cost analysis is complete and profitable',
      'Revenue projections are documented',
      'Pricing aligns with market positioning',
      'Financial impact assessment is complete'
    ]
  },
  
  sales: {
    name: 'Sales Ops',
    requiredFields: [
      // Temporarily removed all required fields to allow Go for Launch without validation
      // { field: 'available_flag', label: 'Available for Sale', description: 'Product availability status' },
      // { field: 'web_display_flag', label: 'Web Display', description: 'Online visibility setting' },
      // { field: 'change_code', label: 'Change Code', description: 'Product change classification' }
    ],
    checklistItems: [
      'Sales team has been trained on the product',
      'Sales materials and collateral are ready',
      'Product positioning is defined',
      'Competitive analysis is complete',
      'Sales process and workflows are established'
    ]
  },
  
  contracts: {
    name: 'Contracts & Services',
    requiredFields: [
      // Temporarily removed all required fields to allow Go for Launch without validation
      // { field: 'subsidiary', label: 'Subsidiary', description: 'Operating subsidiary' },
      // { field: 'base_product', label: 'Base Product', description: 'Base product relationship if applicable' },
      // { field: 'upgrade_type', label: 'Upgrade Type', description: 'Product upgrade classification' }
    ],
    checklistItems: [
      'Service level agreements are defined',
      'Support processes are in place',
      'Contract templates are prepared',
      'Partner agreements are finalized',
      'Service delivery capacity is confirmed'
    ]
  }
}

// Helper function to check if a field meets its criteria
export const checkFieldCriteria = (formData, field, criteria) => {
  const value = formData[field]
  
  if (!value) return false
  
  // Check if field has a custom validator
  if (criteria.validator && typeof criteria.validator === 'function') {
    return criteria.validator(value)
  }
  
  // Default validation - just check if value exists and is not empty
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  
  if (typeof value === 'boolean') {
    return true // Boolean fields are always valid if set
  }
  
  if (Array.isArray(value)) {
    return value.length > 0
  }
  
  return value !== null && value !== undefined
}

// Check if all required fields for a tab are complete
export const isTabReadyForApproval = (formData, tabId) => {
  const criteria = LAUNCH_CRITERIA[tabId]
  if (!criteria) return false
  
  return criteria.requiredFields.every(fieldCriteria => 
    checkFieldCriteria(formData, fieldCriteria.field, fieldCriteria)
  )
}

// Get completion status for a tab
export const getTabCompletionStatus = (formData, tabId) => {
  const criteria = LAUNCH_CRITERIA[tabId]
  if (!criteria) return { completed: 0, total: 0, percentage: 0 }
  
  const completed = criteria.requiredFields.filter(fieldCriteria => 
    checkFieldCriteria(formData, fieldCriteria.field, fieldCriteria)
  ).length
  
  const total = criteria.requiredFields.length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  
  return { completed, total, percentage }
}