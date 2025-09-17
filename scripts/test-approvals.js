// Test script to add sample approvals to localStorage for testing the Data Completion column

// Sample approvals data - some products have different approval statuses
const sampleApprovals = {
  1: { // Office Suite Standard - fully approved
    marketing: { approved: true, approvedBy: "Marketing Manager", approvedAt: "2024-08-15T10:00:00Z", role: "Marketing" },
    legal: { approved: true, approvedBy: "Legal Counsel", approvedAt: "2024-08-15T11:00:00Z", role: "Legal" },
    finance: { approved: true, approvedBy: "Finance Director", approvedAt: "2024-08-15T12:00:00Z", role: "Finance" },
    sales: { approved: true, approvedBy: "Sales Manager", approvedAt: "2024-08-15T13:00:00Z", role: "SalesOps" },
    contracts: { approved: true, approvedBy: "Contracts Lead", approvedAt: "2024-08-15T14:00:00Z", role: "Contracts" }
  },
  2: { // Office Suite Professional - partially approved
    marketing: { approved: true, approvedBy: "Marketing Manager", approvedAt: "2024-08-15T10:00:00Z", role: "Marketing" },
    legal: { approved: true, approvedBy: "Legal Counsel", approvedAt: "2024-08-15T11:00:00Z", role: "Legal" },
    finance: { approved: false, approvedBy: null, approvedAt: null, role: null },
    sales: { approved: false, approvedBy: null, approvedAt: null, role: null },
    contracts: { approved: false, approvedBy: null, approvedAt: null, role: null }
  },
  3: { // Enterprise CRM System - marketing and legal only
    marketing: { approved: true, approvedBy: "Marketing Manager", approvedAt: "2024-08-15T10:00:00Z", role: "Marketing" },
    legal: { approved: false, approvedBy: null, approvedAt: null, role: null },
    finance: { approved: false, approvedBy: null, approvedAt: null, role: null },
    sales: { approved: false, approvedBy: null, approvedAt: null, role: null },
    contracts: { approved: false, approvedBy: null, approvedAt: null, role: null }
  },
  4: { // Business Laptop Standard - no approvals yet
    marketing: { approved: false, approvedBy: null, approvedAt: null, role: null },
    legal: { approved: false, approvedBy: null, approvedAt: null, role: null },
    finance: { approved: false, approvedBy: null, approvedAt: null, role: null },
    sales: { approved: false, approvedBy: null, approvedAt: null, role: null },
    contracts: { approved: false, approvedBy: null, approvedAt: null, role: null }
  }
}

// Function to apply the test data
function applySampleApprovals() {
  console.log('Adding sample approval data to localStorage...')
  
  Object.entries(sampleApprovals).forEach(([productId, approvals]) => {
    localStorage.setItem(`product_approvals_${productId}`, JSON.stringify(approvals))
    console.log(`Added approvals for product ${productId}`)
  })
  
  console.log('Sample approval data added successfully!')
  console.log('Refresh the Products page to see the updated Data Completion column')
}

// Auto-apply when script is loaded in browser console
if (typeof window !== 'undefined') {
  applySampleApprovals()
}

export { sampleApprovals, applySampleApprovals }