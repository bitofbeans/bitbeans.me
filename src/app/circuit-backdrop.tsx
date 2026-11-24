"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useId, useMemo, useRef } from "react";

import { logoBranchStrokeWidth } from "./animated-logo";
import type { SceneGeometry } from "./portfolio-scene";
import { shouldSkipIntro, type Section } from "./sections";
import { StaticTrace } from "./static-trace";

type Size = { width: number; height: number; logoWidth: number };
type Point = { x: number; y: number };

const desktopLaneSpacing = 82;
const firstEntryDelay = 0.52;
const entryStagger = 0.01;
const blueOutlineScale = 0.7;
const drawDuration = 0.42;
const drawEase = [0.4, 0, 0.25, 1] as const;
// Coordinates on a 100 × 100 board. Each route starts with its entry position
// along the edge. Subsequent coordinates move alternately in Y and X for
// top/bottom entries, or X and Y for left/right entries.
const boardRoutes = {
  top: [
    [10, 15, 20],
    [14, 11, 24, 20, 7, 14],
    [39, 6, 28, 24, 4, 17],
    [43, 10, 32, 26, 36, 16],
    [47, 13, 40, 23],
    [51, 16, 44, 26],
    [63, 15, 74, 24],
    [67, 11, 54, 22, 50],
    [77, 7, 59, 19, 68, 26],
    [23, 3, 5, 11],
    [90, 6, 96, 9],
  ],
  right: [
    [12, 85, 23],
    [16, 90, 27, 82, 8, 88],
    [41, 96, 31, 78, 20],
    [47, 92, 36, 76],
    [51, 88, 40, 81],
    [58, 83, 53, 75],
    [68, 93, 45, 77],
    [73, 87, 63, 79],
    [79, 96, 70, 82, 76],
    [3, 84],
    [94, 85],
  ],
  bottom: [
    [92, 84, 76, 91, 84],
    [88, 88, 80],
    [71, 80, 95, 90],
    [66, 94, 61, 76],
    [57, 90, 52, 80],
    [49, 86, 66, 72],
    [32, 94, 46, 77],
    [26, 90, 41, 83, 36],
    [19, 94, 22, 81, 31, 86],
    [97, 85],
    [5, 81],
  ],
  left: [
    [90, 13, 79],
    [86, 9, 72, 19, 89, 14, 95],
    [62, 5, 76, 16, 83],
    [56, 10, 68, 24, 63],
    [50, 7, 60, 21],
    [46, 15, 52, 25],
    [38, 12, 55, 20],
    [34, 17, 29, 24],
    [30, 9, 42, 21],
    [96, 10, 93],
    [8, 7],
  ],
} as const;

export function traceMetrics(width: number, height: number, logoWidth: number) {
  const laneSpacing = Math.min(desktopLaneSpacing, width / 9, height / 6);
  const compactness = 1 - laneSpacing / desktopLaneSpacing;
  const baseStrokeWidth =
    (logoBranchStrokeWidth(logoWidth) / 2) * (1 - 0.4 * compactness);
  const innerStrokeWidth = baseStrokeWidth / 2;
  const strokeWidth = innerStrokeWidth * (1 + blueOutlineScale);
  const crossingGap = strokeWidth / 4;
  const nodeInnerRadius = baseStrokeWidth * 0.525;
  const nodeOuterRadius =
    nodeInnerRadius + (baseStrokeWidth / 4) * blueOutlineScale;
  const nodeClearRadius = nodeOuterRadius + strokeWidth / 8;
  return {
    compactness,
    strokeWidth,
    innerStrokeWidth,
    crossingGap,
    nodeInnerRadius,
    nodeOuterRadius,
    nodeClearRadius,
  };
}

function traceLayout({ width, height, logoWidth }: Size) {
  const {
    compactness,
    strokeWidth,
    innerStrokeWidth,
    crossingGap,
    nodeInnerRadius,
    nodeOuterRadius,
    nodeClearRadius,
  } = traceMetrics(width, height, logoWidth);
  const clearRadius = logoWidth * (0.45 - 0.05 * compactness);
  const verticalPadding =
    logoWidth * 0.44 * Math.max(0, 1 - width / (9 * desktopLaneSpacing));
  const startInset = nodeClearRadius + strokeWidth / 2 + 2;
  const perimeter = 2 * (width + height);

  // Stretch the space near the borders independently of the opening, so long
  // runs get longer on wide screens without pushing the tips off to the sides.
  function boardCoordinate(value: number, span: number, radius: number) {
    const margin = Math.max(
      span * 0.19,
      Math.min(span * 0.32, span / 2 - radius),
    );
    const distance = Math.min(value, 100 - value);
    const inset =
      distance <= 25
        ? (distance / 25) * margin
        : margin + ((distance - 25) / 25) * (span / 2 - margin);
    return value <= 50 ? inset : span - inset;
  }

  const traces = Object.entries(boardRoutes).flatMap(([side, routes]) => {
    const vertical = side === "top" || side === "bottom";
    const radius =
      clearRadius + nodeClearRadius + (vertical ? verticalPadding : 0);
    return routes.flatMap(([entry, ...turns], index) => {
      let x = vertical ? entry : side === "left" ? 0 : 100;
      let y = vertical ? (side === "top" ? 0 : 100) : entry;
      const toScreen = (): Point => ({
        x: boardCoordinate(x, width, clearRadius + nodeClearRadius),
        y: boardCoordinate(
          y,
          height,
          clearRadius + nodeClearRadius + verticalPadding,
        ),
      });
      const border = toScreen();
      const start = { ...border };
      if (vertical) start.y += side === "top" ? -startInset : startInset;
      else start.x += side === "left" ? -startInset : startInset;
      const points = [start];
      // Stop at the first contact, including on a sideways leg of a narrow layout.
      for (const [turn, coordinate] of turns.entries()) {
        const movesInY = (turn % 2 === 0) === vertical;
        if (movesInY) y = coordinate;
        else x = coordinate;
        const next = toScreen();
        const previous = points[points.length - 1]!;
        const axis = movesInY ? "y" : "x";
        const offset = movesInY ? next.x - width / 2 : next.y - height / 2;
        if (Math.abs(offset) < radius) {
          const center = (movesInY ? height : width) / 2;
          const direction = Math.sign(next[axis] - previous[axis]);
          const limit =
            center - direction * Math.sqrt(radius ** 2 - offset ** 2);
          if (
            direction * (limit - previous[axis]) >= 0 &&
            direction * (next[axis] - limit) >= 0
          ) {
            next[axis] = limit;
            if (next[axis] !== previous[axis]) points.push(next);
            break;
          }
        }
        points.push(next);
      }
      const tip = points[points.length - 1]!;
      if (
        tip.x < nodeOuterRadius ||
        tip.x > width - nodeOuterRadius ||
        tip.y < nodeOuterRadius ||
        tip.y > height - nodeOuterRadius
      )
        return [];
      const perimeterPosition =
        side === "top"
          ? border.x
          : side === "right"
            ? width + border.y
            : side === "bottom"
              ? width + height + width - border.x
              : perimeter - border.y;
      return [
        {
          key: `${side}-${index}`,
          points,
          border,
          side,
          index,
          path: points
            .map(({ x, y }, i) => `${i ? "L" : "M"}${x},${y}`)
            .join(" "),
          perimeterPosition,
          entryDistance: startInset - nodeOuterRadius,
        },
      ];
    });
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

function pointToSegmentDistance(p: Point, a: Point, b: Point) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq),
  );
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function pointToTraceDistance(p: Point, points: readonly Point[]) {
  let best = Infinity;
  for (let i = 1; i < points.length; i++) {
    const d = pointToSegmentDistance(p, points[i - 1]!, points[i]!);
    if (d < best) best = d;
  }
  return best;
}

function CircuitTrace({
  id,
  clearanceId,
  trace: { key, points, path, rank, entryDistance },
  layout: {
    strokeWidth,
    innerStrokeWidth,
    crossingGap,
    nodeClearRadius,
    nodeOuterRadius,
    nodeInnerRadius,
  },
  settleImmediately,
  charged,
  reduceMotion,
  registerPulse,
}: {
  id: string;
  clearanceId: string;
  trace: Trace;
  layout: Layout;
  settleImmediately: boolean;
  charged: boolean;
  reduceMotion: boolean;
  registerPulse: (key: string, fn: (() => void) | null) => void;
}) {
  const travel = useMotionValue(settleImmediately ? 1 : 0);
  const chargeLength = useMotionValue(0);
  const chargeOpacity = useMotionValue(0);
  const nodeChargeOpacity = useMotionValue(0);
  const initialRank = useRef(rank);
  const chargedRef = useRef(charged);
  const wasChargedRef = useRef(false);
  const lastPulseRef = useRef(0);
  const fadeTimerRef = useRef<number | null>(null);
  chargedRef.current = charged;

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
    if (settleImmediately) {
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
  }, [travel, settleImmediately]);

  // Charge/discharge smoothly when hovering Work / About / Game.
  useEffect(() => {
    if (!charged && !wasChargedRef.current) return;
    wasChargedRef.current = charged;

    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    if (charged) {
      if (reduceMotion) {
        chargeLength.jump(1);
        chargeOpacity.jump(0.95);
        nodeChargeOpacity.jump(0.95);
        return;
      }
      chargeLength.jump(0);
      chargeOpacity.jump(0.95);
      nodeChargeOpacity.jump(0);
      void animate(chargeLength, 1, {
        type: "tween",
        duration: 0.24,
        ease: "easeOut",
        onComplete() {
          if (chargedRef.current) {
            void animate(nodeChargeOpacity, 0.95, {
              type: "tween",
              duration: 0.14,
              ease: "easeOut",
            });
          }
        },
      });
    } else {
      if (reduceMotion) {
        chargeOpacity.jump(0);
        nodeChargeOpacity.jump(0);
        chargeLength.jump(0);
        return;
      }
      void animate(chargeOpacity, 0, {
        type: "tween",
        duration: 0.26,
        ease: "easeOut",
      });
      void animate(nodeChargeOpacity, 0, {
        type: "tween",
        duration: 0.22,
        ease: "easeOut",
      });
    }
  }, [charged, reduceMotion, chargeLength, chargeOpacity, nodeChargeOpacity]);

  // Register imperative cursor-proximity pulse handler (zero React re-renders).
  useEffect(() => {
    const triggerPulse = () => {
      if (reduceMotion || chargedRef.current) return;
      const now = performance.now();
      if (now - lastPulseRef.current < 950) return;
      lastPulseRef.current = now;

      if (fadeTimerRef.current !== null) {
        window.clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      chargeLength.stop();
      chargeOpacity.stop();
      nodeChargeOpacity.stop();

      chargeLength.jump(0);
      chargeOpacity.jump(0.85);
      nodeChargeOpacity.jump(0);

      void animate(chargeLength, 1, {
        type: "tween",
        duration: 0.3,
        ease: "easeOut",
        onComplete() {
          if (chargedRef.current) return;
          void animate(nodeChargeOpacity, 0.9, {
            type: "tween",
            duration: 0.12,
            ease: "easeOut",
          });
          fadeTimerRef.current = window.setTimeout(() => {
            if (chargedRef.current) return;
            void animate(chargeOpacity, 0, {
              type: "tween",
              duration: 0.42,
              ease: "easeOut",
            });
            void animate(nodeChargeOpacity, 0, {
              type: "tween",
              duration: 0.36,
              ease: "easeOut",
            });
          }, 110);
        },
      });
    };

    registerPulse(key, triggerPulse);
    return () => {
      registerPulse(key, null);
      if (fadeTimerRef.current !== null) {
        window.clearTimeout(fadeTimerRef.current);
      }
    };
  }, [
    key,
    reduceMotion,
    registerPulse,
    chargeLength,
    chargeOpacity,
    nodeChargeOpacity,
  ]);

  const traceHref = `#${id}`;
  const nodeClipId = `${id}-node-clip`;

  return (
    <>
      <use
        href={traceHref}
        stroke="black"
        strokeWidth={strokeWidth + 2 * crossingGap}
      />
      <use href={traceHref} />
      <motion.path
        d={path}
        clipPath={`url(#${clearanceId})`}
        stroke="#5792af"
        strokeWidth={strokeWidth}
        style={{ pathLength: chargeLength, opacity: chargeOpacity }}
      />
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
          <motion.circle
            cx={x}
            cy={y}
            r={nodeOuterRadius}
            fill="#5792af"
            stroke="none"
            style={{ opacity: nodeChargeOpacity }}
          />
          <use href={traceHref} />
          <motion.path
            d={path}
            clipPath={`url(#${clearanceId})`}
            stroke="#5792af"
            strokeWidth={strokeWidth}
            style={{ pathLength: chargeLength, opacity: chargeOpacity }}
          />
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

// Continue from the same entry coordinates the animated homepage traces use.
// The only edges the camera can uncover are the right and bottom of the home board.
function FlightConnections({
  g,
  layout,
}: {
  g: SceneGeometry;
  layout: Layout;
}) {
  const gap = g.distance - g.w;
  const farBottom = g.h + Math.max(0, g.cameraY) + 2 * layout.strokeWidth;
  const farTop = Math.min(0, g.cameraY) - 2 * layout.strokeWidth;
  return (
    <svg
      aria-hidden="true"
      width={g.w}
      height={g.h}
      className="absolute inset-0 overflow-visible"
      fill="none"
      strokeLinejoin="round"
    >
      {/* Interleaved overhead runs follow the approach up to the frame's leading corner. */}
      {(
        [
          [0.21, 0.36, 0.42, 0.6],
          [0.49, 0.28, 0.32, 0.47],
          [0.64, 0.66, 0.83, 0.79],
          [0.94, 0.44, 0.72, 0.53],
          [1.08, 0.87, 0.91, 0.97],
          [1.23, 0.59, 1.05, 0.73],
        ] as const
      ).map(([from, shelf, to, end]) => {
        const span = gap + g.left;
        const upper = g.cameraY + g.top;
        const endX = g.w + to * span,
          endY = end * upper;
        const d = `M${g.w + from * span} ${farTop}V${upper * shelf}H${endX}V${endY}`;
        return (
          <StaticTrace key={from} d={d} metrics={layout} tip={[endX, endY]} />
        );
      })}
      {layout.traces.map(({ side, index, border, key }) => {
        if (side !== "bottom" && side !== "right") return null;
        const { x, y } = border;
        let path: string;
        if (side === "right") {
          // Offset the two banks of bends to keep the flying wire in clear view.
          const lane = (index * 7) % 11;
          const bend = x + gap * (0.085 + lane * 0.061);
          const sign = y < g.h * 0.5 ? -1 : 1;
          const turnY = y + sign * g.h * (0.07 + (index % 3) * 0.055);
          path = `M${x - 1} ${y}H${bend}V${turnY}H${bend + gap * 0.11}V${sign < 0 ? farTop : farBottom}`;
        } else {
          const turnY =
            y +
            Math.max(g.h * 0.035, layout.strokeWidth * 2) * (1 + (index % 4));
          const shift =
            (index % 2 ? -1 : 1) * g.w * (0.025 + 0.016 * (index % 3));
          path = `M${x} ${y - 1}V${turnY}H${x + shift}V${farBottom}`;
        }
        return <StaticTrace key={key} d={path} metrics={layout} />;
      })}
    </svg>
  );
}

export function CircuitBackdrop({
  size,
  flight,
  hoveredSection = null,
  interactive = false,
}: {
  size: Size | null;
  flight: SceneGeometry | null;
  hoveredSection?: Section | null;
  interactive?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const backdropId = useId();
  const clearanceId = `${backdropId}-clearance`;
  const skipIntro = useRef<boolean | null>(null);
  if (skipIntro.current === null && typeof window !== "undefined") {
    skipIntro.current = shouldSkipIntro();
  }

  const layout = useMemo(() => size && traceLayout(size), [size]);
  const settleImmediately = Boolean(reduceMotion) || Boolean(skipIntro.current);

  const pulseHandlers = useRef(new Map<string, () => void>());
  const registerPulse = useCallback((key: string, fn: (() => void) | null) => {
    if (fn) pulseHandlers.current.set(key, fn);
    else pulseHandlers.current.delete(key);
  }, []);

  // Determine which traces are closest to the hovered logo link (Work/About/Game).
  const chargedKeys = useMemo(() => {
    if (!hoveredSection || !size || !layout) return new Set<string>();
    const offsetY =
      hoveredSection === "Work"
        ? -0.25 * size.logoWidth
        : hoveredSection === "Game"
          ? 0.25 * size.logoWidth
          : 0;
    const anchor: Point = {
      x: size.width / 2 - size.logoWidth * 0.26,
      y: size.height / 2 + offsetY,
    };
    const ranked = [...layout.traces]
      .map((trace) => {
        const tip = trace.points[trace.points.length - 1]!;
        return {
          key: trace.key,
          dist: Math.hypot(tip.x - anchor.x, tip.y - anchor.y),
        };
      })
      .sort((a, b) => a.dist - b.dist);
    return new Set(ranked.slice(0, 5).map((entry) => entry.key));
  }, [hoveredSection, size, layout]);

  // Send subtle #5792af power pulses down nearby traces as the cursor moves.
  useEffect(() => {
    if (!interactive || !layout || !size || reduceMotion) return;

    const introReadyAt = settleImmediately
      ? 0
      : performance.now() +
        (firstEntryDelay + layout.traces.length * entryStagger + drawDuration) *
          1000;

    let lastCheck = 0;
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const now = performance.now();
      if (now < introReadyAt || now - lastCheck < 45) return;
      lastCheck = now;

      const p: Point = { x: event.clientX, y: event.clientY };
      let closestKey: string | null = null;
      let closestDist = 135;

      for (const trace of layout.traces) {
        const d = pointToTraceDistance(p, trace.points);
        if (d < closestDist) {
          closestDist = d;
          closestKey = trace.key;
        }
      }

      if (closestKey) {
        pulseHandlers.current.get(closestKey)?.();
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [interactive, layout, size, reduceMotion, settleImmediately]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 text-[#1d3044]"
    >
      {flight && layout && <FlightConnections g={flight} layout={layout} />}
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
              settleImmediately={settleImmediately}
              charged={chargedKeys.has(trace.key)}
              reduceMotion={Boolean(reduceMotion)}
              registerPulse={registerPulse}
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
