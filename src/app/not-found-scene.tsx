"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BackLabel, SegmentDigits } from "./segment-labels";

const brokenTraces = [
  // Top edge broken traces
  { d: "M 120,-10 V 130 H 230 V 185", tip: [230, 185] as const, lit: false },
  { d: "M 320,-10 V 88 H 275 V 150", tip: [275, 150] as const, lit: true },
  { d: "M 690,-10 V 110 H 760 V 165", tip: [760, 165] as const, lit: false },
  { d: "M 860,-10 V 145 H 795", tip: [795, 145] as const, lit: false },
  // Left edge broken traces
  { d: "M -10,160 H 115 V 245 H 185", tip: [185, 245] as const, lit: false },
  { d: "M -10,335 H 145 V 295 H 215", tip: [215, 295] as const, lit: true },
  { d: "M -10,490 H 125 V 430 H 195", tip: [195, 430] as const, lit: false },
  // Right edge broken traces
  { d: "M 1010,180 H 875 V 250 H 810", tip: [810, 250] as const, lit: false },
  { d: "M 1010,340 H 860 V 300 H 785", tip: [785, 300] as const, lit: true },
  { d: "M 1010,485 H 890 V 425 H 815", tip: [815, 425] as const, lit: false },
  // Bottom edge broken traces
  { d: "M 185,610 V 490 H 265 V 455", tip: [265, 455] as const, lit: false },
  { d: "M 410,610 V 525 H 355 V 470", tip: [355, 470] as const, lit: true },
  { d: "M 650,610 V 515 H 715 V 460", tip: [715, 460] as const, lit: false },
  { d: "M 835,610 V 495 H 770", tip: [770, 495] as const, lit: false },
] as const;

export function NotFoundScene() {
  const cardRef = useRef<HTMLElement>(null);
  const [box, setBox] = useState({ w: 460, h: 300 });

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const update = () => {
      const w = Math.round(el.clientWidth);
      const h = Math.round(el.clientHeight);
      if (w > 0 && h > 0) setBox({ w, h });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pad = 16;
  const wire = 12;
  const right = box.w - pad;
  const bottom = box.h - pad;
  const outline = `M ${pad},${pad} H ${right} V ${bottom} H ${pad} Z`;

  return (
    <main className="not-found-page fixed inset-0 isolate grid place-items-center overflow-hidden bg-black">
      <svg
        aria-hidden="true"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 size-full"
        fill="none"
        strokeLinejoin="miter"
        strokeLinecap="butt"
      >
        {brokenTraces.map(({ d, tip, lit }, i) => (
          <g key={i}>
            <path d={d} stroke="#000000" strokeWidth={16} />
            <path d={d} stroke={lit ? "#5792af" : "#1d3044"} strokeWidth={11} />
            <circle
              cx={tip[0]}
              cy={tip[1]}
              r={10.5}
              fill={lit ? "#5792af" : "#1d3044"}
            />
            <circle cx={tip[0]} cy={tip[1]} r={6} fill="#000000" />
            <path d={d} stroke="#000000" strokeWidth={5.5} />
          </g>
        ))}
        {/* Severed gap ticks hinting at a broken trace on the left & right */}
        <g
          stroke="#ffbc42"
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity="0.7"
        >
          <path d="M 235,295 h 10 M 252,295 h 7" />
          <path d="M 745,300 h 10 M 762,300 h 7" />
        </g>
      </svg>

      <section
        ref={cardRef}
        className="not-found-card"
        aria-labelledby="not-found-heading"
      >
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${box.w} ${box.h}`}
          className="not-found-frame"
          fill="none"
          strokeLinejoin="round"
        >
          <path d={outline} stroke="#2bbc7d" strokeWidth={wire} />
          {[
            [pad, pad],
            [right, pad],
            [right, bottom],
            [pad, bottom],
          ].map(([cx, cy]) => (
            <circle
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r={wire * 0.67}
              fill="black"
              stroke="#2bbc7d"
              strokeWidth={wire * 0.25}
            />
          ))}
          <path d={outline} stroke="black" strokeWidth={wire / 2} />
        </svg>

        <div className="not-found-body">
          <h1 id="not-found-heading" className="sr-only">
            404 — Page not found
          </h1>
          <SegmentDigits value="404" height={88} flash />
          <p>Signal lost — this route doesn’t exist.</p>
          <Link
            href="/"
            className="not-found-back"
            aria-label="Back to homepage"
          >
            <BackLabel />
          </Link>
        </div>
      </section>
    </main>
  );
}
