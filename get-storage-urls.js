#!/usr/bin/env node

/**
 * Get Firebase Storage Download URLs
 * This script connects to your Firebase Storage and gets download URLs
 */

const { initializeApp } = require('firebase/app');
const { getStorage, ref, listAll, getDownloadURL } = require('firebase/storage');

// Firebase configuration
const firebaseConfig = {
  projectId: "flowgenius-fdbc2",
  storageBucket: "flowgenius-fdbc2.appspot.com"
};

async function getDownloadUrls() {
  try {
    console.log('🔗 Connecting to Firebase Storage...');
    
    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);
    const downloadsRef = ref(storage, 'downloads');

    console.log('📁 Listing files in downloads folder...');
    
    // List all files in downloads folder
    const result = await listAll(downloadsRef);
    
    if (result.items.length === 0) {
      console.log('❌ No files found in downloads folder');
      console.log('📋 Make sure files are uploaded to the "downloads" folder in Firebase Storage');
      return;
    }

    console.log(`✅ Found ${result.items.length} files:`);
    
    const urls = {};
    
    for (const itemRef of result.items) {
      console.log(`\n📄 File: ${itemRef.name}`);
      
      try {
        const url = await getDownloadURL(itemRef);
        urls[itemRef.name] = url;
        console.log(`🔗 URL: ${url}`);
      } catch (error) {
        console.log(`❌ Error getting URL for ${itemRef.name}:`, error.message);
      }
    }

    // Create the formatted URLs for the script
    console.log('\n📋 Copy these URLs into update-download-urls.js:');
    console.log('='.repeat(60));
    
    const installerUrl = urls['BrainLift Generator-0.1.0.exe'] || 'NOT_FOUND';
    const x64Url = urls['BrainLift Generator-0.1.0-x64.exe'] || 'NOT_FOUND';
    const ia32Url = urls['BrainLift Generator-0.1.0-ia32.exe'] || 'NOT_FOUND';

    console.log(`
const FIREBASE_URLS = {
  'installer': '${installerUrl}',
  'x64': '${x64Url}',
  'ia32': '${ia32Url}'
};`);

    // Save to file for easy copying
    const urlData = {
      installer: installerUrl,
      x64: x64Url,
      ia32: ia32Url
    };

    const fs = require('fs');
    fs.writeFileSync('firebase-urls.json', JSON.stringify(urlData, null, 2));
    console.log('\n💾 URLs also saved to firebase-urls.json');

    return urlData;

  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error.code === 'storage/object-not-found') {
      console.log('\n📋 Troubleshooting:');
      console.log('1. Make sure files are uploaded to Firebase Storage');
      console.log('2. Check that files are in a folder named "downloads"');
      console.log('3. Verify file names match exactly');
    }
  }
}

if (require.main === module) {
  getDownloadUrls()
    .then(() => {
      console.log('\n✅ Done!');
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
    });
}

module.exports = { getDownloadUrls }; 