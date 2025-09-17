// Script to populate database with real translated content using Google Translate API
const https = require('https');
const { exec } = require('child_process');

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || "YOUR_GOOGLE_TRANSLATE_API_KEY";
const PRODUCT_ID = "2cd4e3f8-2ea5-427e-841f-7b395b0de590";

// Sample product content in English
const englishContent = {
  name: "Enterprise Analytics Platform",
  description: "A comprehensive analytics platform designed for enterprise-level data processing, real-time insights, and scalable business intelligence solutions",
  shortDescription: "Enterprise-grade analytics platform with real-time insights",
  marketingCopy: "Transform your business data into actionable insights with our cutting-edge analytics platform",
  features: ["Real-time data processing", "Advanced visualization", "Custom dashboards", "API integration"],
  benefits: ["Improved decision making", "Faster time to insights", "Scalable architecture", "Cost-effective solution"]
};

// Target languages and their locale info
const targetLanguages = [
  { localeId: "b94594ce-df3b-42a9-9f01-5af977217422", code: "es_ES", lang: "es", name: "Spanish" },
  { localeId: "d1f55d51-fe45-4ada-9a89-97b3337efd42", code: "fr_FR", lang: "fr", name: "French" },
  { localeId: "250b882f-32a0-4c92-98d8-bd0ad40a9a5e", code: "de_DE", lang: "de", name: "German" }
];

// Function to translate text using Google Translate API
async function translateText(text, targetLang) {
  return new Promise((resolve, reject) => {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
    
    const postData = JSON.stringify({
      q: text,
      source: "en",
      target: targetLang,
      format: "text"
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.data && response.data.translations) {
            resolve(response.data.translations[0].translatedText);
          } else {
            reject(new Error('Invalid response format'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Function to execute SQL commands
function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const command = `PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d commerce_db -c "${sql}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

// Main function to generate and insert translations
async function populateTranslations() {
  console.log("🌐 Starting translation population with Google Translate API...");
  
  for (const target of targetLanguages) {
    try {
      console.log(`\n📝 Translating content to ${target.name} (${target.code})...`);
      
      // Translate all content fields
      const translatedName = await translateText(englishContent.name, target.lang);
      const translatedDescription = await translateText(englishContent.description, target.lang);
      const translatedShortDescription = await translateText(englishContent.shortDescription, target.lang);
      const translatedMarketingCopy = await translateText(englishContent.marketingCopy, target.lang);
      
      // Translate features array
      const translatedFeatures = [];
      for (const feature of englishContent.features) {
        const translated = await translateText(feature, target.lang);
        translatedFeatures.push(translated);
      }
      
      // Translate benefits array
      const translatedBenefits = [];
      for (const benefit of englishContent.benefits) {
        const translated = await translateText(benefit, target.lang);
        translatedBenefits.push(translated);
      }
      
      // Prepare SQL for insertion
      const featuresArray = `{${translatedFeatures.map(f => `"${f.replace(/"/g, '\\"')}"`).join(',')}}`;
      const benefitsArray = `{${translatedBenefits.map(b => `"${b.replace(/"/g, '\\"')}"`).join(',')}}`;
      
      const sql = `
        INSERT INTO averis_pricing.product_locale_content 
        (id, product_id, locale_id, name, description, short_description, marketing_copy, features, benefits, 
         meta_title, meta_description, keywords, translation_status, created_at, updated_at, created_by)
        VALUES (
          gen_random_uuid(),
          '${PRODUCT_ID}',
          '${target.localeId}',
          '${translatedName.replace(/'/g, "''")}',
          '${translatedDescription.replace(/'/g, "''")}',
          '${translatedShortDescription.replace(/'/g, "''")}',
          '${translatedMarketingCopy.replace(/'/g, "''")}',
          '${featuresArray}',
          '${benefitsArray}',
          '${translatedName.replace(/'/g, "''")}',
          '${translatedShortDescription.replace(/'/g, "''")}',
          '{"analytics", "enterprise", "platform"}',
          'completed',
          NOW(),
          NOW(),
          'google-translate-demo'
        );
      `;
      
      // Insert into database
      await executeSQL(sql);
      
      console.log(`✅ ${target.name} translation completed and inserted`);
      console.log(`   Name: ${translatedName}`);
      console.log(`   Description: ${translatedDescription.substring(0, 80)}...`);
      
    } catch (error) {
      console.error(`❌ Error translating to ${target.name}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Translation population complete!`);
  console.log(`📊 Check the UI to see real translated content from Google Translate API`);
}

// Run the script
populateTranslations().catch(console.error);