# bitbeans.me

Personal website, built with Next.js, React, Tailwind CSS, and Framer Motion, deployed on Netlify.

## Development

```bash
npm run dev       # Start local dev server (Turbopack)
npm run check     # Run ESLint + TypeScript typecheck
npm run format:check
```

## Structure

- `content/blog/` — Markdown blog posts (`*.md` with YAML frontmatter), sorted newest-first
- `src/app/` — Next.js App Router routes, metadata, OG images, sitemap, and robots
- `src/lib/` — Shared non-UI modules (`sections.ts`, `scene-geometry.ts`, `blog.ts`, `blog-types.ts`)
- `src/components/` — Scene and UI components:
  - `portfolio-scene.tsx` — Scene orchestrator, camera flight, URL/history sync, and focus management
  - `animated-logo.tsx` — Animated SVG logo with retracting branches and horizontal/vertical flight
  - `circuit-backdrop.tsx` — Procedural circuit traces and flight connectors
  - `scene-frame.tsx` — Docked green panel frame and perimeter feeder traces
  - `segment-labels.tsx` — 7-segment display labels (`Work`, `About`, `Blog`, `Back`, `Top`)
  - `modal-dialog.tsx` — Shared accessible focus-trapped modal
  - `work/` — Work projects, designs gallery, lightbox, bookmarklet, and `portfolio-data.ts`
  - `about/` — About section
  - `blog/` — Vertical circuit tree (`blog-panel.tsx`) and Markdown reader modal (`blog-post-modal.tsx`)
- `public/images/` — Project preview and design artwork
