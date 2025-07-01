# BrainLift Generator - Theme Rules

## Overview

This document defines the complete visual design system for the BrainLift Generator desktop application, implementing a Modern Professional aesthetic. All colors, typography, spacing, and visual elements are specified here to ensure consistency across the entire application.

## Color System

### Primary Color Palette
```css
:root {
  /* Primary Blues - Professional and trustworthy */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-200: #bfdbfe;
  --primary-300: #93c5fd;
  --primary-400: #60a5fa;
  --primary-500: #3b82f6;   /* Primary brand color */
  --primary-600: #2563eb;   /* Primary interactive color */
  --primary-700: #1d4ed8;
  --primary-800: #1e40af;
  --primary-900: #1e3a8a;
  --primary-950: #172554;
}
```

### Neutral Grays - Modern and Clean
```css
:root {
  /* Neutral Grays - Modern slate palette */
  --neutral-50: #f8fafc;
  --neutral-100: #f1f5f9;
  --neutral-200: #e2e8f0;
  --neutral-300: #cbd5e1;
  --neutral-400: #94a3b8;
  --neutral-500: #64748b;
  --neutral-600: #475569;
  --neutral-700: #334155;
  --neutral-800: #1e293b;
  --neutral-900: #0f172a;
  --neutral-950: #020617;
}
```

### Semantic Colors
```css
:root {
  /* Success - Research completion, positive states */
  --success-50: #ecfdf5;
  --success-100: #d1fae5;
  --success-500: #10b981;
  --success-600: #059669;
  --success-700: #047857;
  
  /* Warning - In progress, attention needed */
  --warning-50: #fffbeb;
  --warning-100: #fef3c7;
  --warning-500: #f59e0b;
  --warning-600: #d97706;
  --warning-700: #b45309;
  
  /* Error - Failed processes, destructive actions */
  --error-50: #fef2f2;
  --error-100: #fee2e2;
  --error-500: #ef4444;
  --error-600: #dc2626;
  --error-700: #b91c1c;
  
  /* Info - System messages, helpful hints */
  --info-50: #f0f9ff;
  --info-100: #e0f2fe;
  --info-500: #06b6d4;
  --info-600: #0891b2;
  --info-700: #0e7490;
}
```

### Application-Specific Colors
```css
:root {
  /* Document Status Colors */
  --status-purpose: var(--warning-500);     /* Yellow - Purpose definition */
  --status-research: var(--primary-500);   /* Blue - Active research */
  --status-complete: var(--success-500);   /* Green - Research complete */
  --status-review: var(--info-500);        /* Cyan - In review */
  --status-saved: var(--neutral-500);      /* Gray - Completed/saved */
  
  /* Content Type Colors */
  --expert-accent: var(--primary-600);     /* Blue - Expert information */
  --spiky-accent: #8b5cf6;                 /* Purple - SpikyPOV content */
  --knowledge-accent: var(--info-600);     /* Teal - Knowledge tree */
  
  /* Quality Indicators */
  --quality-high: var(--success-600);      /* Green - High credibility (8-10) */
  --quality-medium: var(--warning-600);    /* Yellow - Medium credibility (6-7) */
  --quality-low: var(--error-600);         /* Red - Low credibility (<6) */
}
```

### Surface and Background Colors
```css
:root {
  /* Background Hierarchy */
  --bg-primary: var(--neutral-50);         /* Main application background */
  --bg-secondary: #ffffff;                 /* Card and panel backgrounds */
  --bg-tertiary: var(--neutral-100);      /* Subtle section backgrounds */
  --bg-elevated: #ffffff;                  /* Modal and dropdown backgrounds */
  
  /* Interactive Backgrounds */
  --bg-hover: var(--neutral-100);         /* Hover states */
  --bg-active: var(--neutral-200);        /* Active/pressed states */
  --bg-selected: var(--primary-50);       /* Selected items */
  --bg-disabled: var(--neutral-100);      /* Disabled elements */
  
  /* Border Colors */
  --border-light: var(--neutral-200);     /* Subtle borders */
  --border-medium: var(--neutral-300);    /* Standard borders */
  --border-strong: var(--neutral-400);    /* Emphasized borders */
  --border-focus: var(--primary-500);     /* Focus indicators */
}
```

### Text Colors
```css
:root {
  /* Text Hierarchy */
  --text-primary: var(--neutral-900);     /* Headlines, primary content */
  --text-secondary: var(--neutral-700);   /* Secondary content, descriptions */
  --text-tertiary: var(--neutral-500);    /* Metadata, timestamps */
  --text-disabled: var(--neutral-400);    /* Disabled text */
  --text-inverse: #ffffff;                /* Text on dark backgrounds */
  
  /* Interactive Text */
  --text-link: var(--primary-600);        /* Links and clickable text */
  --text-link-hover: var(--primary-700);  /* Link hover state */
  --text-link-visited: var(--primary-800); /* Visited links */
}
```

## Typography System

### Font Families
```css
:root {
  /* Primary Font Stack - Modern, readable sans-serif */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
               'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  
  /* Monospace Font - Code and technical content */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 
               'Inconsolata', 'Roboto Mono', monospace;
  
  /* Serif Font - Formal content (if needed) */
  --font-serif: 'Crimson Text', 'Georgia', 'Times New Roman', serif;
}
```

### Font Sizes and Hierarchy
```css
:root {
  /* Font Size Scale - Modular scale based on 1rem = 16px */
  --text-xs: 0.75rem;      /* 12px - Small metadata */
  --text-sm: 0.875rem;     /* 14px - Secondary text */
  --text-base: 1rem;       /* 16px - Body text */
  --text-lg: 1.125rem;     /* 18px - Large body text */
  --text-xl: 1.25rem;      /* 20px - Small headings */
  --text-2xl: 1.5rem;      /* 24px - Medium headings */
  --text-3xl: 1.875rem;    /* 30px - Large headings */
  --text-4xl: 2.25rem;     /* 36px - Extra large headings */
  --text-5xl: 3rem;        /* 48px - Display headings */
}
```

### Font Weights
```css
:root {
  --font-light: 300;       /* Light emphasis */
  --font-normal: 400;      /* Regular body text */
  --font-medium: 500;      /* Medium emphasis */
  --font-semibold: 600;    /* Semi-bold headings */
  --font-bold: 700;        /* Bold headings */
  --font-extrabold: 800;   /* Extra emphasis */
}
```

### Line Heights
```css
:root {
  --leading-tight: 1.25;   /* Tight line height for headings */
  --leading-snug: 1.375;   /* Snug line height */
  --leading-normal: 1.5;   /* Normal line height for body text */
  --leading-relaxed: 1.625; /* Relaxed line height */
  --leading-loose: 2;      /* Loose line height for special cases */
}
```

### Typography Classes
```css
/* Heading Styles */
.text-h1 {
  font-family: var(--font-sans);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.text-h2 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.text-h3 {
  font-family: var(--font-sans);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.text-h4 {
  font-family: var(--font-sans);
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  line-height: var(--leading-snug);
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

/* Body Text Styles */
.text-body-lg {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: var(--font-normal);
  line-height: var(--leading-relaxed);
  color: var(--text-primary);
}

.text-body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--text-primary);
}

.text-body-sm {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
}

/* Specialized Text */
.text-code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  background-color: var(--bg-tertiary);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  color: var(--text-primary);
}

.text-metadata {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
}

.text-link {
  color: var(--text-link);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.15s ease-in-out;
}

.text-link:hover {
  color: var(--text-link-hover);
}
```

## Spacing System

### Base Spacing Scale
```css
:root {
  /* Spacing Scale - 8px base unit */
  --space-0: 0;
  --space-1: 0.25rem;     /* 4px */
  --space-2: 0.5rem;      /* 8px - Base unit */
  --space-3: 0.75rem;     /* 12px */
  --space-4: 1rem;        /* 16px */
  --space-5: 1.25rem;     /* 20px */
  --space-6: 1.5rem;      /* 24px */
  --space-8: 2rem;        /* 32px */
  --space-10: 2.5rem;     /* 40px */
  --space-12: 3rem;       /* 48px */
  --space-16: 4rem;       /* 64px */
  --space-20: 5rem;       /* 80px */
  --space-24: 6rem;       /* 96px */
  --space-32: 8rem;       /* 128px */
}
```

### Component Spacing
```css
:root {
  /* Component-specific spacing */
  --padding-xs: var(--space-2);       /* 8px - Tight padding */
  --padding-sm: var(--space-3);       /* 12px - Small padding */
  --padding-md: var(--space-4);       /* 16px - Medium padding */
  --padding-lg: var(--space-6);       /* 24px - Large padding */
  --padding-xl: var(--space-8);       /* 32px - Extra large padding */
  
  /* Margin spacing */
  --margin-xs: var(--space-2);        /* 8px */
  --margin-sm: var(--space-4);        /* 16px */
  --margin-md: var(--space-6);        /* 24px */
  --margin-lg: var(--space-8);        /* 32px */
  --margin-xl: var(--space-12);       /* 48px */
  
  /* Gap spacing for flex/grid layouts */
  --gap-xs: var(--space-2);           /* 8px */
  --gap-sm: var(--space-4);           /* 16px */
  --gap-md: var(--space-6);           /* 24px */
  --gap-lg: var(--space-8);           /* 32px */
  --gap-xl: var(--space-12);          /* 48px */
}
```

## Border Radius and Shadows

### Border Radius Scale
```css
:root {
  --radius-none: 0;
  --radius-sm: 0.125rem;      /* 2px - Subtle rounding */
  --radius-base: 0.25rem;     /* 4px - Standard rounding */
  --radius-md: 0.375rem;      /* 6px - Medium rounding */
  --radius-lg: 0.5rem;        /* 8px - Large rounding */
  --radius-xl: 0.75rem;       /* 12px - Extra large rounding */
  --radius-2xl: 1rem;         /* 16px - Very large rounding */
  --radius-full: 9999px;      /* Fully rounded (pills, circles) */
}
```

### Shadow System
```css
:root {
  /* Elevation Shadows - Modern, subtle depth */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 
               0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-base: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
                 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
               0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
               0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  
  /* Focus Shadow */
  --shadow-focus: 0 0 0 3px rgba(59, 130, 246, 0.1);
  
  /* Inner Shadows */
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}
```

## Component Styling

### Button Styles
```css
/* Primary Button */
.btn-primary {
  background-color: var(--primary-600);
  color: var(--text-inverse);
  border: 1px solid var(--primary-600);
  border-radius: var(--radius-md);
  padding: var(--padding-sm) var(--padding-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  min-height: 44px;
  transition: all 0.15s ease-in-out;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background-color: var(--primary-700);
  border-color: var(--primary-700);
  box-shadow: var(--shadow-base);
}

.btn-primary:focus {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.btn-primary:active {
  background-color: var(--primary-800);
  box-shadow: var(--shadow-xs);
}

.btn-primary:disabled {
  background-color: var(--neutral-300);
  border-color: var(--neutral-300);
  color: var(--text-disabled);
  cursor: not-allowed;
  box-shadow: none;
}

/* Secondary Button */
.btn-secondary {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  padding: var(--padding-sm) var(--padding-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  min-height: 44px;
  transition: all 0.15s ease-in-out;
}

.btn-secondary:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-strong);
}

/* Destructive Button */
.btn-destructive {
  background-color: var(--error-600);
  color: var(--text-inverse);
  border: 1px solid var(--error-600);
  border-radius: var(--radius-md);
  padding: var(--padding-sm) var(--padding-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  min-height: 44px;
  transition: all 0.15s ease-in-out;
}

.btn-destructive:hover {
  background-color: var(--error-700);
  border-color: var(--error-700);
}
```

### Card Styles
```css
.card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--padding-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.15s ease-in-out;
}

.card:hover {
  box-shadow: var(--shadow-base);
  border-color: var(--border-medium);
}

.card-header {
  padding-bottom: var(--padding-md);
  border-bottom: 1px solid var(--border-light);
  margin-bottom: var(--padding-md);
}

.card-footer {
  padding-top: var(--padding-md);
  border-top: 1px solid var(--border-light);
  margin-top: var(--padding-md);
}
```

### Form Element Styles
```css
.input {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  padding: var(--padding-sm) var(--padding-md);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--text-primary);
  min-height: 44px;
  transition: all 0.15s ease-in-out;
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: var(--shadow-focus);
}

.input:disabled {
  background-color: var(--bg-disabled);
  color: var(--text-disabled);
  cursor: not-allowed;
}

.input.error {
  border-color: var(--error-500);
}

.input.success {
  border-color: var(--success-500);
}

.label {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin-bottom: var(--margin-xs);
  display: block;
}

.help-text {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: var(--margin-xs);
}

.error-text {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--error-600);
  margin-top: var(--margin-xs);
}
```

### Progress Indicators
```css
.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--neutral-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-500);
  border-radius: var(--radius-full);
  transition: width 0.3s ease-in-out;
}

.progress-fill.success {
  background-color: var(--success-500);
}

.progress-fill.warning {
  background-color: var(--warning-500);
}

.progress-fill.error {
  background-color: var(--error-500);
}

/* Circular Progress */
.progress-circle {
  width: 40px;
  height: 40px;
  border: 3px solid var(--neutral-200);
  border-top: 3px solid var(--primary-500);
  border-radius: var(--radius-full);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### Status Indicators
```css
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--padding-xs) var(--padding-sm);
  border-radius: var(--radius-full);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.purpose {
  background-color: var(--warning-100);
  color: var(--warning-700);
}

.status-badge.research {
  background-color: var(--primary-100);
  color: var(--primary-700);
}

.status-badge.complete {
  background-color: var(--success-100);
  color: var(--success-700);
}

.status-badge.review {
  background-color: var(--info-100);
  color: var(--info-700);
}

.status-badge.saved {
  background-color: var(--neutral-100);
  color: var(--neutral-700);
}
```

## Animation and Transitions

### Timing Functions
```css
:root {
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Duration Scale
```css
:root {
  --duration-fast: 0.1s;
  --duration-normal: 0.15s;
  --duration-slow: 0.3s;
  --duration-slower: 0.5s;
}
```

### Common Animations
```css
.fade-in {
  animation: fadeIn var(--duration-normal) var(--ease-out) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.slide-in-up {
  animation: slideInUp var(--duration-slow) var(--ease-out) forwards;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.scale-in {
  animation: scaleIn var(--duration-normal) var(--ease-bounce) forwards;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

## Responsive Design Tokens

### Breakpoint Variables
```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

### Responsive Typography
```css
/* Responsive font sizes using clamp() */
:root {
  --text-responsive-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-responsive-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --text-responsive-base: clamp(1rem, 0.925rem + 0.375vw, 1.125rem);
  --text-responsive-lg: clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem);
  --text-responsive-xl: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);
  --text-responsive-2xl: clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem);
  --text-responsive-3xl: clamp(1.875rem, 1.65rem + 1.125vw, 2.25rem);
}
```

## Implementation Guidelines

### CSS Custom Properties Usage
```css
/* Always use CSS custom properties for theme values */
.component {
  /* ✅ Correct - Uses theme tokens */
  color: var(--text-primary);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-medium);
  
  /* ❌ Incorrect - Hard-coded values */
  color: #1e293b;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
}
```

### Dark Mode Preparation
```css
/* Theme structure ready for dark mode */
:root {
  color-scheme: light;
}

:root[data-theme="dark"] {
  color-scheme: dark;
  
  /* Override theme variables for dark mode */
  --bg-primary: var(--neutral-900);
  --bg-secondary: var(--neutral-800);
  --text-primary: var(--neutral-100);
  --text-secondary: var(--neutral-300);
  /* ... additional dark mode overrides */
}
```

### Tailwind CSS Integration
```javascript
// tailwind.config.js - Integrate theme tokens
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'rgb(from var(--primary-50) r g b)',
          500: 'rgb(from var(--primary-500) r g b)',
          600: 'rgb(from var(--primary-600) r g b)',
          // ... map all theme colors
        },
        neutral: {
          50: 'rgb(from var(--neutral-50) r g b)',
          // ... map all neutral colors
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        // ... map all spacing values
      }
    }
  }
}
```

### Component Theme Integration
```typescript
// React component using theme tokens
interface ThemeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ThemeProps> = ({ variant = 'primary', size = 'md' }) => {
  const className = `
    btn-${variant} 
    btn-${size}
    transition-all duration-normal ease-in-out
  `;
  
  return <button className={className} />;
};
```

This comprehensive theme system ensures visual consistency, maintainability, and scalability across the entire BrainLift Generator application while supporting the Modern Professional aesthetic and desktop-first approach. 