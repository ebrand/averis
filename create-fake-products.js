#!/usr/bin/env node

/**
 * Script to create 20 fake products using the Product MDM API
 * All products will be created in 'draft' status with complete data
 */

const API_BASE_URL = 'http://localhost:6000';

const productTypes = ['Software License', 'SaaS Subscription', 'Hardware', 'Service', 'Training', 'Consulting'];
const productClasses = ['Core Product', 'Add-on', 'Extension', 'Bundle', 'Upgrade'];
const manufacturers = ['Microsoft', 'Adobe', 'Salesforce', 'Oracle', 'IBM', 'Dell', 'HP', 'Cisco'];
const categories = ['Productivity', 'Security', 'Development', 'Analytics', 'Infrastructure', 'Communications'];

// Generate realistic fake products
const fakeProducts = [
  {
    name: 'Advanced Analytics Platform Pro',
    displayName: 'Analytics Pro',
    shortDescription: 'Comprehensive analytics and reporting solution for enterprise data',
    longDescription: 'Advanced Analytics Platform Pro provides enterprise-grade data visualization, reporting, and predictive analytics capabilities.',
    type: 'Software License',
    class: 'Core Product'
  },
  {
    name: 'Cloud Security Suite Enterprise',
    displayName: 'Security Suite',
    shortDescription: 'Complete cloud security solution with threat detection',
    longDescription: 'Cloud Security Suite Enterprise offers comprehensive protection for cloud infrastructure with real-time monitoring.',
    type: 'SaaS Subscription',
    class: 'Core Product'
  },
  {
    name: 'Developer Workstation Elite',
    displayName: 'Dev Workstation',
    shortDescription: 'High-performance workstation for software development',
    longDescription: 'Developer Workstation Elite features cutting-edge hardware optimized for software development workflows.',
    type: 'Hardware',
    class: 'Core Product'
  },
  {
    name: 'Database Migration Services',
    displayName: 'DB Migration',
    shortDescription: 'Professional database migration and optimization services',
    longDescription: 'Database Migration Services provides expert consultation for migrating and optimizing enterprise databases.',
    type: 'Service',
    class: 'Core Product'
  },
  {
    name: 'DevOps Training Certification',
    displayName: 'DevOps Training',
    shortDescription: 'Comprehensive DevOps training and certification program',
    longDescription: 'DevOps Training Certification offers hands-on training in modern DevOps practices and tools.',
    type: 'Training',
    class: 'Core Product'
  },
  {
    name: 'AI Implementation Consulting',
    displayName: 'AI Consulting',
    shortDescription: 'Strategic AI implementation and consulting services',
    longDescription: 'AI Implementation Consulting helps organizations integrate artificial intelligence into their business processes.',
    type: 'Consulting',
    class: 'Core Product'
  },
  {
    name: 'Backup & Recovery Solution',
    displayName: 'Backup Pro',
    shortDescription: 'Enterprise backup and disaster recovery solution',
    longDescription: 'Backup & Recovery Solution provides comprehensive data protection and disaster recovery capabilities.',
    type: 'Software License',
    class: 'Extension'
  },
  {
    name: 'Network Monitoring Plus',
    displayName: 'NetMonitor Plus',
    shortDescription: 'Advanced network monitoring and performance analysis',
    longDescription: 'Network Monitoring Plus delivers real-time network visibility and performance optimization tools.',
    type: 'SaaS Subscription',
    class: 'Add-on'
  },
  {
    name: 'Server Rack Standard 42U',
    displayName: 'Server Rack',
    shortDescription: 'Professional 42U server rack with cable management',
    longDescription: 'Server Rack Standard 42U provides enterprise-grade server housing with optimal airflow and cable management.',
    type: 'Hardware',
    class: 'Core Product'
  },
  {
    name: 'Security Audit Services',
    displayName: 'Security Audit',
    shortDescription: 'Comprehensive cybersecurity audit and assessment',
    longDescription: 'Security Audit Services offers thorough security assessments and vulnerability analysis for enterprise systems.',
    type: 'Service',
    class: 'Core Product'
  },
  {
    name: 'Cloud Architecture Workshop',
    displayName: 'Cloud Workshop',
    shortDescription: 'Intensive cloud architecture design workshop',
    longDescription: 'Cloud Architecture Workshop provides hands-on training in designing scalable cloud infrastructure.',
    type: 'Training',
    class: 'Core Product'
  },
  {
    name: 'Digital Transformation Strategy',
    displayName: 'DT Strategy',
    shortDescription: 'Strategic digital transformation consulting',
    longDescription: 'Digital Transformation Strategy helps organizations modernize their technology stack and processes.',
    type: 'Consulting',
    class: 'Core Product'
  },
  {
    name: 'API Management Platform',
    displayName: 'API Manager',
    shortDescription: 'Comprehensive API lifecycle management platform',
    longDescription: 'API Management Platform provides complete API design, deployment, and monitoring capabilities.',
    type: 'Software License',
    class: 'Core Product'
  },
  {
    name: 'Customer Data Platform',
    displayName: 'CDP',
    shortDescription: 'Unified customer data management and analytics',
    longDescription: 'Customer Data Platform consolidates customer data from multiple sources for unified analytics and insights.',
    type: 'SaaS Subscription',
    class: 'Core Product'
  },
  {
    name: 'High-Performance Storage Array',
    displayName: 'Storage Array',
    shortDescription: 'Enterprise-grade high-performance storage system',
    longDescription: 'High-Performance Storage Array delivers exceptional performance for mission-critical applications.',
    type: 'Hardware',
    class: 'Core Product'
  },
  {
    name: 'Infrastructure Assessment',
    displayName: 'Infra Assessment',
    shortDescription: 'Complete IT infrastructure evaluation service',
    longDescription: 'Infrastructure Assessment provides comprehensive evaluation of IT systems and recommendations for optimization.',
    type: 'Service',
    class: 'Core Product'
  },
  {
    name: 'Kubernetes Administrator Course',
    displayName: 'K8s Admin',
    shortDescription: 'Professional Kubernetes administration training',
    longDescription: 'Kubernetes Administrator Course offers comprehensive training in container orchestration and cluster management.',
    type: 'Training',
    class: 'Core Product'
  },
  {
    name: 'Enterprise Architecture Review',
    displayName: 'EA Review',
    shortDescription: 'Strategic enterprise architecture consulting',
    longDescription: 'Enterprise Architecture Review provides expert analysis and recommendations for enterprise system design.',
    type: 'Consulting',
    class: 'Core Product'
  },
  {
    name: 'Business Intelligence Suite',
    displayName: 'BI Suite',
    shortDescription: 'Complete business intelligence and reporting platform',
    longDescription: 'Business Intelligence Suite offers comprehensive data visualization, reporting, and dashboard capabilities.',
    type: 'Software License',
    class: 'Bundle'
  },
  {
    name: 'Identity Management Cloud',
    displayName: 'Identity Cloud',
    shortDescription: 'Cloud-based identity and access management',
    longDescription: 'Identity Management Cloud provides secure, scalable identity and access management for cloud and on-premises applications.',
    type: 'SaaS Subscription',
    class: 'Core Product'
  }
];

// Generate complete product data
function createCompleteProduct(product, index) {
  const sku = `PRD-${String(index + 1).padStart(4, '0')}`;
  const manufacturer = manufacturers[index % manufacturers.length];
  const category = categories[index % categories.length];
  const basePrice = Math.floor(Math.random() * 50000) + 1000; // $1K to $51K
  const costPrice = Math.floor(basePrice * 0.6); // 60% of base price
  
  return {
    // Basic Information
    sku,
    name: product.name,
    displayName: product.displayName,
    shortDescription: product.shortDescription,
    longDescription: product.longDescription,
    
    // Classification
    type: product.type,
    class: product.class,
    category,
    manufacturer,
    
    // Pricing
    basePrice,
    costPrice,
    
    // Flags
    availableFlag: true,
    webDisplayFlag: Math.random() > 0.3, // 70% will be web displayed
    licenseRequiredFlag: product.type === 'Software License',
    seatBasedPricingFlag: ['Software License', 'SaaS Subscription'].includes(product.type),
    canBeFulfilledFlag: product.type !== 'Service',
    contractItemFlag: ['Consulting', 'Service', 'Training'].includes(product.type),
    
    // Status (all start as draft)
    status: 'draft',
    
    // Additional fields
    brand: manufacturer,
    model: `Model-${index + 1}`,
    partNumber: `PN-${sku}`,
    unitOfMeasure: 'Each',
    weight: product.type === 'Hardware' ? Math.floor(Math.random() * 50) + 1 : null,
    dimensions: product.type === 'Hardware' ? `${Math.floor(Math.random() * 20) + 10}x${Math.floor(Math.random() * 15) + 5}x${Math.floor(Math.random() * 10) + 2}` : null,
    
    // Categorization
    categorization: [category, product.type.split(' ')[0]]
  };
}

// Function to create a product via API
async function createProduct(productData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Failed to create product ${productData.name}:`, error.message);
    return null;
  }
}

// Main function to create all products
async function createAllProducts() {
  console.log('🚀 Starting to create 20 fake products...\n');
  
  const results = [];
  
  for (let i = 0; i < fakeProducts.length; i++) {
    const productData = createCompleteProduct(fakeProducts[i], i);
    console.log(`📦 Creating product ${i + 1}/20: ${productData.name}`);
    
    const result = await createProduct(productData);
    
    if (result && result.success) {
      console.log(`✅ Created: ${result.data.name} (ID: ${result.data.id})`);
      results.push(result.data);
    } else {
      console.log(`❌ Failed: ${productData.name}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n🎉 Product creation complete!`);
  console.log(`✅ Successfully created: ${results.length} products`);
  console.log(`❌ Failed: ${fakeProducts.length - results.length} products`);
  
  if (results.length > 0) {
    console.log('\n📋 Created products:');
    results.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (${product.sku}) - ${product.status}`);
    });
  }
  
  return results;
}

// Run the script
createAllProducts().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});