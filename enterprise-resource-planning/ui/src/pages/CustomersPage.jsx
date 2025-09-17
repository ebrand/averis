import React, { useState, useEffect } from 'react'
import { useRole } from '../contexts/RoleContext'
import { 
  UsersIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

const CustomersPage = () => {
  const { canAccessAdminFeatures } = useRole()
  const [searchTerm, setSearchTerm] = useState('')
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Mock customer data for initial setup
  const mockCustomers = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      company: 'Acme Corp',
      status: 'Active',
      createdAt: '2024-01-15',
      lastActivity: '2024-08-20'
    },
    {
      id: '2', 
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@techcorp.com',
      company: 'TechCorp',
      status: 'Active',
      createdAt: '2024-02-10',
      lastActivity: '2024-08-25'
    },
    {
      id: '3',
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@startup.io',
      company: 'StartupIO',
      status: 'Prospect',
      createdAt: '2024-08-01',
      lastActivity: '2024-08-26'
    }
  ]

  useEffect(() => {
    // Simulate API call
    const fetchCustomers = async () => {
      try {
        setLoading(true)
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        setCustomers(mockCustomers)
      } catch (err) {
        setError('Failed to load customers')
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase()
    return customer.firstName.toLowerCase().includes(searchLower) ||
           customer.lastName.toLowerCase().includes(searchLower) ||
           customer.email.toLowerCase().includes(searchLower) ||
           customer.company.toLowerCase().includes(searchLower)
  })

  if (loading) {
    return (
      <div className="bg-red-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading customers...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-red-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-red-700 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Manage your customer relationships and accounts
                </p>
              </div>
            </div>
            {canAccessAdminFeatures() && (
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Customer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-700 focus:ring-red-700"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <FunnelIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <select className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-700 focus:ring-red-700">
                <option>All Statuses</option>
                <option>Active</option>
                <option>Prospect</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      </div>

      {/* Customer List */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredCustomers.map((customer) => (
              <li key={customer.id}>
                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-red-700 font-medium">
                          {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {customer.firstName} {customer.lastName}
                        </div>
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.status === 'Active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : customer.status === 'Prospect'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {customer.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {customer.email} • {customer.company}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Created: {customer.createdAt} • Last Activity: {customer.lastActivity}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button className="text-red-700 hover:text-red-900 dark:text-red-400 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default CustomersPage