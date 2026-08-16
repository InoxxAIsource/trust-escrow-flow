---
name: P2PxBT migration quirks
description: Version-pinning rules for artifacts/trust-escrow-flow that must not be reverted to catalog versions.
---

The workspace catalog pins React 19, Tailwind v4, and tailwind-merge v3. The trust-escrow-flow artifact must override all three.

**Rule:** In `artifacts/trust-escrow-flow/package.json`, always use explicit versions (not `"catalog:"`) for:
- `react` / `react-dom` → `^18.3.1` (not catalog 19.1.0)
- `@types/react` / `@types/react-dom` → `^18.3.x` (not catalog 19.x)
- `tailwindcss` → `^3.4.17` (not catalog 4.x)
- `tailwind-merge` → `^2.6.0` (not catalog 3.x — breaking API change)
- `framer-motion` → `^12.38.0` (catalog has 12.23.24 which is too old)

**Why:** The project was built with React 18 and Tailwind v3. react-day-picker v8 and react-helmet-async 2.0.5 require React 18. Tailwind v4 uses a completely different config format (no tailwind.config.ts, different CSS directives), so switching would break all styling.

**How to apply:** When adding new deps to this artifact, check against the catalog carefully. Any dep that the catalog has at a major version higher than what this project was built with must be pinned explicitly.

**Tailwind setup:** Uses PostCSS (postcss.config.js) + tailwindcss-animate plugin. Do NOT add `@tailwindcss/vite` — it's for Tailwind v4 and will conflict with the PostCSS setup.

**Vite config:** Uses scaffold's vite.config.ts (PORT + BASE_PATH env vars, allowedHosts: true). Does NOT use @vitejs/plugin-react-swc (the original repo used swc; the Replit scaffold uses @vitejs/plugin-react from catalog — both produce identical output).
