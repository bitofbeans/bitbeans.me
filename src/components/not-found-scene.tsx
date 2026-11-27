"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { artboardSize, logoBranchStrokeWidth } from "~/lib/scene-geometry";
import { CircuitBackdrop } from "./circuit-backdrop";
import { BackLabel, SegmentDigits } from "./segment-labels";

const logoWire = logoBranchStrokeWidth(artboardSize);
const nodeRadius = (19 / 64) * logoWire;
const nodeOuter = nodeRadius + logoWire / 2;
const dividerPad = 2;
const dividerWidth = 540;
const dividerHeight = Math.ceil(nodeOuter + dividerPad) * 2;
const dividerCenterY = dividerHeight / 2;
const leftNodeX = nodeOuter + dividerPad;
const rightNodeX = dividerWidth - nodeOuter - dividerPad;

type BackdropSize = { width: number; height: number; logoWidth: number };

export function NotFoundScene() {
  const root = useRef<HTMLElement>(null);
  const [backdropSize, setBackdropSize] = useState<BackdropSize | null>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth;
      const height = el.clientHeight;
      if (!width || !height) return;
      const rem =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const logoWidth = Math.min(width * 0.85, height * 0.8, 36 * rem);
      setBackdropSize({ width, height, logoWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <main
      ref={root}
      className="not-found-page fixed inset-x-0 top-0 isolate grid h-dvh place-items-center overflow-clip bg-black"
    >
      <CircuitBackdrop size={backdropSize} flight={null} />

      <section className="not-found-body" aria-labelledby="not-found-heading">
        <h1 id="not-found-heading" className="sr-only">
          404 — Page not found
        </h1>
        <SegmentDigits
          value="404"
          height={104}
          flash
          className="not-found-digits"
        />
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${dividerWidth} ${dividerHeight}`}
          className="not-found-divider"
          style={{
            width: `calc(var(--logo-size) * ${dividerWidth / artboardSize})`,
          }}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <g stroke="white" strokeWidth={logoWire}>
            <circle cx={leftNodeX} cy={dividerCenterY} r={nodeRadius} />
            <circle cx={rightNodeX} cy={dividerCenterY} r={nodeRadius} />
            <line
              x1={leftNodeX}
              y1={dividerCenterY}
              x2={rightNodeX}
              y2={dividerCenterY}
              strokeLinecap="butt"
            />
          </g>
          <g stroke="black" strokeWidth={logoWire / 2}>
            <circle
              cx={leftNodeX}
              cy={dividerCenterY}
              r={nodeRadius}
              fill="black"
            />
            <circle
              cx={rightNodeX}
              cy={dividerCenterY}
              r={nodeRadius}
              fill="black"
            />
            <line
              x1={leftNodeX}
              y1={dividerCenterY}
              x2={rightNodeX}
              y2={dividerCenterY}
            />
          </g>
        </svg>
        <Link href="/" className="not-found-back" aria-label="Back to homepage">
          <BackLabel />
        </Link>
      </section>
    </main>
  );
}
