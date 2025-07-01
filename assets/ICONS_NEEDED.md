# Application Icons Required

The application needs proper icons for professional deployment. Create these files in the `assets/` directory:

## Required Files

### `icon.ico` (Windows)
- **Format:** ICO file with multiple sizes
- **Sizes:** 256x256, 128x128, 64x64, 48x48, 32x32, 16x16
- **Purpose:** Windows application icon, taskbar, file explorer

### `icon.icns` (macOS)  
- **Format:** ICNS file with multiple sizes
- **Sizes:** 1024x1024, 512x512, 256x256, 128x128, 64x64, 32x32, 16x16
- **Purpose:** macOS application icon, dock, Finder

### `icon.png` (Linux)
- **Format:** PNG file
- **Size:** 512x512 pixels
- **Purpose:** Linux application icon, desktop environment

## Design Guidelines

### Visual Design
- **Theme:** Brain or lightbulb symbolizing intelligence and ideas
- **Style:** Modern, minimalist, professional
- **Colors:** Blue/purple gradient or monochrome
- **Background:** Transparent or subtle gradient

### Technical Requirements
- **Clarity:** Must be readable at 16x16 pixels
- **Simplicity:** Avoid fine details that disappear when scaled down
- **Contrast:** Good contrast for both light and dark backgrounds
- **File Size:** Keep under 1MB per file

## Creation Tools

### Online Tools (Free)
- [IconGenerator](https://icongenerator.org/) - Upload PNG, get all formats
- [Favicon.io](https://favicon.io/) - Simple icon generation
- [RealFaviconGenerator](https://realfavicongenerator.net/) - Comprehensive icon generation

### Desktop Software
- **GIMP** (Free) - Full image editing with ICO/ICNS plugins
- **Photoshop** (Paid) - Professional image editing
- **Sketch** (Mac, Paid) - Vector-based design tool

### macOS Specific
- [Image2icon](http://www.img2icnsapp.com/) - PNG to ICNS converter
- **Preview** (Built-in) - Can export to ICNS format

## Quick Creation Process

1. **Design a 1024x1024 PNG** with your icon design
2. **Use IconGenerator.org** to convert to all formats
3. **Download and place files** in the `assets/` directory
4. **Test the build** with `npm run build:win`

## Alternative: Use Placeholder Icons

For immediate testing, you can use simple placeholder icons:

```bash
# Create a simple colored square as placeholder
# (This is just for testing - replace with proper icons)
```

## Current Status
- [ ] icon.ico (Windows)
- [ ] icon.icns (macOS)  
- [ ] icon.png (Linux)

**Once these icons are created, the application will build properly and look professional when installed!** 