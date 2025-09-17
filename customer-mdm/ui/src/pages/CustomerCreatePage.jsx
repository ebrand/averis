import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerForm from '../components/forms/CustomerForm'

const CustomerCreatePage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (customerData) => {
    setLoading(true)
    setError(null)

    try {
      console.log('Creating customer:', customerData)

      const response = await fetch('http://localhost:6007/api/customers', {
        method: 'POST',
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
      console.log('Customer created successfully:', result)

      // Navigate back to customers list with success message
      navigate('/customers', { 
        state: { 
          message: `Customer "${customerData.firstName} ${customerData.lastName}" created successfully!`,
          type: 'success'
        }
      })
    } catch (err) {
      console.error('Error creating customer:', err)
      setError('Failed to create customer: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/customers')
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
              <h3 className="text-sm font-medium text-red-800">Error creating customer</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <CustomerForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        isEdit={false}
      />
    </>
  )
}

export default CustomerCreatePage