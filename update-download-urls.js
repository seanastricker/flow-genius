#!/usr/bin/env node

/**
 * Update Website Download URLs
 * This script updates the HTML with Firebase Storage download URLs
 */

const fs = require('fs');
const path = require('path');

// You'll paste the Firebase Storage URLs here
const FIREBASE_URLS = {
  'installer': 'https://firebasestorage.googleapis.com/v0/b/flowgenius-fdbc2.firebasestorage.app/o/downloads%2FBrainSwift-0.1.0.exe?alt=media&token=702cf06c-e7b6-4c3b-9146-cc26d928bb6d',     // BrainLift Generator-0.1.0.exe
  'x64': 'https://firebasestorage.googleapis.com/v0/b/flowgenius-fdbc2.firebasestorage.app/o/downloads%2FBrainSwift-0.1.0-x64.exe?alt=media&token=55a19a49-0767-4742-acc4-17deec61427c',                 // BrainLift Generator-0.1.0-x64.exe  
  'ia32': 'https://firebasestorage.googleapis.com/v0/b/flowgenius-fdbc2.firebasestorage.app/o/downloads%2FBrainSwift-0.1.0-ia32.exe?alt=media&token=ac35be56-6d0f-46c5-ad27-b70db799ddb3'                // BrainLift Generator-0.1.0-ia32.exe
};

function updateWebsiteHTML() {
  const htmlPath = path.join('website', 'index.html');
  
  if (!fs.existsSync(htmlPath)) {
    console.error('❌ HTML file not found:', htmlPath);
    return false;
  }

  console.log('📝 Reading HTML file...');
  let html = fs.readFileSync(htmlPath, 'utf8');

  // Check if URLs are provided
  const missingUrls = [];
  Object.entries(FIREBASE_URLS).forEach(([key, url]) => {
    if (url.includes('PASTE_') || url === '') {
      missingUrls.push(key);
    }
  });

  if (missingUrls.length > 0) {
    console.error('❌ Missing URLs for:', missingUrls.join(', '));
    console.log('\n📋 Instructions:');
    console.log('1. Edit this script (update-download-urls.js)');
    console.log('2. Replace the placeholder URLs with your Firebase Storage URLs:');
    console.log('   - installer: URL for BrainSwift-0.1.0.exe');
    console.log('   - x64: URL for BrainSwift-0.1.0-x64.exe');
    console.log('   - ia32: URL for BrainSwift-0.1.0-ia32.exe');
    console.log('3. Run this script again: node update-download-urls.js');
    return false;
  }

  console.log('🔄 Updating download URLs...');

  // Update installer URL
  html = html.replace(
    /href="downloads\/BrainSwift-0\.1\.0\.exe"/g,
    `href="${FIREBASE_URLS.installer}"`
  );

  // Update 64-bit portable URL
  html = html.replace(
    /href="downloads\/BrainSwift-0\.1\.0-x64\.exe"/g,
    `href="${FIREBASE_URLS.x64}"`
  );

  // Update 32-bit portable URL
  html = html.replace(
    /href="downloads\/BrainSwift-0\.1\.0-ia32\.exe"/g,
    `href="${FIREBASE_URLS.ia32}"`
  );

  // Remove download attribute since we're using external URLs
  html = html.replace(/download>/g, '>');

  console.log('💾 Saving updated HTML...');
  fs.writeFileSync(htmlPath, html);

  console.log('✅ Website updated successfully!');
  console.log('\n🚀 Next steps:');
  console.log('1. cd website');
  console.log('2. firebase deploy --only hosting');
  console.log('3. Your website will be live with working downloads!');

  return true;
}

function showInstructions() {
  console.log('🔧 Firebase Storage Upload Instructions');
  console.log('=====================================');
  console.log('\n1. Open Firebase Console:');
  console.log('   https://console.firebase.google.com/project/flowgenius-fdbc2');
  console.log('\n2. Enable Storage and upload files (see manual-upload-guide.md)');
  console.log('\n3. Get download URLs for each file');
  console.log('\n4. Edit this script and replace the placeholder URLs');
  console.log('\n5. Run: node update-download-urls.js');
}

// Main execution
if (require.main === module) {
  console.log('🌐 BrainSwift - Download URL Updater');
  console.log('==============================================\n');

  const success = updateWebsiteHTML();
  
  if (!success) {
    showInstructions();
    process.exit(1);
  }
}

module.exports = { updateWebsiteHTML }; 