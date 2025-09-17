import React from 'react'
import TabSpecificFormSection from '../TabSpecificFormSection'
import GoForLaunchApproval from '../GoForLaunchApproval'

const LegalTab = ({ formData, onChange, errors, readOnly, approvals, onApprove, onScrub }) => {
  return (
    <div className="space-y-8">
      {/* Legal-specific collapsible sections */}
      <TabSpecificFormSection
        formData={formData}
        onChange={onChange}
        errors={errors}
        readOnly={readOnly}
        tabId="legal"
      />

      {/* Go for Launch Approval */}
      <GoForLaunchApproval
        tabId="legal"
        formData={formData}
        approvals={approvals}
        onApprove={onApprove}
        onScrub={onScrub}
      />
    </div>
  )
}

export default LegalTab