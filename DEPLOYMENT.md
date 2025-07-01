# BrainLift Generator - Deployment Guide

This guide explains how to build and distribute the BrainLift Generator application for end users to download and install.

## 🚀 Quick Deployment (Recommended)

### 1. **Prepare for Release**
```bash
# Ensure your code is ready
npm run type-check
npm run lint
npm run test

# Build and test locally first
npm run build
```

### 2. **Create a Release**
```bash
# Create and push a version tag
git tag v0.1.0
git push origin v0.1.0
```

**That's it!** GitHub Actions will automatically:
- ✅ Build for Windows, macOS, and Linux
- ✅ Run all tests and quality checks
- ✅ Create installers and portable versions
- ✅ Publish a GitHub Release with download links
- ✅ Generate release notes automatically

## 📦 Manual Build Process

### **Build for Current Platform**
```bash
# Build for your current operating system
npm run build

# Or build specifically for Windows
npm run build:win

# Or build for all platforms (requires platform-specific tools)
npm run build:all
```

### **Build Outputs**
All builds are created in the `release/` directory:

**Windows:**
- `BrainLift-Generator-0.1.0-x64.exe` - 64-bit installer
- `BrainLift-Generator-0.1.0-ia32.exe` - 32-bit installer  
- `BrainLift-Generator-0.1.0-x64.zip` - Portable version

**macOS:**
- `BrainLift-Generator-0.1.0-x64.dmg` - Intel Mac installer
- `BrainLift-Generator-0.1.0-arm64.dmg` - Apple Silicon installer

**Linux:**
- `BrainLift-Generator-0.1.0.AppImage` - Universal Linux executable
- `BrainLift-Generator-0.1.0.deb` - Debian/Ubuntu package

## 🎨 Required Assets

### **Application Icons**
You need to create the following icon files in the `assets/` directory:

```
assets/
├── icon.ico     # Windows icon (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
├── icon.icns    # macOS icon (1024x1024 and smaller sizes)
└── icon.png     # Linux icon (512x512 PNG)
```

### **Icon Creation Tools**
- **Online:** [IconGenerator](https://icongenerator.org/)
- **Desktop:** [GIMP](https://www.gimp.org/), [Photoshop](https://www.adobe.com/products/photoshop.html)
- **macOS:** [Image2icon](http://www.img2icnsapp.com/)

### **Icon Requirements**
- **Design:** Simple, recognizable brain or lightbulb symbol
- **Colors:** Professional blue/purple gradient
- **Background:** Transparent or subtle gradient
- **Text:** Avoid small text (won't be readable at small sizes)

## 🔧 Distribution Options

### **Option 1: GitHub Releases (Recommended)**
✅ **Pros:** Automatic builds, version tracking, free hosting  
❌ **Cons:** Users need GitHub account (optional), technical audience

**How users download:**
1. Go to `https://github.com/yourusername/brainlift-generator/releases`
2. Click "Latest" release
3. Download the appropriate file for their OS
4. Install and run

### **Option 2: Direct Distribution**
✅ **Pros:** More control, custom website, broader audience  
❌ **Cons:** Manual process, hosting costs, more complex

**Setup:**
1. Build manually: `npm run build:all`
2. Upload files to your hosting service
3. Create download page with instructions
4. Provide direct download links

### **Option 3: App Stores**
✅ **Pros:** Wider discovery, automatic updates, trusted source  
❌ **Cons:** Review process, potential fees, platform restrictions

**Supported stores:**
- Microsoft Store (Windows)
- Mac App Store (macOS)  
- Snap Store (Linux)

## 🔐 Code Signing (Optional but Recommended)

### **Windows Code Signing**
```bash
# Get a code signing certificate from a trusted CA
# Update package.json build config:
"win": {
  "certificateFile": "path/to/certificate.p12",
  "certificatePassword": "certificate_password",
  "publisherName": "Your Company Name"
}
```

### **macOS Code Signing**
```bash
# Requires Apple Developer account ($99/year)
# Update package.json build config:
"mac": {
  "identity": "Developer ID Application: Your Name (TEAM_ID)"
}
```

**Benefits of code signing:**
- Prevents "Unknown Developer" warnings
- Builds user trust and credibility
- Required for app store distribution
- Enables automatic updates

## 📋 Pre-Release Checklist

### **Code Quality**
- [ ] All TypeScript compilation passes (`npm run type-check`)
- [ ] Linting passes without warnings (`npm run lint`)
- [ ] All tests pass (`npm run test`)
- [ ] Application starts and basic functionality works
- [ ] API keys can be entered and saved
- [ ] Research workflows complete successfully

### **Documentation**
- [ ] README.md is up to date
- [ ] DEPLOYMENT.md reflects current process
- [ ] resources/README.txt has correct instructions
- [ ] Version numbers are updated in package.json

### **Assets**
- [ ] Application icons are present and high quality
- [ ] Installer script (installer.nsh) is configured
- [ ] Build configuration in package.json is correct

### **Testing**
- [ ] Test installation process on clean Windows machine
- [ ] Verify all features work in production build
- [ ] Check file associations and desktop shortcuts
- [ ] Confirm uninstaller removes all files correctly

## 🔄 Update Strategy

### **Automatic Updates (Future)**
```bash
# Install electron-updater
npm install electron-updater

# Configure in main process
import { autoUpdater } from 'electron-updater';
autoUpdater.checkForUpdatesAndNotify();
```

### **Manual Updates (Current)**
Users need to:
1. Download new version from GitHub Releases
2. Uninstall old version (optional)
3. Install new version
4. Migrate settings if needed

## 📊 Release Process

### **1. Version Management**
```bash
# Update version in package.json
npm version patch   # 0.1.0 -> 0.1.1
npm version minor   # 0.1.1 -> 0.2.0
npm version major   # 0.2.0 -> 1.0.0
```

### **2. Release Preparation**
```bash
# Create changelog entry
echo "## v0.1.1 - $(date)" >> CHANGELOG.md
echo "- Fixed research workflow memory leak" >> CHANGELOG.md
echo "- Improved UI responsiveness" >> CHANGELOG.md

# Commit changes
git add .
git commit -m "Prep(release): bump version to v0.1.1"
```

### **3. Create Release**
```bash
# Create and push tag (triggers automated build)
git tag v0.1.1
git push origin v0.1.1
```

### **4. Monitor Build**
1. Go to GitHub Actions tab
2. Watch build progress for all platforms
3. Verify all builds complete successfully
4. Check GitHub Releases page for published release

## 🚨 Troubleshooting

### **Build Failures**
```bash
# Clear cache and retry
npm run clean  # If you have a clean script
rm -rf node_modules dist dist-electron release
npm install
npm run build
```

### **Icon Issues**
- Ensure all required icon formats are present
- Check file paths in package.json build config
- Verify icon files aren't corrupted
- Use absolute paths if relative paths fail

### **Permission Issues**
```bash
# Windows: Run as administrator
# macOS: Grant Xcode command line tools access
xcode-select --install

# Linux: Install required packages
sudo apt-get install build-essential libnss3-dev libatk-bridge2.0-dev
```

### **Code Signing Issues**
- Verify certificate is valid and not expired
- Check certificate password is correct
- Ensure certificate file path is accessible
- Test certificate with manual signing first

## 📈 Analytics & Monitoring

### **Download Tracking**
- GitHub Releases provides download statistics
- Monitor which platforms are most popular
- Track version adoption rates

### **Error Reporting**
Consider adding crash reporting:
```bash
npm install @sentry/electron
# Configure error reporting for production builds
```

### **Usage Analytics**
Optional anonymous usage tracking:
```bash
npm install electron-google-analytics
# Add privacy-conscious analytics
```

## 🎯 Success Metrics

### **Distribution Goals**
- [ ] Under 5 clicks to download and install
- [ ] Installation completes in under 2 minutes
- [ ] Application starts successfully on first launch
- [ ] Users can complete setup (API keys) in under 5 minutes
- [ ] Zero security warnings during installation

### **Quality Metrics**
- [ ] 95%+ successful installation rate
- [ ] Under 1% crash rate during setup
- [ ] All platforms build without errors
- [ ] Installer size under 200MB
- [ ] Application startup under 5 seconds

**You're now ready to deploy BrainLift Generator! 🚀**

For questions or issues, refer to the troubleshooting section or create an issue on the GitHub repository. 