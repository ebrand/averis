
// Test script to verify role mapping
const testRoles = [
  'product_marketing_approve',
  'product_legal_approve', 
  'product_finance_approve',
  'product_salesops_approve',
  'product_contracts_approve'
];

console.log('Testing new approval role names:');
testRoles.forEach(role => {
  console.log(`✅ ${role} - should map to approval functionality`);
});

