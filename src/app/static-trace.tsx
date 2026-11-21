type TraceMetrics = {
  strokeWidth: number;
  innerStrokeWidth: number;
  crossingGap: number;
  nodeOuterRadius: number;
  nodeInnerRadius: number;
};

export function StaticTrace({
  d,
  metrics: m,
  tip,
  powered = false,
}: {
  d: string;
  metrics: TraceMetrics;
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
      <path d={d} stroke="black" strokeWidth={m.innerStrokeWidth} />
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
    </g>
  );
}
