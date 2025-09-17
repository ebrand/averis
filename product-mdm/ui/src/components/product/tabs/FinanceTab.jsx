import React from 'react'
import TabSpecificFormSection from '../TabSpecificFormSection'
import GoForLaunchApproval from '../GoForLaunchApproval'

const FinanceTab = ({ formData, onChange, errors, readOnly, approvals, onApprove, onScrub }) => {
  return (
    <div className="space-y-8">
      {/* Finance-specific collapsible sections */}
      <TabSpecificFormSection
        formData={formData}
        onChange={onChange}
        errors={errors}
        readOnly={readOnly}
        tabId="finance"
      />

      {/* Go for Launch Approval */}
      <GoForLaunchApproval
        tabId="finance"
        formData={formData}
        approvals={approvals}
        onApprove={onApprove}
        onScrub={onScrub}
      />
    </div>
  )
}

export default FinanceTab