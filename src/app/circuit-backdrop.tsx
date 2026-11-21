"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Size = { width: number; height: number; rem: number };
type Point = { x: number; y: number };

const laneSpacing = 82;
const lanePatterns = [
  { reach: 0.92, jog: 0.22 },
  { reach: 0.76, jog: -0.25 },
  { reach: 0.98, jog: 0 },
  { reach: 0.68, jog: 0.3 },
  { reach: 0.88, jog: -0.19 },
] as const;

function traceLayout({ width, height, rem }: Size) {
  const unit = Math.min(width / 2160, height / 1340);
  const nodeRadius = 13 * unit;
  const strokeWidth = 5.5 * unit;
  const nodeInset = nodeRadius + strokeWidth / 2;

  // The marked circle is about 56% of the logo's SVG width.
  const logoWidth = Math.min(width * 0.85, height * 0.8, 36 * rem);
  const clearRadius = logoWidth * 0.56;
  const terminalRadius = clearRadius + nodeInset;

  const edges = [
    {
      side: "top",
      span: width,
      depth: height / 2,
      point: (along: number, inward: number): Point => ({
        x: along,
        y: inward,
      }),
    },
    {
      side: "right",
      span: height,
      depth: width / 2,
      point: (along: number, inward: number): Point => ({
        x: width - inward,
        y: along,
      }),
    },
    {
      side: "bottom",
      span: width,
      depth: height / 2,
      point: (along: number, inward: number): Point => ({
        x: width - along,
        y: height - inward,
      }),
    },
    {
      side: "left",
      span: height,
      depth: width / 2,
      point: (along: number, inward: number): Point => ({
        x: inward,
        y: height - along,
      }),
    },
  ];

  const traces = edges.flatMap(({ side, span, depth, point }, edgeIndex) => {
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
        laneDepth(Math.max(middle - low, high - middle), strokeWidth / 2),
        circleDepth(
          Math.max(0, low - middle, middle - high),
          clearRadius + strokeWidth / 2,
        ),
      );
    };

    const lanes = Array.from({ length: count }, (_, index) => {
      const start = (index + 0.5) * pitch;
      const patternIndex = (index + edgeIndex * 2) % lanePatterns.length;
      const pattern = lanePatterns[patternIndex] ?? lanePatterns[0];
      const end = start + pitch * pattern.jog;
      const offset = Math.abs(end - middle);
      const edgeLimit = laneDepth(offset, nodeInset);
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
      return { start, end, endpoint, jogDepth };
    });

    // Swap the entry lanes of selected pairs so their longer jogs cross.
    const pairSpacing = Math.min(count, 5);
    const firstPair = Math.min(count - 2, (edgeIndex + 1) % pairSpacing);
    for (let index = firstPair; index + 1 < count; index += pairSpacing) {
      const first = lanes[index];
      const second = lanes[index + 1];
      if (!first || !second) continue;

      const availableDepth = Math.min(
        first.endpoint,
        second.endpoint,
        jogLimit(
          Math.min(first.start, first.end),
          Math.max(second.start, second.end),
        ),
      );
      if (availableDepth < pitch * 0.25) continue;

      // Offset a straight entry slightly to keep the crossing to a single point.
      const secondStart =
        first.start === first.end ? first.start + pitch * 0.08 : first.start;
      first.start = second.start;
      second.start = secondStart;
      first.jogDepth = availableDepth * 0.42;
      second.jogDepth = availableDepth * 0.72;
    }

    return lanes.map(({ start, end, endpoint, jogDepth }, index) => {
      if (endpoint <= nodeInset) return null;

      const from = point(start, -2);
      const terminal = point(end, endpoint);
      const bends =
        start === end
          ? []
          : [
              point(start, Math.max(-2, jogDepth)),
              point(end, Math.max(-2, jogDepth)),
            ];
      const path = [from, ...bends, terminal]
        .map(
          ({ x, y }, pointIndex) => `${pointIndex === 0 ? "M" : "L"}${x},${y}`,
        )
        .join(" ");

      return {
        key: `${side}-${index}`,
        path,
        terminal,
        delay: 0.85 + edgeIndex * 0.12 + (index % 8) * 0.065,
      };
    });
  });

  return { traces, nodeRadius, strokeWidth };
}

export function CircuitBackdrop() {
  const backdrop = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size | null>(null);
  const reduceMotion = useReducedMotion();

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
          {layout.traces.map((trace) => {
            if (!trace) return null;
            const { key, path, terminal, delay } = trace;
            const duration = 0.72;
            return (
              <g key={key}>
                <motion.path
                  d={path}
                  initial={reduceMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { delay, duration, ease: "easeOut" }
                  }
                />
                <motion.circle
                  cx={terminal.x}
                  cy={terminal.y}
                  fill="black"
                  initial={reduceMotion ? false : { r: 0, opacity: 0 }}
                  animate={{ r: layout.nodeRadius, opacity: 1 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : {
                          delay: delay + duration,
                          duration: 0.24,
                          ease: "easeOut",
                        }
                  }
                />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
