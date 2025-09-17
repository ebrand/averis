import React from 'react'
import TabSpecificFormSection from '../TabSpecificFormSection'
import GoForLaunchApproval from '../GoForLaunchApproval'

const SalesTab = ({ formData, onChange, errors, readOnly, approvals, onApprove, onScrub }) => {
  return (
    <div className="space-y-8">
      {/* Sales-specific collapsible sections */}
      <TabSpecificFormSection
        formData={formData}
        onChange={onChange}
        errors={errors}
        readOnly={readOnly}
        tabId="sales"
      />

      {/* Go for Launch Approval */}
      <GoForLaunchApproval
        tabId="sales"
        formData={formData}
        approvals={approvals}
        onApprove={onApprove}
        onScrub={onScrub}
      />
    </div>
  )
}

export default SalesTab