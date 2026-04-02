

# Rebrand Domain from trustp2p.com to buysusdtp2p.com

## Scope
Replace all references to `trustp2p.com` with `buysusdtp2p.com` across the entire codebase. This includes URLs, meta tags, sitemap, robots.txt, and brand name references where used as a domain.

## Files to Update

### 1. `index.html`
- Change canonical URL to `https://buysusdtp2p.com`
- Update OG image URLs to `https://buysusdtp2p.com/og-image.jpg`
- Update Twitter image URL similarly

### 2. `public/sitemap.xml`
- Replace all `https://trustp2p.com/` URLs with `https://buysusdtp2p.com/` (120+ entries)

### 3. `public/robots.txt`
- Change sitemap reference to `https://buysusdtp2p.com/sitemap.xml`

### 4. `src/components/Breadcrumbs.tsx`
- Update schema.org breadcrumb URL from `trustp2p.com` to `buysusdtp2p.com`

### 5. `src/hooks/use-demo-user.tsx`
- Update demo email from `demo@trustp2p.com` to `demo@buysusdtp2p.com`

### 6. `src/data/seo-pages.ts`
- No domain URLs in this file (uses relative paths), but meta titles reference "TrustP2P" as brand name — these stay as-is since TrustP2P is the brand name, not the domain

### 7. All other files with `trustp2p.com` references
- Update any hardcoded domain references across pages (SEOHead, OfferDetail, Index, etc.)

## What stays the same
- The brand name "TrustP2P" in UI text, headers, footer, and content remains unchanged — only the **domain** changes
- All internal routing (React Router paths) stays the same — those are relative

