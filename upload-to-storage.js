#!/usr/bin/env node

/**
 * Upload BrainLift Generator files to Firebase Storage
 * This script uploads the .exe files and generates public download URLs
 */

const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const fs = require('fs');
const path = require('path');

// Firebase configuration - using the same project
const firebaseConfig = {
  projectId: "flowgenius-fdbc2",
  storageBucket: "flowgenius-fdbc2.appspot.com"
};

async function uploadFiles() {
  try {
    console.log('🚀 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);

    const files = [
      'BrainLift Generator-0.1.0.exe',
      'BrainLift Generator-0.1.0-x64.exe', 
      'BrainLift Generator-0.1.0-ia32.exe'
    ];

    const downloadUrls = {};

    for (const fileName of files) {
      const filePath = path.join('website', 'temp_downloads', fileName);
      
      if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${fileName}`);
        continue;
      }

      console.log(`📤 Uploading ${fileName}...`);
      
      // Read file
      const fileBuffer = fs.readFileSync(filePath);
      
      // Create storage reference
      const storageRef = ref(storage, `downloads/${fileName}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, fileBuffer, {
        contentType: 'application/octet-stream',
        customMetadata: {
          'originalName': fileName,
          'version': '0.1.0'
        }
      });
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      downloadUrls[fileName] = downloadURL;
      
      console.log(`✅ Uploaded: ${fileName}`);
      console.log(`   URL: ${downloadURL}`);
    }

    // Save URLs to a file for updating the website
    const urlsFile = path.join('.', 'download-urls.json');
    fs.writeFileSync(urlsFile, JSON.stringify(downloadUrls, null, 2));
    
    console.log('\n🎉 All files uploaded successfully!');
    console.log(`📄 Download URLs saved to: ${urlsFile}`);
    
    return downloadUrls;

  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw error;
  }
}

// Run the upload
if (require.main === module) {
  uploadFiles()
    .then(() => {
      console.log('\n✅ Upload process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Upload process failed:', error);
      process.exit(1);
    });
}

module.exports = { uploadFiles }; 