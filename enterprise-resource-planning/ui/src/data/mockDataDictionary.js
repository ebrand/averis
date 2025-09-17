// Mock Data Dictionary - comprehensive field definitions for Product MDM

export const mockDataDictionary = [
  // Basic Product Information
  {
    id: 1,
    columnName: 'id',
    displayName: 'Product ID',
    dataType: 'UUID',
    required: true,
    maintenanceRole: 'system',
    schemas: ['ProductMDM', 'PricingMDM', 'Ecommerce'],
    description: 'Unique identifier for the product',
    category: 'Basic Information',
    maxLength: null,
    minLength: null,
    validationPattern: null,
    allowedValues: null,
    sortOrder: 1,
    isSystemField: true,
    isEditable: false
  },
  {
    id: 2,
    columnName: 'sku',
    displayName: 'SKU',
    dataType: 'VARCHAR',
    required: true,
    maintenanceRole: 'product_marketing',
    schemas: ['ProductMDM', 'PricingMDM', 'Ecommerce'],
    description: 'Stock Keeping Unit - unique product identifier for inventory',
    category: 'Basic Information',
    maxLength: 100,
    minLength: 3,
    validationPattern: '^[A-Z0-9-]+$',
    allowedValues: null,
    sortOrder: 2,
    isSystemField: false,
    isEditable: true
  },
  {
    id: 3,
    columnName: 'name',
    displayName: 'Product Name',
    dataType: 'VARCHAR',
    required: true,
    maintenanceRole: 'product_marketing',
    schemas: ['ProductMDM', 'PricingMDM', 'Ecommerce'],
    description: 'Official product name for marketing and sales',
    category: 'Basic Information',
    maxLength: 255,
    minLength: 5,
    validationPattern: null,
    allowedValues: null,
    sortOrder: 3,
    isSystemField: false,
    isEditable: true
  },
  {
    id: 4,
    columnName: 'description',
    displayName: 'Description',
    dataType: 'TEXT',
    required: true,
    maintenanceRole: 'product_marketing',
    schemas: ['ProductMDM', 'Ecommerce'],
    description: 'Detailed product description for customer-facing content',
    category: 'Basic Information',
    maxLength: 2000,
    minLength: 50,
    validationPattern: null,
    allowedValues: null,
    sortOrder: 4,
    isSystemField: false,
    isEditable: true
  },
  
  // Pricing Information
  {
    id: 5,
    columnName: 'list_price',
    displayName: 'List Price',
    dataType: 'DECIMAL',
    required: true,
    maintenanceRole: 'product_finance',
    schemas: ['PricingMDM', 'Ecommerce'],
    description: 'Manufacturer suggested retail price',
    category: 'Pricing',
    maxLength: null,
    minLength: null,
    validationPattern: '^[0-9]+\\.?[0-9]*$',
    allowedValues: null,
    sortOrder: 10,
    isSystemField: false,
    isEditable: true
  },
  {
    id: 6,
    columnName: 'cost_price',
    displayName: 'Cost Price',
    dataType: 'DECIMAL',
    required: true,
    maintenanceRole: 'product_finance',
    schemas: ['PricingMDM'],
    description: 'Internal cost price for margin calculations',
    category: 'Pricing',
    maxLength: null,
    minLength: null,
    validationPattern: '^[0-9]+\\.?[0-9]*$',
    allowedValues: null,
    sortOrder: 11,
    isSystemField: false,
    isEditable: true
  },
  {
    id: 7,
    columnName: 'currency',
    displayName: 'Currency',
    dataType: 'VARCHAR',
    required: true,
    maintenanceRole: 'product_finance',
    schemas: ['PricingMDM', 'Ecommerce'],
    description: 'Currency code for pricing (ISO 4217)',
    category: 'Pricing',
    maxLength: 3,
    minLength: 3,
    validationPattern: '^[A-Z]{3}$',
    allowedValues: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    sortOrder: 12,
    isSystemField: false,
    isEditable: true
  },

  // Legal Information
  {
    id: 8,
    columnName: 'regulatory_status',
    displayName: 'Regulatory Status',
    dataType: 'VARCHAR',
    required: true,
    maintenanceRole: 'product_legal',
    schemas: ['ProductMDM'],
    description: 'Current regulatory approval status',
    category: 'Legal & Compliance',
    maxLength: 50,
    minLength: null,
    validationPattern: null,
    allowedValues: ['Approved', 'Pending', 'Under Review', 'Rejected', 'Not Required'],
    sortOrder: 20,
    isSystemField: false,
    isEditable: true
  },
  {
    id: 9,
    columnName: 'compliance_notes',
    displayName: 'Compliance Notes',
    dataType: 'TEXT',
    required: false,
    maintenanceRole: 'product_legal',
    schemas: ['ProductMDM'],
    description: 'Additional notes regarding regulatory compliance',
    category: 'Legal & Compliance',
    maxLength: 1000,
    minLength: null,
    validationPattern: null,
    allowedValues: null,
    sortOrder: 21,
    isSystemField: false,
    isEditable: true
  },

  // Sales Information
  {
    id: 10,
    columnName: 'sales_channel',
    displayName: 'Sales Channel',
    dataType: 'VARCHAR',
    required: true,
    maintenanceRole: 'product_salesops',
    schemas: ['ProductMDM', 'PricingMDM', 'Ecommerce'],
    description: 'Primary sales channel for this product',
    category: 'Sales & Distribution',
    maxLength: 100,
    minLength: null,
    validationPattern: null,
    allowedValues: ['Online', 'Retail', 'Wholesale', 'Direct Sales', 'Partner'],
    sortOrder: 30,
    isSystemField: false,
    isEditable: true
  },
  {
    id: 11,
    columnName: 'availability_region',
    displayName: 'Availability Region',
    dataType: 'VARCHAR',
    required: true,
    maintenanceRole: 'product_salesops',
    schemas: ['ProductMDM', 'PricingMDM', 'Ecommerce'],
    description: 'Geographic regions where product is available',
    category: 'Sales & Distribution',
    maxLength: 100,
    minLength: null,
    validationPattern: null,
    allowedValues: ['North America', 'Europe', 'Asia Pacific', 'Global', 'US Only'],
    sortOrder: 31,
    isSystemField: false,
    isEditable: true
  },

  // Contract Information
  {
    id: 12,
    columnName: 'contract_terms',
    displayName: 'Contract Terms',
    dataType: 'TEXT',
    required: false,
    maintenanceRole: 'product_contracts',
    schemas: ['ProductMDM'],
    description: 'Specific contract terms and conditions for this product',
    category: 'Contracts & Agreements',
    maxLength: 2000,
    minLength: null,
    validationPattern: null,
    allowedValues: null,
    sortOrder: 40,
    isSystemField: false,
    isEditable: true
  },
  {
    id: 13,
    columnName: 'warranty_period',
    displayName: 'Warranty Period',
    dataType: 'INTEGER',
    required: false,
    maintenanceRole: 'product_contracts',
    schemas: ['ProductMDM', 'Ecommerce'],
    description: 'Warranty period in months',
    category: 'Contracts & Agreements',
    maxLength: null,
    minLength: null,
    validationPattern: '^[0-9]+$',
    allowedValues: null,
    sortOrder: 41,
    isSystemField: false,
    isEditable: true
  },

  // System Fields
  {
    id: 14,
    columnName: 'status',
    displayName: 'Status',
    dataType: 'VARCHAR',
    required: true,
    maintenanceRole: 'system',
    schemas: ['ProductMDM', 'PricingMDM', 'Ecommerce'],
    description: 'Current product status in the system',
    category: 'System',
    maxLength: 50,
    minLength: null,
    validationPattern: null,
    allowedValues: ['Draft', 'Active', 'Inactive', 'Discontinued'],
    sortOrder: 100,
    isSystemField: true,
    isEditable: false
  },
  {
    id: 15,
    columnName: 'created_at',
    displayName: 'Created Date',
    dataType: 'TIMESTAMP',
    required: true,
    maintenanceRole: 'system',
    schemas: ['ProductMDM'],
    description: 'Timestamp when the product was created',
    category: 'System',
    maxLength: null,
    minLength: null,
    validationPattern: null,
    allowedValues: null,
    sortOrder: 101,
    isSystemField: true,
    isEditable: false
  },
  {
    id: 16,
    columnName: 'updated_at',
    displayName: 'Last Updated',
    dataType: 'TIMESTAMP',
    required: true,
    maintenanceRole: 'system',
    schemas: ['ProductMDM'],
    description: 'Timestamp when the product was last modified',
    category: 'System',
    maxLength: null,
    minLength: null,
    validationPattern: null,
    allowedValues: null,
    sortOrder: 102,
    isSystemField: true,
    isEditable: false
  }
]

export const mockCategories = [
  'Basic Information',
  'Pricing',
  'Legal & Compliance', 
  'Sales & Distribution',
  'Contracts & Agreements',
  'System'
]

// Filter functions similar to API
export const searchDataDictionary = (searchTerm = '', roleFilter = 'all', schemaFilter = 'all') => {
  let filtered = mockDataDictionary

  // Search filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    filtered = filtered.filter(field => 
      field.columnName.toLowerCase().includes(term) ||
      field.displayName.toLowerCase().includes(term) ||
      field.description.toLowerCase().includes(term)
    )
  }

  // Role filter
  if (roleFilter !== 'all') {
    filtered = filtered.filter(field => field.maintenanceRole === roleFilter)
  }

  // Schema filter
  if (schemaFilter !== 'all') {
    filtered = filtered.filter(field => field.schemas.includes(schemaFilter))
  }

  return filtered
}

export const getFieldById = (id) => {
  return mockDataDictionary.find(field => field.id === id)
}

export const getCategories = () => {
  return mockCategories
}