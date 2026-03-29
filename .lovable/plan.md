

# Fix Font Loading Errors + SEO Improvements

## Problem
1. **Font errors**: Google Fonts CSS is loaded via `@import` in CSS, which can fail in some environments and blocks rendering. The fonts (Inter, Space Grotesk) are showing "Other error" failures.
2. **SEO issues**: Missing sitemap.xml, no `font-display: swap` preload hints, OG image uses an expiring signed URL.

## Plan

### 1. Fix font loading — Move Google Fonts to `index.html` with `<link>` preconnect
- Remove `@import url(...)` from `src/index.css` line 1
- Add `<link rel="preconnect">` and `<link rel="stylesheet">` tags in `index.html` `<head>` for both fonts
- This is more reliable and allows the browser to load fonts in parallel

### 2. Add `public/sitemap.xml`
- Create a sitemap listing all static routes (`/`, `/how-it-works`, `/fees`, `/marketplace`, `/blog`, `/auth`, `/verify`) plus all SEO landing page slugs
- Reference it in `robots.txt`

### 3. Update `robots.txt`
- Add `Sitemap: https://trustp2p.com/sitemap.xml` directive

### 4. Fix OG image URL
- The current OG image uses a signed Google Cloud Storage URL that will expire. Replace with a permanent public URL or host the image in `public/` folder.

### Files Changed
- `src/index.css` — remove line 1 font import
- `index.html` — add font preconnect + stylesheet links
- `public/sitemap.xml` — new file
- `public/robots.txt` — add sitemap directive

