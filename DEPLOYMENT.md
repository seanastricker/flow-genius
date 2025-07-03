# BrainLift Generator - Website Deployment Guide

This guide explains how to deploy your BrainLift Generator application to a website for easy distribution.

## Quick Start

### 1. Build and Deploy Website
```bash
npm run deploy:website
```

This command will:
- Build the application (`npm run build:win`)
- Create a `website/` directory with all necessary files
- Copy `.exe` files to `website/downloads/`
- Update HTML with current version and file sizes
- Create a local test server

### 2. Test Locally
```bash
cd website
node test-server.js
```
Open http://localhost:3000 to test your download site.

### 3. Deploy to Hosting
Upload the entire `website/` folder to your web hosting service.

## Deployment Commands

### Full Deployment (Recommended)
```bash
npm run deploy:website
```
Builds the app and prepares the complete website.

### Website Only (if already built)
```bash
npm run deploy:website-only
```
Only prepares the website using existing build files.

### Build Only
```bash
npm run deploy:build-website
```
Only builds the application without updating the website.

## Hosting Options

### 1. Netlify (Easiest)
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop your `website/` folder
3. Get instant hosting with HTTPS

### 2. Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the `website/` directory
3. Follow the prompts

### 3. GitHub Pages (Free)
1. Create a new repository for your website
2. Upload `website/` contents to the repository
3. Enable GitHub Pages in repository settings

### 4. Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize in website directory
cd website
firebase init hosting

# Deploy
firebase deploy
```

### 5. Traditional Web Hosting
Upload the `website/` folder contents to your web host's public directory (usually `public_html` or `www`).

## File Structure

After running deployment, you'll have:

```
website/
├── index.html              # Main download page
├── downloads/               # Application files
│   ├── BrainLift Generator-0.1.0.exe         # Windows installer (~195MB)
│   ├── BrainLift Generator-0.1.0-x64.exe     # 64-bit portable (~100MB)
│   ├── BrainLift Generator-0.1.0-ia32.exe    # 32-bit portable (~96MB)
│   └── latest.yml           # Auto-updater info
├── deployment-info.json     # Deployment metadata
└── test-server.js          # Local testing server
```

## Customization

### Update Website Content
Edit `website/index.html` to customize:
- Company information
- Support contact details
- Feature descriptions
- Styling and colors

### Add Custom Domain
Most hosting providers allow you to add a custom domain:
1. Purchase a domain from a registrar
2. Point domain to your hosting provider
3. Configure DNS settings

### Add Analytics (Optional)
Add Google Analytics or other tracking to `website/index.html`:
```html
<!-- Add before closing </head> tag -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Security Considerations

### File Integrity
The deployment script automatically includes file sizes to help users verify downloads.

### HTTPS
Always use HTTPS hosting to ensure secure downloads. Most modern hosting providers include free SSL certificates.

### Content Security Policy
The website includes basic security headers. For production, consider adding:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline' cdn.tailwindcss.com;">
```

## Automation

### Automatic Deployment
Create a GitHub Action to automatically deploy when you release:

```yaml
# .github/workflows/deploy-website.yml
name: Deploy Website
on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run deploy:website
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v1.2
        with:
          publish-dir: './website'
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### Version Updates
When you update your application version:
1. Update `package.json` version
2. Run `npm run deploy:website`
3. Upload the updated `website/` folder

## Troubleshooting

### Large File Sizes
If your hosting has file size limits:
1. Consider hosting large files on a CDN
2. Use a service like GitHub Releases for the actual files
3. Update download links in HTML to point to external URLs

### Missing Files
If deployment script can't find files:
1. Ensure you've built the application first: `npm run build:win`
2. Check that `release/` directory exists
3. Verify file names match expected patterns

### Local Testing Issues
If the test server doesn't work:
1. Ensure Node.js is installed
2. Check that port 3000 isn't in use
3. Try a different port by editing `test-server.js`

## Support

For deployment issues:
1. Check the deployment logs for error messages
2. Ensure all dependencies are installed
3. Verify file permissions and paths
4. Test with the local server first

---

**Next Steps**: After successful deployment, consider setting up:
- Custom domain
- Download analytics
- User feedback system
- Automatic update notifications 