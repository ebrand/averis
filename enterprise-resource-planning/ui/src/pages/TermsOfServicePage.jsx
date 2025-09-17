import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

export const TermsOfServicePage = () => {
  const { userProfile } = useAuth()
  const { isDark } = useTheme()
  
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'} p-8`}>
          
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
              Terms of Service
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-yellow-900/20 border-yellow-700/30' : 'bg-yellow-50 border-yellow-200'} border`}>
              <p className={`text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-800'}`}>
                <strong>Notice:</strong> This is placeholder content for legal review. Final terms will be provided by legal counsel.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}>
            
            <section className="mb-8">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                1. Acceptance of Terms
              </h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                By accessing and using the Product Master Data Management (Product MDM) system, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                2. Use License
              </h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                Permission is granted to temporarily access the Product MDM system for transient viewing and business purposes only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className={`list-disc pl-6 mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <li>modify or copy the materials</li>
                <li>use the materials for any commercial purpose or for any public display</li>
                <li>attempt to reverse engineer any software contained in the system</li>
                <li>remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                3. Data Protection and Privacy
              </h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                Your privacy is important to us. All product data, user information, and business processes within the Product MDM system are subject to our Privacy Policy and data protection measures. By using this system, you agree to the collection and use of information in accordance with our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                4. User Responsibilities
              </h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                Users of the Product MDM system agree to:
              </p>
              <ul className={`list-disc pl-6 mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <li>Maintain the confidentiality of their login credentials</li>
                <li>Use the system only for authorized business purposes</li>
                <li>Ensure data accuracy and completeness when entering product information</li>
                <li>Follow established workflows and approval processes</li>
                <li>Report security incidents or unauthorized access immediately</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                5. System Availability
              </h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                While we strive to maintain system availability, we do not guarantee that the Product MDM system will be available at all times. The system may be temporarily unavailable due to maintenance, updates, or unforeseen technical issues.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                6. Limitation of Liability
              </h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                In no event shall the company or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the Product MDM system, even if the company or a company authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                7. Revisions and Updates
              </h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                These terms may be revised at any time without notice. By using the Product MDM system, you are agreeing to be bound by the current version of these terms of service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                8. Contact Information
              </h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                If you have any questions about these Terms of Service, please contact:
              </p>
              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} p-4 rounded-lg`}>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Legal Department</strong><br />
                  Email: legal@company.com<br />
                  Phone: [To be provided]<br />
                  Address: [To be provided]
                </p>
              </div>
            </section>

          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} text-center`}>
              © {new Date().getFullYear()} Product MDM System. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default TermsOfServicePage