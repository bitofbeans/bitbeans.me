# Workflow

- Never run `npm run build` locally. It disrupts the running dev server. Review the diff and verify the requested change. Skip routine tests and test creation.
- Ask a focused question when the answer would materially change the result. Respect explicit attempt limits and stop requests.

## Homepage and navigation

- Keep the logo centered on black and the viewport fixed on desktop and mobile. Only content inside a docked panel scrolls.
- Animate the six logo branches with Framer Motion along horizontal, vertical, or 45° axes. Retract clockwise from the upper left, increasing the stagger from 60 to 100 ms, with a quick recoil and subtle overshoot.
- The camera follows the rightmost white node to the green frame. Preserve wire widths throughout the flight, feed all four corners with blue traces, and keep cut ends offscreen.
- Match the white node’s flight to the logo fly-in: fast travel with a spring snap. Ease the camera independently and more slowly, without overshoot, in both directions. Dock only after both settle.
- Keep the white node’s full flight inside the SVG viewport for Safari. Draw black inner lines over node outlines so the channels stay connected like the logo.
- Work, About, Blog, Back, and Top share the segmented startup flash. Back and Top flash on docking. With reduced motion, show settled states immediately.
- Give Back the same hover and keyboard-focus highlight as the logo links.

## Background traces

- Route all four edges with varied right-angle bends, spaced parallel runs, and small gaps at crossings. Vary how far nodes reach inward and keep each full node clear of the logo, with extra clearance on mobile.
- Start offscreen about one-third across the top and sweep clockwise by each trace’s actual entry point. Each full-size node leads its line around every bend and glides to a stop.
- In `src/components/circuit-backdrop.tsx`, tune `firstEntryDelay`, `entryStagger`, and `drawDuration` independently. Adjust `blueOutlineScale` in `src/lib/scene-geometry.ts` to change blue thickness while preserving the black centers.

## Portfolio and blog content

- Edit projects and designs in `src/components/work/portfolio-data.ts`. Project order follows the `projects` array. Store artwork in `public/images/` and include its intrinsic dimensions and descriptive alt text for project previews.
- Add or edit blog posts as Markdown files in `content/blog/`.
