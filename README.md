# bitbeans.me

Personal website, built with Next.js, React, Tailwind CSS, and Framer Motion, deployed on Netlify.

## Development

```bash
npm run dev       # Start local dev server (Turbopack)
npm run check     # Run ESLint + TypeScript typecheck
npm run format:check
```

## Structure

- `src/app/portfolio-scene.tsx` — Scene layout, camera flight, URL/history sync, and focus management
- `src/app/animated-logo.tsx` — Animated SVG logo with retracting branches and crossbar flight
- `src/app/circuit-backdrop.tsx` — Procedural circuit traces and flight connectors
- `src/app/segment-labels.tsx` — 7-segment display navigation labels (`Work`, `About`, `Game`, `Back`)
- `src/app/portfolio-panel.tsx` — Docked green panel frame and section content (projects, designs, about, game)
- `src/app/sections.ts` — Routes, section metadata, and URL/hash helpers
- `public/images/` — Project preview and design artwork
