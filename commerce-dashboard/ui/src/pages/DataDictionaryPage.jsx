import React, { useState, useEffect } from 'react'
import { useRole } from '../contexts/RoleContext'
import { 
  BookOpenIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

const DataDictionaryPage = () => {
  const { canViewProducts } = useRole()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedSchema, setSelectedSchema] = useState('all')
  const [editingField, setEditingField] = useState(null)
  const [fieldData, setFieldData] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState(new Set())

  // API base URL - use relative path to leverage Vite proxy configuration
  const API_BASE_URL = '/api'

  // Fetch data dictionary from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch both data dictionary entries and categories
        const [dictionaryResponse, categoriesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/data-dictionary`),
          fetch(`${API_BASE_URL}/data-dictionary/categories`)
        ])

        if (!dictionaryResponse.ok || !categoriesResponse.ok) {
          throw new Error('Failed to fetch data dictionary')
        }

        const dictionaryData = await dictionaryResponse.json()
        const categoriesData = await categoriesResponse.json()

        // Transform API data to match UI expectations
        const transformedData = dictionaryData.dataDictionary.map(field => ({
          id: field.id,
          columnName: field.columnName,
          displayName: field.displayName,
          dataType: field.dataType,
          required: field.requiredForActive,
          maintenanceRole: field.maintenanceRole,
          schemas: field.getSchemas ? field.getSchemas() : getSchemaList(field),
          description: field.description,
          category: field.category,
          maxLength: field.maxLength,
          minLength: field.minLength,
          validationPattern: field.validationPattern,
          allowedValues: field.allowedValues,
          sortOrder: field.sortOrder,
          isSystemField: field.isSystemField,
          isEditable: field.isEditable
        }))

        setFieldData(transformedData)
        setCategories(categoriesData.categories || [])
      } catch (err) {
        console.error('Error fetching data dictionary:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Helper function to get schema list from field flags
  const getSchemaList = (field) => {
    const schemas = []
    if (field.inProductMdm) schemas.push('ProductMDM')
    if (field.inPricingMdm) schemas.push('PricingMDM')
    if (field.inEcommerce) schemas.push('Ecommerce')
    return schemas
  }

  const handleFieldEdit = (field) => {
    // Only allow editing if the field is editable and not a system field
    if (field.isSystemField || field.isEditable === false) {
      return
    }
    setEditingField({ ...field })
  }

  const handleFieldSave = async () => {
    if (!editingField) return
    
    try {
      setSaving(true)
      setError(null)

      // Prepare data for API (convert schemas array back to flags)
      const updateData = {
        displayName: editingField.displayName,
        description: editingField.description,
        requiredForActive: editingField.required,
        maintenanceRole: editingField.maintenanceRole,
        inProductMdm: editingField.schemas.includes('ProductMDM'),
        inPricingMdm: editingField.schemas.includes('PricingMDM'),
        inEcommerce: editingField.schemas.includes('Ecommerce')
      }

      const response = await fetch(`${API_BASE_URL}/data-dictionary/${editingField.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update field')
      }

      const updatedField = await response.json()
      
      // Transform updated field back to UI format
      const transformedField = {
        id: updatedField.id,
        columnName: updatedField.columnName,
        displayName: updatedField.displayName,
        dataType: updatedField.dataType,
        required: updatedField.requiredForActive,
        maintenanceRole: updatedField.maintenanceRole,
        schemas: getSchemaList(updatedField),
        description: updatedField.description,
        category: updatedField.category,
        maxLength: updatedField.maxLength,
        minLength: updatedField.minLength,
        validationPattern: updatedField.validationPattern,
        allowedValues: updatedField.allowedValues,
        sortOrder: updatedField.sortOrder,
        isSystemField: updatedField.isSystemField,
        isEditable: updatedField.isEditable
      }

      // Update local state
      setFieldData(prev => prev.map(field => 
        field.id === editingField.id ? transformedField : field
      ))
      setEditingField(null)
    } catch (err) {
      console.error('Error saving field:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleFieldCancel = () => {
    setEditingField(null)
  }

  const toggleSection = (role) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(role)) {
        newSet.delete(role)
      } else {
        newSet.add(role)
      }
      return newSet
    })
  }

  const handleFieldChange = (field, value) => {
    setEditingField(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const roles = [
    { value: 'all', label: 'All Roles' },
    { value: 'product_marketing', label: 'Product Marketing' },
    { value: 'product_legal', label: 'Legal' },
    { value: 'product_finance', label: 'Finance' },
    { value: 'product_salesops', label: 'Sales Ops' },
    { value: 'product_contracts', label: 'Contracts' },
    { value: 'system', label: 'System' }
  ]

  // Role display configuration for sections
  const roleDisplayConfig = {
    'product_marketing': { 
      label: 'Product Marketing', 
      description: 'Brand, naming, categorization, and promotional attributes',
      color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      headerColor: 'text-blue-800 dark:text-blue-200'
    },
    'product_finance': { 
      label: 'Finance', 
      description: 'Pricing, costs, and financial calculations',
      color: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      headerColor: 'text-green-800 dark:text-green-200'
    },
    'product_legal': { 
      label: 'Legal & Compliance', 
      description: 'Regulatory requirements and compliance attributes',
      color: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
      headerColor: 'text-purple-800 dark:text-purple-200'
    },
    'product_salesops': { 
      label: 'Sales Operations', 
      description: 'Sales enablement, fulfillment, and operational flags',
      color: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
      headerColor: 'text-orange-800 dark:text-orange-200'
    },
    'product_contracts': { 
      label: 'Contracts', 
      description: 'Contract-specific terms and conditions',
      color: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
      headerColor: 'text-amber-800 dark:text-amber-200'
    },
    'system': { 
      label: 'System Fields', 
      description: 'System-managed fields and audit information',
      color: 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-700',
      headerColor: 'text-gray-800 dark:text-gray-200'
    }
  }

  const schemas = [
    { value: 'all', label: 'All Schemas' },
    { value: 'ProductMDM', label: 'Product MDM' },
    { value: 'PricingMDM', label: 'Pricing MDM' },
    { value: 'Ecommerce', label: 'E-commerce' }
  ]

  const filteredData = fieldData.filter(field => {
    const matchesSearch = !searchTerm || 
      field.columnName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = selectedRole === 'all' || field.maintenanceRole === selectedRole
    const matchesSchema = selectedSchema === 'all' || field.schemas.includes(selectedSchema)
    
    return matchesSearch && matchesRole && matchesSchema
  })

  // Group data by maintenance role instead of category
  const groupedByRole = Object.keys(roleDisplayConfig).reduce((acc, role) => {
    acc[role] = filteredData.filter(field => field.maintenanceRole === role).sort((a, b) => a.sortOrder - b.sortOrder)
    return acc
  }, {})

  if (!canViewProducts()) {
    return null
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading data dictionary...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to Load Data Dictionary</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BookOpenIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Data Dictionary</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Comprehensive schema documentation for Product MDM, Pricing MDM, and E-commerce systems
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search fields, descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            {/* Role Filter */}
            <div className="relative">
              <FunnelIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
            
            {/* Schema Filter */}
            <div>
              <select
                value={selectedSchema}
                onChange={(e) => setSelectedSchema(e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {schemas.map(schema => (
                  <option key={schema.value} value={schema.value}>{schema.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredData.length} of {fieldData.length} fields
        </div>
      </div>

      {/* Data Dictionary by Role */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {Object.keys(roleDisplayConfig).map(role => {
          const roleFields = groupedByRole[role]
          if (roleFields.length === 0) return null
          
          const config = roleDisplayConfig[role]
          const isCollapsed = collapsedSections.has(role)
          
          return (
            <div key={role} className={`mb-6 border rounded-lg ${config.color}`}>
              {/* Role Header */}
              <button
                onClick={() => toggleSection(role)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-opacity-70 transition-colors rounded-t-lg"
              >
                <div>
                  <h2 className={`text-lg font-semibold ${config.headerColor} flex items-center`}>
                    {config.label} ({roleFields.length})
                  </h2>
                  <p className={`text-sm mt-1 ${config.headerColor} opacity-75`}>
                    {config.description}
                  </p>
                </div>
                {isCollapsed ? (
                  <ChevronRightIcon className={`h-5 w-5 ${config.headerColor}`} />
                ) : (
                  <ChevronDownIcon className={`h-5 w-5 ${config.headerColor}`} />
                )}
              </button>

              {/* Role Content */}
              {!isCollapsed && (
                <div className="bg-white dark:bg-gray-800 rounded-b-lg overflow-hidden border-t">
                  <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Column Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Display Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Data Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Required for Active
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Maintenance Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Schemas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {roleFields.map((field) => (
                        <tr key={field.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {field.columnName}
                            </code>
                          </td>
                          <td className="px-6 py-4">
                            {editingField?.id === field.id ? (
                              <input
                                type="text"
                                value={editingField.displayName}
                                onChange={(e) => handleFieldChange('displayName', e.target.value)}
                                className="w-full text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                              />
                            ) : (
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {field.displayName}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {field.dataType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingField?.id === field.id ? (
                              <input
                                type="checkbox"
                                checked={editingField.required}
                                onChange={(e) => handleFieldChange('required', e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            ) : (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                field.required
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {field.required ? 'Required' : 'Optional'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingField?.id === field.id ? (
                              <select
                                value={editingField.maintenanceRole}
                                onChange={(e) => handleFieldChange('maintenanceRole', e.target.value)}
                                className="text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                              >
                                {roles.filter(r => r.value !== 'all').map(role => (
                                  <option key={role.value} value={role.value}>{role.label}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {roles.find(r => r.value === field.maintenanceRole)?.label || field.maintenanceRole}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {field.schemas.map(schema => (
                                <span key={schema} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                                  {schema}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {editingField?.id === field.id ? (
                              <textarea
                                value={editingField.description}
                                onChange={(e) => handleFieldChange('description', e.target.value)}
                                rows="2"
                                className="w-full text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                              />
                            ) : (
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {field.description}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingField?.id === field.id ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleFieldSave}
                                  disabled={saving}
                                  className={`${
                                    saving 
                                      ? 'text-gray-400 cursor-not-allowed' 
                                      : 'text-green-600 hover:text-green-900 dark:text-green-400'
                                  }`}
                                  title={saving ? 'Saving...' : 'Save changes'}
                                >
                                  {saving ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                                  ) : (
                                    <CheckIcon className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={handleFieldCancel}
                                  disabled={saving}
                                  className={`${
                                    saving 
                                      ? 'text-gray-400 cursor-not-allowed' 
                                      : 'text-red-600 hover:text-red-900 dark:text-red-400'
                                  }`}
                                  title="Cancel changes"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              field.isSystemField || field.isEditable === false ? (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {field.isSystemField ? 'System' : 'Read-only'}
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleFieldEdit(field)}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                                  title="Edit field"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DataDictionaryPage