"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";

import { logoBranchStrokeWidth } from "./animated-logo";

type Size = { width: number; height: number; rem: number };
type Point = { x: number; y: number };

const laneSpacing = 82;
const firstEntryDelay = 0.52;
const entryStagger = 0.010;
const blueOutlineScale = 0.7;
const drawDuration = 0.42;
const drawEase = [0.4, 0, 0.25, 1] as const;
const terminalPadding = [0.1, 0.02, 0.08, 0, 0.11, 0.04, 0.07] as const;
const lanePatterns = [
  { reach: 0.92, jog: 0.22 },
  { reach: 0.76, jog: -0.25 },
  { reach: 0.98, jog: 0 },
  { reach: 0.68, jog: 0.3 },
  { reach: 0.88, jog: -0.19 },
] as const;

function traceLayout({ width, height, rem }: Size) {
  const logoWidth = Math.min(width * 0.85, height * 0.8, 36 * rem);
  const baseStrokeWidth = logoBranchStrokeWidth(logoWidth) / 2;
  const innerStrokeWidth = baseStrokeWidth / 2;
  const strokeWidth = innerStrokeWidth * (1 + blueOutlineScale);
  const crossingGap = strokeWidth / 4;
  const runSpacing = strokeWidth + crossingGap;
  const nodeInnerRadius = baseStrokeWidth * 0.525;
  const nodeOuterRadius =
    nodeInnerRadius + (baseStrokeWidth / 4) * blueOutlineScale;
  const nodeClearRadius = nodeOuterRadius + strokeWidth / 8;
  const clearRadius = logoWidth * 0.45;
  const minimumTerminalRadius = clearRadius + nodeOuterRadius;
  const startInset = nodeClearRadius + strokeWidth / 2 + 2;
  const perimeter = 2 * (width + height);

  const edges = [
    {
      side: "top",
      perimeterOffset: 0,
      span: width,
      depth: height / 2,
      point: (along: number, inward: number): Point => ({
        x: along,
        y: inward,
      }),
    },
    {
      side: "right",
      perimeterOffset: width,
      span: height,
      depth: width / 2,
      point: (along: number, inward: number): Point => ({
        x: width - inward,
        y: along,
      }),
    },
    {
      side: "bottom",
      perimeterOffset: width + height,
      span: width,
      depth: height / 2,
      point: (along: number, inward: number): Point => ({
        x: width - along,
        y: height - inward,
      }),
    },
    {
      side: "left",
      perimeterOffset: 2 * width + height,
      span: height,
      depth: width / 2,
      point: (along: number, inward: number): Point => ({
        x: inward,
        y: height - along,
      }),
    },
  ];

  const traces = edges.flatMap((edge, edgeIndex) => {
    const { side, perimeterOffset, span, depth, point } = edge;
    const count = Math.max(3, Math.round(span / laneSpacing));
    const pitch = span / count;
    const middle = span / 2;
    const slope = depth / middle;

    // Each edge owns the space between the diagonals from its two corners.
    const laneDepth = (offset: number, inset: number) =>
      depth - offset * slope - inset * Math.hypot(1, slope);
    const circleDepth = (offset: number, radius: number) =>
      offset < radius ? depth - Math.sqrt(radius ** 2 - offset ** 2) : depth;

    const jogLimit = (from: number, to: number) => {
      const low = Math.min(from, to);
      const high = Math.max(from, to);
      return Math.min(
        laneDepth(Math.max(middle - low, high - middle), runSpacing / 2),
        circleDepth(
          Math.max(0, low - middle, middle - high),
          minimumTerminalRadius,
        ),
      );
    };

    const lanes = Array.from({ length: count }, (_, index) => {
      const start = (index + 0.5) * pitch;
      const patternIndex = (index + edgeIndex * 2) % lanePatterns.length;
      const pattern = lanePatterns[patternIndex] ?? lanePatterns[0];
      const end = start + pitch * pattern.jog;
      const offset = Math.abs(end - middle);
      const edgeLimit = laneDepth(offset, nodeClearRadius);
      // Vary the reach per lane so the terminals give the logo an uneven border.
      const padding =
        terminalPadding[(index + edgeIndex * 3) % terminalPadding.length] ?? 0;
      const terminalRadius = minimumTerminalRadius + logoWidth * padding;
      const ringLimit = circleDepth(offset, terminalRadius);
      const limit = Math.min(edgeLimit, ringLimit);
      const meetsCircle =
        offset < terminalRadius &&
        ringLimit <= edgeLimit &&
        (Math.abs(index - (count - 1) / 2) < 1 ||
          (index + edgeIndex) % 3 === 0);
      const endpoint = meetsCircle ? limit : limit * pattern.reach;

      const jogDepth = Math.min(
        endpoint * (0.36 + patternIndex * 0.08),
        jogLimit(start, end),
      );
      return { start, end, endpoint, jogDepth, crossesOver: false };
    });

    // Swap the entry lanes of selected pairs so their longer jogs cross.
    const pairSpacing = Math.min(count, 5);
    const firstPair = Math.min(count - 2, (edgeIndex + 1) % pairSpacing);
    for (let index = firstPair; index + 1 < count; index++) {
      const first = lanes[index];
      const second = lanes[index + 1];
      if (!first || !second) continue;

      // The shallower jog and the deeper entry share a lane with the shallower
      // exit. Use the side where those two parallel runs have the most room.
      const firstSpacing = Math.abs(first.start - first.end);
      const secondSpacing = Math.abs(second.start - second.end);
      if (Math.max(firstSpacing, secondSpacing) < runSpacing) continue;

      const availableDepth = Math.min(
        Math.min(first.endpoint, second.endpoint) - nodeClearRadius,
        jogLimit(
          Math.min(first.start, first.end),
          Math.max(second.start, second.end),
        ),
      );
      const shallow = availableDepth * 0.36;
      const deep = availableDepth * 0.76;
      if (deep - shallow < runSpacing) continue;

      const firstStart = first.start;
      first.start = second.start;
      second.start = firstStart;
      const firstIsShallower = firstSpacing >= secondSpacing;
      first.jogDepth = firstIsShallower ? shallow : deep;
      second.jogDepth = firstIsShallower ? deep : shallow;
      second.crossesOver = true;
      index += pairSpacing - 1;
    }

    return lanes.flatMap(
      ({ start, end, endpoint, jogDepth, crossesOver }, index) => {
        if (endpoint <= nodeOuterRadius) return [];

        const from = point(start, -startInset);
        const terminal = point(end, endpoint);
        const bendDepth = Math.max(
          -2,
          Math.min(jogDepth, endpoint - nodeClearRadius),
        );
        const bends =
          start === end ? [] : [point(start, bendDepth), point(end, bendDepth)];
        const points = [from, ...bends, terminal];
        const offscreenJog =
          bends.length && bendDepth < -nodeOuterRadius
            ? Math.abs(end - start)
            : 0;
        const path = points
          .map(
            ({ x, y }, pointIndex) =>
              `${pointIndex === 0 ? "M" : "L"}${x},${y}`,
          )
          .join(" ");

        return [
          {
            key: `${side}-${index}`,
            path,
            points,
            crossesOver,
            perimeterPosition: perimeterOffset + start,
            entryDistance: startInset - nodeOuterRadius + offscreenJog,
          },
        ];
      },
    );
  });

  const preferredStart = width / 3;
  const topLeftEntries = traces.filter(
    ({ perimeterPosition }) => perimeterPosition < width / 2,
  );
  const sweepOrigin = topLeftEntries.reduce<number>(
    (closest, { perimeterPosition }) =>
      Math.abs(perimeterPosition - preferredStart) <
      Math.abs(closest - preferredStart)
        ? perimeterPosition
        : closest,
    topLeftEntries[0]?.perimeterPosition ?? preferredStart,
  );
  const sweepDistance = (position: number) =>
    (position - sweepOrigin + perimeter) % perimeter;
  const entryOrder = [...traces].sort(
    (first, second) =>
      sweepDistance(first.perimeterPosition) -
      sweepDistance(second.perimeterPosition),
  );
  const ranks = new Map(entryOrder.map(({ key }, rank) => [key, rank]));

  return {
    traces: traces.map((trace) => ({
      ...trace,
      rank: ranks.get(trace.key) ?? 0,
    })),
    nodeOuterRadius,
    nodeInnerRadius,
    nodeClearRadius,
    strokeWidth,
    innerStrokeWidth,
    crossingGap,
    clearRadius,
  };
}

type Layout = ReturnType<typeof traceLayout>;
type Trace = Layout["traces"][number];

function CircuitTrace({
  id,
  clearanceId,
  trace: { points, path, rank, entryDistance, crossesOver },
  layout: {
    strokeWidth,
    innerStrokeWidth,
    crossingGap,
    nodeClearRadius,
    nodeOuterRadius,
    nodeInnerRadius,
  },
  reduceMotion,
}: {
  id: string;
  clearanceId: string;
  trace: Trace;
  layout: Layout;
  reduceMotion: boolean;
}) {
  const travel = useMotionValue(reduceMotion ? 1 : 0);
  const initialRank = useRef(rank);
  let length = 0;
  const distances = points.map((point, index) => {
    const previous = points[index - 1];
    if (previous)
      length += Math.hypot(point.x - previous.x, point.y - previous.y);
    return length;
  });
  const offsets = distances.map((distance) => distance / length);
  // At zero travel the node is just tangent to the outside of the viewport.
  const progress = useTransform(travel, [0, 1], [entryDistance / length, 1]);
  const x = useTransform(
    progress,
    offsets,
    points.map((point) => point.x),
  );
  const y = useTransform(
    progress,
    offsets,
    points.map((point) => point.y),
  );

  useEffect(() => {
    if (reduceMotion) {
      travel.jump(1);
      return;
    }

    travel.jump(0);
    const rank = initialRank.current;
    void animate(travel, 1, {
      type: "tween",
      delay: firstEntryDelay + rank * entryStagger,
      duration: drawDuration,
      ease: drawEase,
    });
    return () => travel.stop();
  }, [travel, reduceMotion]);

  const traceHref = `#${id}`;
  const nodeClipId = `${id}-node-clip`;

  return (
    <>
      {crossesOver && (
        <use
          href={traceHref}
          stroke="black"
          strokeWidth={strokeWidth + 2 * crossingGap}
        />
      )}
      <use href={traceHref} />
      <use href={traceHref} stroke="black" strokeWidth={innerStrokeWidth} />
      <defs>
        <motion.path
          id={id}
          d={path}
          clipPath={`url(#${clearanceId})`}
          style={{ pathLength: progress }}
        />
        <clipPath id={nodeClipId}>
          <motion.circle cx={x} cy={y} r={nodeClearRadius} />
        </clipPath>
        {/* The head covers neighboring traces and keeps its own hollow center connected. */}
        <g id={`${id}-node`} clipPath={`url(#${nodeClipId})`}>
          <motion.circle
            cx={x}
            cy={y}
            r={nodeClearRadius}
            fill="black"
            stroke="none"
          />
          <motion.circle
            cx={x}
            cy={y}
            r={nodeOuterRadius}
            fill="currentColor"
            stroke="none"
          />
          <use href={traceHref} />
          <motion.circle
            cx={x}
            cy={y}
            r={nodeInnerRadius}
            fill="black"
            stroke="none"
          />
          <use href={traceHref} stroke="black" strokeWidth={innerStrokeWidth} />
        </g>
      </defs>
    </>
  );
}

export function CircuitBackdrop() {
  const backdrop = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size | null>(null);
  const reduceMotion = useReducedMotion();
  const backdropId = useId();
  const clearanceId = `${backdropId}-clearance`;

  useEffect(() => {
    if (!backdrop.current) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      const rem = Number.parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      setSize({ width, height, rem });
    });

    observer.observe(backdrop.current);
    return () => observer.disconnect();
  }, []);

  const layout = size ? traceLayout(size) : null;

  return (
    <div
      ref={backdrop}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 text-[#1d3044]"
    >
      {size && layout && (
        <svg
          viewBox={`0 0 ${size.width} ${size.height}`}
          className="size-full"
          fill="none"
          stroke="currentColor"
          strokeWidth={layout.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="miter"
        >
          <defs>
            <clipPath id={clearanceId}>
              <path
                clipRule="evenodd"
                fill="black"
                d={`M0,0 H${size.width} V${size.height} H0 Z
                    M${size.width / 2 - layout.clearRadius},${size.height / 2}
                    a${layout.clearRadius},${layout.clearRadius} 0 1 0 ${2 * layout.clearRadius},0
                    a${layout.clearRadius},${layout.clearRadius} 0 1 0 ${-2 * layout.clearRadius},0 Z`}
              />
            </clipPath>
          </defs>
          {layout.traces.map((trace) => (
            <CircuitTrace
              key={trace.key}
              id={`${backdropId}-${trace.key}`}
              clearanceId={clearanceId}
              trace={trace}
              layout={layout}
              reduceMotion={Boolean(reduceMotion)}
            />
          ))}
          {layout.traces.map(({ key }) => (
            <use key={`${key}-node`} href={`#${backdropId}-${key}-node`} />
          ))}
        </svg>
      )}
    </div>
  );
}
