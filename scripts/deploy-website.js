#!/usr/bin/env node

/**
 * Website Deployment Script for BrainLift Generator
 * Builds the application and updates the download website
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

/**
 * Execute command and log output
 */
function exec(command, options = {}) {
  console.log(`\n🔄 Executing: ${command}`);
  try {
    const result = execSync(command, { 
      stdio: 'inherit', 
      encoding: 'utf8',
      ...options 
    });
    return result;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Get current package.json data
 */
function getPackageData() {
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    throw new Error('package.json not found');
  }
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

/**
 * Build the application
 */
function buildApplication() {
  console.log('\n🏗️  Building BrainLift Generator...');
  
  // Clean previous build
  exec('npm run build:vite');
  exec('npm run build:win');
  
  console.log('✅ Build completed successfully!');
}

/**
 * Prepare website directory structure
 */
function prepareWebsiteDirectory() {
  console.log('\n📁 Preparing website directory...');
  
  const websiteDir = path.join(process.cwd(), 'website');
  const downloadsDir = path.join(websiteDir, 'downloads');
  
  // Ensure directories exist
  fs.ensureDirSync(websiteDir);
  fs.ensureDirSync(downloadsDir);
  
  console.log('✅ Website directory prepared');
  return { websiteDir, downloadsDir };
}

/**
 * Copy build files to website
 */
function copyBuildFiles(downloadsDir) {
  console.log('\n📦 Copying build files to website...');
  
  const releaseDir = path.join(process.cwd(), 'release');
  const packageData = getPackageData();
  const version = packageData.version;
  
  if (!fs.existsSync(releaseDir)) {
    throw new Error('Release directory not found. Run build first.');
  }
  
  // Define file patterns to copy
  const filesToCopy = [
    `BrainLift Generator-${version}.exe`,           // Installer
    `BrainLift Generator-${version}-x64.exe`,       // 64-bit portable
    `BrainLift Generator-${version}-ia32.exe`,      // 32-bit portable
    'latest.yml'                                     // Auto-updater info
  ];
  
  let copiedFiles = [];
  
  filesToCopy.forEach(filename => {
    const sourcePath = path.join(releaseDir, filename);
    const destPath = path.join(downloadsDir, filename);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      const stats = fs.statSync(destPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
      console.log(`   ✅ ${filename} (${sizeMB} MB)`);
      copiedFiles.push({ filename, size: sizeMB });
    } else {
      console.log(`   ⚠️  ${filename} - Not found, skipping`);
    }
  });
  
  console.log(`✅ Copied ${copiedFiles.length} files to website`);
  return copiedFiles;
}

/**
 * Update HTML with current version and file sizes
 */
function updateWebsiteHTML(websiteDir, copiedFiles) {
  console.log('\n📝 Updating website HTML...');
  
  const packageData = getPackageData();
  const version = packageData.version;
  const htmlPath = path.join(websiteDir, 'index.html');
  
  if (!fs.existsSync(htmlPath)) {
    throw new Error('index.html not found in website directory');
  }
  
  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // Update version number
  html = html.replace(/v\d+\.\d+\.\d+/g, `v${version}`);
  html = html.replace(/Version \d+\.\d+\.\d+/g, `Version ${version}`);
  
  // Update download URLs and file sizes
  copiedFiles.forEach(({ filename, size }) => {
    const oldPattern = new RegExp(`downloads/[^"]*${filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
    const newUrl = `downloads/${filename}`;
    html = html.replace(oldPattern, newUrl);
    
    // Update file sizes
    if (filename.includes('Generator-')) {
      const sizePattern = /~\d+ MB/g;
      html = html.replace(sizePattern, `~${size} MB`);
    }
  });
  
  // Update timestamps
  const now = new Date();
  const dateString = now.toLocaleDateString();
  html = html.replace(/Released Today/g, `Released ${dateString}`);
  html = html.replace(/'Released ' \+ new Date\(\)\.toLocaleDateString\(\)/g, `'Released ${dateString}'`);
  
  fs.writeFileSync(htmlPath, html);
  console.log('✅ Website HTML updated with current version and file sizes');
}

/**
 * Generate deployment info file
 */
function generateDeploymentInfo(websiteDir, copiedFiles) {
  console.log('\n📋 Generating deployment info...');
  
  const packageData = getPackageData();
  const deployInfo = {
    version: packageData.version,
    deployedAt: new Date().toISOString(),
    files: copiedFiles,
    totalSize: copiedFiles.reduce((sum, file) => sum + parseFloat(file.size), 0).toFixed(1)
  };
  
  const infoPath = path.join(websiteDir, 'deployment-info.json');
  fs.writeFileSync(infoPath, JSON.stringify(deployInfo, null, 2));
  
  console.log('✅ Deployment info generated');
  return deployInfo;
}

/**
 * Create a simple local server script for testing
 */
function createTestServer(websiteDir) {
  console.log('\n🌐 Creating test server script...');
  
  const serverScript = `#!/usr/bin/env node

/**
 * Simple HTTP server for testing BrainLift Generator website
 * Run with: node test-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.exe': 'application/octet-stream',
  '.yml': 'text/yaml'
};

const server = http.createServer((req, res) => {
  // Decode URL to handle spaces and special characters in file names
  let requestPath;
  try {
    requestPath = decodeURIComponent(req.url);
  } catch (err) {
    requestPath = req.url;
  }
  
  let filePath = path.join(__dirname, requestPath === '/' ? 'index.html' : requestPath);
  
  // Security check: ensure the file path is within our website directory
  const normalizedPath = path.normalize(filePath);
  const websiteDir = path.normalize(__dirname);
  if (!normalizedPath.startsWith(websiteDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  console.log(\`📥 Request: \${req.url} -> \${filePath}\`);
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.log(\`❌ File not found: \${filePath}\`);
      res.writeHead(404);
      res.end(\`File not found: \${path.basename(filePath)}\`);
      return;
    }
    
    const ext = path.extname(filePath);
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // Add proper headers for file downloads
    const isDownload = req.url.includes('downloads/');
    const headers = { 'Content-Type': mimeType };
    
    if (isDownload) {
      headers['Content-Disposition'] = \`attachment; filename="\${path.basename(filePath)}"\`;
      headers['Content-Length'] = content.length;
    }
    
    res.writeHead(200, headers);
    res.end(content);
    
    console.log(\`✅ Served: \${path.basename(filePath)} (\${mimeType})\`);
  });
});

server.listen(PORT, () => {
  console.log(\`🚀 Test server running at http://localhost:\${PORT}\`);
  console.log('Press Ctrl+C to stop');
});
`;

  const serverPath = path.join(websiteDir, 'test-server.js');
  fs.writeFileSync(serverPath, serverScript);
  fs.chmodSync(serverPath, '755');
  
  console.log('✅ Test server script created');
}

/**
 * Display deployment summary
 */
function displaySummary(websiteDir, deployInfo) {
  console.log('\n🎉 Website Deployment Summary');
  console.log('==============================');
  console.log(`Version: ${deployInfo.version}`);
  console.log(`Files: ${deployInfo.files.length}`);
  console.log(`Total Size: ${deployInfo.totalSize} MB`);
  console.log(`Website Directory: ${websiteDir}`);
  console.log('\n📁 Deployed Files:');
  deployInfo.files.forEach(({ filename, size }) => {
    console.log(`   📄 ${filename} (${size} MB)`);
  });
  
  console.log('\n🌐 Next Steps:');
  console.log('1. Test locally:');
  console.log(`   cd ${path.relative(process.cwd(), websiteDir)}`);
  console.log('   node test-server.js');
  console.log('   Open http://localhost:3000');
  console.log('\n2. Deploy to hosting:');
  console.log('   - Upload the entire website/ folder to your web host');
  console.log('   - Point your domain to the uploaded files');
  console.log('\n3. Popular hosting options:');
  console.log('   - Netlify (drag & drop deployment)');
  console.log('   - Vercel (GitHub integration)');
  console.log('   - GitHub Pages (free for public repos)');
  console.log('   - Firebase Hosting');
  console.log('   - Traditional web hosting (cPanel, etc.)');
}

/**
 * Main deployment function
 */
function main() {
  console.log('🚀 BrainLift Generator Website Deployment');
  console.log('==========================================');

  const args = process.argv.slice(2);
  const command = args[0] || 'full';

  try {
    const packageData = getPackageData();
    console.log(`\n📦 Current Version: ${packageData.version}`);

    switch (command) {
      case 'build-only':
        buildApplication();
        break;
        
      case 'website-only':
        const { websiteDir: webDir, downloadsDir: dlDir } = prepareWebsiteDirectory();
        const files = copyBuildFiles(dlDir);
        updateWebsiteHTML(webDir, files);
        const info = generateDeploymentInfo(webDir, files);
        createTestServer(webDir);
        displaySummary(webDir, info);
        break;
        
      case 'full':
      default:
        // Full deployment: build + website
        buildApplication();
        const { websiteDir, downloadsDir } = prepareWebsiteDirectory();
        const copiedFiles = copyBuildFiles(downloadsDir);
        updateWebsiteHTML(websiteDir, copiedFiles);
        const deployInfo = generateDeploymentInfo(websiteDir, copiedFiles);
        createTestServer(websiteDir);
        displaySummary(websiteDir, deployInfo);
        break;
    }
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }

  console.log('\n✅ Website deployment completed successfully!');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { buildApplication, prepareWebsiteDirectory, copyBuildFiles, updateWebsiteHTML }; 