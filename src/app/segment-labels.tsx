"use client";

import { useEffect, useState } from "react";

// The wide W and m have a center post. The k has two diagonal segments.
const glyphs = {
  W: { width: 21, lit: "bcdefi" },
  o: { width: 12, lit: "cdeg" },
  r: { width: 10, lit: "eg" },
  k: { width: 12, lit: "efjk" },
  A: { width: 12, lit: "abcefg" },
  b: { width: 12, lit: "cdefg" },
  u: { width: 12, lit: "cde" },
  t: { width: 9, lit: "efg" },
  G: { width: 12, lit: "acdefh" },
  a: { width: 12, lit: "abcefg" },
  m: { width: 21, lit: "cegi" },
  e: { width: 12, lit: "adefg" },
} as const;

type Letter = keyof typeof glyphs;

function bar(x1: number, y1: number, x2: number, y2: number) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  // Taper the ends and leave a black seam at each joint.
  return {
    d: `M1.25 0 2.7 -1.45 H${length - 2.7} L${length - 1.25} 0 ${length - 2.7} 1.45 H2.7 Z`,
    transform: `translate(${x1} ${y1}) rotate(${angle})`,
  };
}

function makeLetter(letter: Letter) {
  const { width, lit } = glyphs[letter];
  const half = width / 2;
  const segments = {
    a: bar(0, 0, width, 0),
    b: bar(width, 0, width, 12),
    c: bar(width, 12, width, 24),
    d: bar(0, 24, width, 24),
    e: bar(0, 12, 0, 24),
    f: bar(0, 0, 0, 12),
    ...(letter === "G"
      ? { h: bar(half - 1, 12, width, 12) }
      : { g: bar(0, 12, width, 12) }),
    ...(width === 21 && { i: bar(half, 12, half, 24) }),
    ...(letter === "k" && {
      j: bar(0, 12, width, 0),
      k: bar(0, 12, width, 24),
    }),
  };
  return Object.entries(segments).map(([id, path]) => ({
    ...path,
    lit: lit.includes(id),
  }));
}

const words = (["Work", "About", "Game"] as const).map((word) => {
  let x = 0;
  return Array.from(word, (char) => {
    const letter = char as Letter;
    const cell = { x, segments: makeLetter(letter) };
    x += glyphs[letter].width + 4;
    return cell;
  });
});

export function SegmentLabels({
  x,
  baselines,
  reduceMotion,
}: {
  x: number;
  baselines: readonly number[];
  reduceMotion: boolean;
}) {
  const [masks, setMasks] = useState<number[][] | null>([]);
  useEffect(() => {
    if (reduceMotion) return;
    const scramble = () =>
      setMasks(
        words.map((word) => word.map(() => Math.floor(Math.random() * 1024))),
      );
    scramble();
    const ticker = window.setInterval(scramble, 85);
    const finish = window.setTimeout(() => {
      window.clearInterval(ticker);
      setMasks(null);
    }, 500);
    return () => {
      window.clearInterval(ticker);
      window.clearTimeout(finish);
    };
  }, [reduceMotion]);

  return (
    <g aria-hidden="true">
      {words.map((word, row) => (
        <g
          key={row}
          transform={`translate(${x} ${baselines[row]}) scale(2) skewX(-5)`}
        >
          {word.map(({ x, segments }, col) => (
            <g key={col} transform={`translate(${x} -24)`}>
              {segments.map(({ lit, ...path }, i) => {
                const on =
                  reduceMotion || masks === null
                    ? lit
                    : Boolean((masks[row]?.[col] ?? 0) & (1 << i));
                return (
                  <path key={i} {...path} fill={on ? "#ffbc42" : "#201a11"} />
                );
              })}
            </g>
          ))}
        </g>
      ))}
    </g>
  );
}
