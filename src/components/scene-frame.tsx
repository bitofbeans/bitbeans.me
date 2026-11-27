import type { SceneGeometry } from "~/lib/scene-geometry";
import { StaticTrace } from "./static-trace";

// Each route starts at a percentage along the edge, then alternates between
// depth in the margin and position along the edge. Only feeders reach depth 0.
const perimeterRoutes = [
  [
    [5, 65, 0, 0],
    [13, 42, 8],
    [22, 86, 34, 24, 28],
    [40, 49],
    [46, 76, 55, 34],
    [68, 48, 61],
    [78, 85, 72, 26, 82],
    [90, 40],
    [96, 58, 100, 0],
  ],
  [
    [6, 78, 0, 0],
    [12, 31, 20],
    [33, 83, 24, 47, 30],
    [38, 21],
    [55, 57, 47],
    [60, 80, 72, 20, 66],
    [83, 38, 77],
    [89, 64],
    [94, 76, 100, 0],
  ],
  [
    [4, 59, 0, 0],
    [13, 73, 20, 30],
    [29, 40, 24],
    [34, 84, 45, 28, 40],
    [52, 61],
    [65, 36, 58],
    [74, 82, 69, 50, 80],
    [90, 24],
    [96, 70, 100, 0],
  ],
  [
    [6, 69, 0, 0],
    [15, 48, 9],
    [24, 78, 35, 28],
    [42, 56, 38],
    [48, 32],
    [64, 82, 57, 46, 68],
    [78, 25, 73],
    [88, 52],
    [95, 73, 100, 0],
  ],
] as const;

// Coordinates are local to each side: along the rail, then outward from it.
// The supply end is outside the entire camera sweep, even on the return trip.
function PerimeterTraces({ g }: { g: SceneGeometry }) {
  const { w, h, left, top, distance, cameraY, traces, wire } = g;
  const gap = distance - w;
  const overscan = traces.strokeWidth * 3;
  const sides = [
    {
      transform: `translate(${left} ${top}) scale(1 -1)`,
      length: w - 2 * left,
      margin: top,
      supply: top + Math.max(0, cameraY) + overscan,
    },
    {
      transform: `translate(${w - left} ${top}) rotate(90) scale(1 -1)`,
      length: h - 2 * top,
      margin: left,
      supply: left + overscan,
    },
    {
      transform: `translate(${w - left} ${h - top}) rotate(180) scale(1 -1)`,
      length: w - 2 * left,
      margin: top,
      supply: top + Math.max(0, -cameraY) + overscan,
    },
    {
      transform: `translate(${left} ${h - top}) rotate(-90) scale(1 -1)`,
      length: h - 2 * top,
      margin: left,
      supply: left + gap,
    },
  ];
  return sides.map(({ transform, length, margin, supply }, side) => {
    const routes = perimeterRoutes[side]!;
    // Leave both the frame outline and the screen edge clear of terminal rings.
    const nearest = wire / 2 + traces.nodeOuterRadius + 3;
    const farthest = Math.max(nearest, margin - traces.nodeOuterRadius - 2);
    return (
      <g key={side} transform={transform}>
        {routes.map(([entry, ...turns], i) => {
          let x = (length * entry) / 100;
          let y = supply;
          let path = `M${x} ${y}`;
          if (side === 3) {
            const depth = left + gap * (0.16 + 0.075 * (i % 7));
            const outside =
              i % 2 ? h - top + cameraY + overscan : -top - overscan;
            path = `M${outside} ${depth}H${x}`;
          }
          for (const [j, coordinate] of turns.entries()) {
            if (j % 2 === 0) {
              y =
                coordinate === 0
                  ? 0
                  : nearest + ((farthest - nearest) * coordinate) / 100;
              path += `V${y}`;
            } else {
              x = (length * coordinate) / 100;
              path += `H${x}`;
            }
          }
          const feeder = y === 0;
          return (
            <StaticTrace
              key={i}
              d={path}
              metrics={traces}
              powered={feeder}
              tip={feeder ? undefined : [x, y]}
            />
          );
        })}
      </g>
    );
  });
}

export function SceneFrame({ g }: { g: SceneGeometry }) {
  const { w, h, left, top, wire } = g;
  const right = w - left,
    bottom = h - top;
  const outline = `M${left} ${top}H${right}V${bottom}H${left}Z`;
  return (
    <svg
      aria-hidden="true"
      className="frame-art"
      width={w}
      height={h}
      fill="none"
      strokeLinejoin="round"
    >
      <PerimeterTraces g={g} />
      <rect
        x={left}
        y={top}
        width={right - left}
        height={bottom - top}
        fill="black"
      />
      <g className="frame-power">
        <path d={outline} stroke="currentColor" strokeWidth={wire} />
        {[
          [left, top],
          [right, top],
          [right, bottom],
          [left, bottom],
        ].map(([cx, cy]) => (
          <circle
            key={cx + "-" + cy}
            cx={cx}
            cy={cy}
            r={wire * 0.67}
            fill="black"
            stroke="currentColor"
            strokeWidth={wire * 0.25}
          />
        ))}
        <path d={outline} stroke="black" strokeWidth={wire / 2} />
      </g>
    </svg>
  );
}
