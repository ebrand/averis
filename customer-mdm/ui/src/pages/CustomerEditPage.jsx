import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CustomerForm from '../components/forms/CustomerForm'

const CustomerEditPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fetchLoading, setFetchLoading] = useState(true)

  // Fetch customer data on mount
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setFetchLoading(true)
        const response = await fetch(`/api/customers/${id}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'omit'
        })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Customer not found')
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const customerData = await response.json()
        console.log('Fetched customer:', customerData)
        setCustomer(customerData)
      } catch (err) {
        console.error('Error fetching customer:', err)
        setError('Failed to load customer: ' + err.message)
      } finally {
        setFetchLoading(false)
      }
    }

    if (id) {
      fetchCustomer()
    }
  }, [id])

  const handleSubmit = async (customerData) => {
    setLoading(true)
    setError(null)

    try {
      console.log('Updating customer:', customerData)

      const response = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        body: JSON.stringify(customerData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Customer updated successfully:', result)

      // Navigate back to customers list with success message
      navigate('/customers', { 
        state: { 
          message: `Customer "${customerData.firstName} ${customerData.lastName}" updated successfully!`,
          type: 'success'
        }
      })
    } catch (err) {
      console.error('Error updating customer:', err)
      setError('Failed to update customer: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/customers')
  }

  if (fetchLoading) {
    return (
      <div className="bg-red-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading customer data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !customer) {
    return (
      <div className="bg-red-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Failed to Load Customer</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button 
              onClick={() => navigate('/customers')} 
              className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors"
            >
              Back to Customers
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error updating customer</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <CustomerForm
        customer={customer}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={true}
      />
    </>
  )
}

export default CustomerEditPage