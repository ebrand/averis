import React from 'react'
import TabSpecificFormSection from '../TabSpecificFormSection'
import GoForLaunchApproval from '../GoForLaunchApproval'

const MarketingTab = ({ formData, onChange, errors, readOnly, approvals, onApprove, onScrub }) => {
  return (
    <div className="space-y-8">
      {/* Marketing-specific collapsible sections */}
      <TabSpecificFormSection
        formData={formData}
        onChange={onChange}
        errors={errors}
        readOnly={readOnly}
        tabId="marketing"
      />

      {/* Go for Launch Approval */}
      <GoForLaunchApproval
        tabId="marketing"
        formData={formData}
        approvals={approvals}
        onApprove={onApprove}
        onScrub={onScrub}
      />
    </div>
  )
}

export default MarketingTab