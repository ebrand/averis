// Simple test script to verify Google Translate API functionality
const https = require('https');

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || "YOUR_GOOGLE_TRANSLATE_API_KEY";
const testText = "Hello world, this is a test product";
const sourceLang = "en";
const targetLang = "es";

const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;

const postData = JSON.stringify({
  q: testText,
  source: sourceLang,
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

console.log('Testing Google Translate API...');
console.log(`Translating: "${testText}"`);
console.log(`From: ${sourceLang} to ${targetLang}`);

const req = https.request(url, options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.data && response.data.translations) {
        console.log(`✅ Translation successful!`);
        console.log(`Original: ${testText}`);
        console.log(`Translated: ${response.data.translations[0].translatedText}`);
      } else {
        console.log('❌ Translation failed - unexpected response format');
        console.log('Response:', response);
      }
    } catch (error) {
      console.log('❌ Translation failed - JSON parse error');
      console.log('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Translation failed - request error');
  console.error(error);
});

req.write(postData);
req.end();