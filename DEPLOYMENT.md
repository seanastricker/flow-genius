# BrainLift Generator - Simple Deployment Guide

## Overview

This guide covers the simple file sharing deployment approach for the BrainLift Generator. This method builds the application locally and provides files for direct sharing.

## Prerequisites

- Node.js 18+ installed
- Windows development environment
- All dependencies installed (`npm install`)

## Quick Deployment

### Step 1: Build the Application
```bash
# Build for Windows (recommended)
npm run build:win

# Or build for all platforms
npm run build:all
```

### Step 2: Find Your Built Files
After building, find your installers in the `release/` directory:

**Windows Installers:**
- `BrainLift Generator-0.1.0.exe` - Universal installer (recommended for sharing)
- `BrainLift Generator-0.1.0-x64.exe` - 64-bit installer
- `BrainLift Generator-0.1.0-x64-portable.exe` - Portable version (no installation required)

### Step 3: Share Your Application

#### Option A: File Sharing Services
1. Upload installer to file sharing service:
   - **Google Drive** (easiest)
   - **Dropbox**
   - **OneDrive**
   - **WeTransfer** (temporary)

2. Share the download link with users
3. Include setup instructions (see below)

#### Option B: Direct Distribution
1. Copy installer files to USB drives
2. Share via local network
3. Email smaller portable versions

## User Setup Instructions

Create this text file to share with users:

```
# BrainLift Generator Setup Instructions

## Installation
1. Download the installer file
2. Run "BrainLift Generator-0.1.0.exe"
3. Follow the installation wizard
4. Launch the application

## First-Time Setup
1. Get API keys from:
   - OpenAI: https://platform.openai.com/api-keys
   - Tavily: https://app.tavily.com/
2. Enter your API keys when prompted in the app
3. Start creating BrainLift documents!

## System Requirements
- Windows 10 or higher
- 8GB RAM (16GB recommended)
- 2GB free disk space
- Internet connection for research features

## Support
- Report issues: [Your contact information]
- Documentation: [Link to documentation if available]
```

## Build Commands Reference

```bash
# Development
npm run dev              # Start development server
npm run build:vite       # Build frontend only

# Production Builds
npm run build:win        # Windows only (fastest)
npm run build:mac        # macOS only
npm run build:linux      # Linux only
npm run build:all        # All platforms (slowest)

# Testing Builds
npm run type-check       # Check TypeScript
npm run lint            # Check code quality
```

## File Sharing Best Practices

### Security
- Use reputable file sharing services
- Enable password protection when available
- Set download limits if needed
- Use virus scanning before sharing

### User Experience
- Include clear download instructions
- Provide multiple installer options
- Test downloads yourself first
- Include version information in file names

### Version Management
- Keep track of which version you shared
- Update version numbers in package.json
- Rebuild when making changes
- Maintain a simple changelog

## Troubleshooting

### Build Issues
```bash
# Clean rebuild
rm -rf node_modules dist dist-electron release
npm install
npm run build:win
```

### Large File Sizes
- Use portable versions for smaller files
- Compress installers into ZIP files
- Use specialized file sharing for large files

### User Installation Issues
- Provide both 64-bit and universal installers
- Include Windows Defender/antivirus instructions
- Test on different Windows versions

## Next Steps

This simple approach gets your application deployed quickly. As your user base grows, you can consider:

1. **Professional File Hosting** - Dedicated download servers
2. **Automatic Updates** - electron-updater integration  
3. **Distribution Platforms** - Microsoft Store, third-party platforms
4. **GitHub Releases** - When you need version management
5. **Custom Website** - Professional download page

## Support and Maintenance

- Monitor user feedback for issues
- Keep API keys and dependencies updated
- Test new builds before sharing
- Maintain backup copies of working versions

The simple file sharing approach provides immediate deployment with minimal complexity while maintaining full control over your application distribution. 