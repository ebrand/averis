import React from 'react'
import { useParams } from 'react-router-dom'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

const OrderDetailPage = () => {
  const { id } = useParams()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-16 w-16 text-purple-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Order Details</h3>
        <p className="mt-1 text-sm text-gray-500">
          Detailed order view for Order ID: {id || 'N/A'}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Order detail functionality will be implemented here.
        </p>
      </div>
    </div>
  )
}

export default OrderDetailPage