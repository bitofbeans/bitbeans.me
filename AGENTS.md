# Project preferences

## Workflow

- Never run `npm run build` locally. It disrupts the running dev server.
- Skip routine test creation and test runs. Review the code you changed and keep verification focused on the request.
- Ask a focused question when the answer would materially change the result. Honor explicit limits on attempts and stop when asked.

## Homepage

- Keep the logo centered on black. Use Framer Motion and align the six logo branches to horizontal, vertical, or 45° axes.
- On load, retract the branches from offscreen in clockwise order starting at the upper left. Keep the stagger tight and increase it from 60 to 100 ms, with a quick recoil and a subtle overshoot before settling.

### Background traces

- Spread traces evenly around all four edges. Use sharp 90° bends, leave space between parallel runs, and give intentional crossings a small gap so longer sideways runs read as overpasses.
- Vary how far neighboring traces reach toward the logo. Let some nodes approach the clearance boundary while others stop farther out, giving the opening an uneven outline. Keep the full node clear of the logo throughout its travel.
- Use slim blue outlines around black centers and uniformly sized circular nodes. When tuning the blue thickness, adjust `blueOutlineScale` in `src/app/circuit-backdrop.tsx` to preserve the black center width.
- Start the sweep about one-third of the way across the top edge and continue clockwise. Stagger each trace by its actual entry position, including where routes swap lanes. Tune `firstEntryDelay`, `entryStagger`, and `drawDuration` independently in `src/app/circuit-backdrop.tsx`.
- Each node leads its trace at full size from offscreen, follows every bend, and glides to a smooth stop. Keep the borders clear before entry. With reduced motion enabled, show the completed logo and traces immediately.
