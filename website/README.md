# BrainLift Generator - Download Website

This directory contains the complete download website for BrainLift Generator.

## Files

- `index.html` - Main download page with professional design
- `downloads/` - Application files (.exe installers)
- `test-server.js` - Local testing server
- `deployment-info.json` - Build metadata and file information

## Local Testing

```bash
node test-server.js
```

Then open http://localhost:3000 in your browser.

## Deployment

### Quick Deploy Options

**Netlify (Easiest)**
1. Go to https://netlify.com
2. Drag & drop this entire `website/` folder
3. Get instant HTTPS hosting

**Vercel**
1. Install: `npm i -g vercel`
2. Run: `vercel` in this directory
3. Follow prompts

**GitHub Pages**
1. Create new GitHub repository
2. Upload these files to the repository
3. Enable Pages in repository settings

### File Upload Hosting
Upload all files in this directory to your web host's public folder (usually `public_html` or `www`).

## Updating

When you have a new version:
1. Go back to the main project directory
2. Run: `npm run deploy:website`
3. Re-upload the updated files

## File Sizes

Current download sizes:
- Installer: ~195 MB
- 64-bit Portable: ~100 MB  
- 32-bit Portable: ~96 MB

Make sure your hosting supports these file sizes.

## Support

The website includes:
- ✅ Professional download page
- ✅ Multiple download options
- ✅ System requirements
- ✅ Feature descriptions
- ✅ Release notes
- ✅ Mobile responsive design
- ✅ Download tracking (console logs)

For more details, see the main `DEPLOYMENT.md` file in the project root. 