# Manual Firebase Storage Upload Guide

Since automated upload is having issues with the project configuration, here's how to upload the files manually:

## Step 1: Open Firebase Console
1. Go to https://console.firebase.google.com/project/flowgenius-fdbc2
2. Click on "Storage" in the left sidebar
3. If prompted, click "Get started" to enable Storage

## Step 2: Create Downloads Folder
1. In the Storage interface, click "Create folder"
2. Name it "downloads"
3. Click "Save"

## Step 3: Upload Files
Navigate to the "downloads" folder and upload these files:

### Files to Upload:
1. **BrainSwift-0.1.0.exe** (180MB)
   - From: `release/BrainSwift-0.1.0.exe`

2. **BrainSwift-0.1.0-x64.exe** (92MB)
   - From: `release/BrainSwift-0.1.0-x64.exe`

3. **BrainSwift-0.1.0-ia32.exe** (88MB)
   - From: `release/BrainSwift-0.1.0-ia32.exe`

## Step 4: Get Download URLs
For each uploaded file:
1. Click the three dots (⋮) next to the file
2. Select "Get download URL"
3. Copy the URL

## Step 5: Update Website
I'll help you update the website with the new URLs once you have them.

## Expected URLs Format:
The URLs will look like:
```
https://firebasestorage.googleapis.com/v0/b/flowgenius-fdbc2.appspot.com/o/downloads%2FBrainSwift-0.1.0.exe?alt=media&token=[token]
```

Let me know when you've uploaded the files and have the URLs! 