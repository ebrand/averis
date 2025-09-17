import React from 'react'
import TabSpecificFormSection from '../TabSpecificFormSection'
import GoForLaunchApproval from '../GoForLaunchApproval'

const ContractsTab = ({ formData, onChange, errors, readOnly, approvals, onApprove, onScrub }) => {
  return (
    <div className="space-y-8">
      {/* Contracts-specific collapsible sections */}
      <TabSpecificFormSection
        formData={formData}
        onChange={onChange}
        errors={errors}
        readOnly={readOnly}
        tabId="contracts"
      />

      {/* Go for Launch Approval */}
      <GoForLaunchApproval
        tabId="contracts"
        formData={formData}
        approvals={approvals}
        onApprove={onApprove}
        onScrub={onScrub}
      />
    </div>
  )
}

export default ContractsTab