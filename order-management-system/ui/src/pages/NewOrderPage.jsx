import React from 'react'
import { PlusCircleIcon } from '@heroicons/react/24/outline'

const NewOrderPage = () => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center py-12">
        <PlusCircleIcon className="mx-auto h-16 w-16 text-purple-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Create New Order</h3>
        <p className="mt-1 text-sm text-gray-500">
          Order creation functionality will be implemented here.
        </p>
        <div className="mt-6">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <PlusCircleIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Order Form
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewOrderPage