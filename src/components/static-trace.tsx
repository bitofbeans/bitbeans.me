import type { TraceMetrics } from "~/lib/scene-geometry";

export function StaticTrace({
  d,
  metrics: m,
  tip,
  powered = false,
}: {
  d: string;
  metrics: Pick<
    TraceMetrics,
    | "strokeWidth"
    | "innerStrokeWidth"
    | "crossingGap"
    | "nodeOuterRadius"
    | "nodeInnerRadius"
  >;
  tip?: readonly [number, number];
  powered?: boolean;
}) {
  return (
    <g fill="none" strokeLinejoin="miter" strokeLinecap="butt">
      <path
        d={d}
        stroke="black"
        strokeWidth={m.strokeWidth + 2 * m.crossingGap}
      />
      <path d={d} stroke="#1d3044" strokeWidth={m.strokeWidth} />
      {powered && (
        <path
          d={d}
          className="corner-charge"
          pathLength={1}
          stroke="#5792af"
          strokeWidth={m.strokeWidth}
        />
      )}
      {tip && (
        <g>
          <circle
            cx={tip[0]}
            cy={tip[1]}
            r={m.nodeOuterRadius}
            fill="#1d3044"
          />
          <circle cx={tip[0]} cy={tip[1]} r={m.nodeInnerRadius} fill="black" />
        </g>
      )}
      <path d={d} stroke="black" strokeWidth={m.innerStrokeWidth} />
    </g>
  );
}
