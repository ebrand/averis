import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  ExclamationTriangleIcon,
  EnvelopeIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

const GetAccessPage = () => {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Access Required
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          You need additional permissions to access Product MDM
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">

          {/* Access Denied Message */}
          <div className="mb-8">
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Access Denied
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>
                      Your account does not have the required permissions to access the Product MDM system. 
                      Please contact your administrator to request appropriate access.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-gray-500" />
              Next Steps
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>Contact your system administrator or IT department</li>
                <li>Request access to the Product MDM system</li>
                <li>Explain your job responsibilities and what access you need</li>
                <li>Wait for the administrator to assign the appropriate permissions to your account</li>
                <li>Once assigned, sign out and sign back in to refresh your permissions</li>
              </ol>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-500" />
              Need Help?
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                If you believe you should have access to this system or if you have questions about permissions, 
                please contact your administrator or IT support team. Include your email address and a description 
                of your job responsibilities.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Refresh Permissions
            </button>
            <button
              onClick={logout}
              className="w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm bg-red-600 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GetAccessPage