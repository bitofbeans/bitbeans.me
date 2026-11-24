"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { sectionPath, sections, type Section } from "./sections";
export type { Section } from "./sections";

// The wide W and m have a center post. The k has two diagonal segments.
const glyphs = {
  W: { width: 21, lit: "bcdefi" },
  o: { width: 12, lit: "cdeg" },
  r: { width: 10, lit: "eg" },
  c: { width: 12, lit: "deg" },
  k: { width: 12, lit: "efjk" },
  A: { width: 12, lit: "abcefg" },
  b: { width: 12, lit: "cdefg" },
  u: { width: 12, lit: "cde" },
  t: { width: 9, lit: "efg" },
  G: { width: 12, lit: "acdefh" },
  a: { width: 12, lit: "abcefg" },
  m: { width: 21, lit: "cegi" },
  e: { width: 12, lit: "adefg" },
  "0": { width: 12, lit: "abcdef" },
  "1": { width: 12, lit: "bc" },
  "2": { width: 12, lit: "abdeg" },
  "3": { width: 12, lit: "abcdg" },
  "4": { width: 12, lit: "bcfg" },
  "5": { width: 12, lit: "acdfg" },
  "6": { width: 12, lit: "acdefg" },
  "7": { width: 12, lit: "abc" },
  "8": { width: 12, lit: "abcdefg" },
  "9": { width: 12, lit: "abcdfg" },
  "-": { width: 12, lit: "g" },
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

function makeWord(word: string) {
  let x = 0;
  return Array.from(word, (char) => {
    const letter = char as Letter;
    const cell = { x, segments: makeLetter(letter) };
    x += glyphs[letter].width + 4;
    return cell;
  });
}
const words = sections.map(makeWord);
const back = makeWord("back");
const backWords = [back];

function useSegmentMasks(labelWords: typeof words, reduceMotion: boolean) {
  const [masks, setMasks] = useState<number[][] | null>([]);
  useEffect(() => {
    if (reduceMotion) return;
    const scramble = () =>
      setMasks(
        labelWords.map((word) =>
          word.map(() => Math.floor(Math.random() * 1024)),
        ),
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
  }, [labelWords, reduceMotion]);

  return reduceMotion ? null : masks;
}

function WordSegments({
  word,
  masks,
  y = 0,
}: {
  word: ReturnType<typeof makeWord>;
  masks: number[] | null;
  y?: number;
}) {
  return word.map(({ x, segments }, col) => (
    <g key={col} transform={`translate(${x} ${y})`}>
      {segments.map(({ lit, ...path }, i) => {
        const on = masks === null ? lit : Boolean((masks[col] ?? 0) & (1 << i));
        return <path key={i} {...path} fill={on ? "#ffbc42" : "#201a11"} />;
      })}
    </g>
  ));
}

export function SegmentDigits({
  value,
  height = 24,
  flash = false,
  className,
}: {
  value: string;
  height?: number;
  flash?: boolean;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [flashWord] = useState(() => [makeWord(value)]);
  const word = flash ? flashWord[0]! : makeWord(value);
  const masks = useSegmentMasks(flashWord, !flash || Boolean(reduceMotion));
  const totalWidth =
    word.reduce((acc, cell, i) => {
      const char = value[i] as Letter | undefined;
      const w = char && char in glyphs ? glyphs[char].width : 12;
      return Math.max(acc, cell.x + w);
    }, 0) + 6;
  const viewWidth = totalWidth + 4;
  const viewHeight = 29;
  const scaledWidth = (viewWidth / viewHeight) * height;

  return (
    <svg
      aria-hidden="true"
      viewBox={`-2 -2 ${viewWidth} ${viewHeight}`}
      width={scaledWidth}
      height={height}
      className={className}
    >
      <g transform="translate(2 0) skewX(-5)">
        <WordSegments
          word={word}
          masks={flash && masks !== null ? (masks[0] ?? []) : null}
        />
      </g>
    </svg>
  );
}

export function BackLabel() {
  const reduceMotion = useReducedMotion();
  const masks = useSegmentMasks(backWords, Boolean(reduceMotion));
  return (
    <svg aria-hidden="true" viewBox="-2 -2 66 29" width="58" height="25">
      <g transform="translate(2 0) skewX(-5)">
        <WordSegments
          word={back}
          masks={masks === null ? null : (masks[0] ?? [])}
        />
      </g>
    </svg>
  );
}

export function SegmentLabels({
  x,
  baselines,
  onNavigate,
  onHoverSection,
  reduceMotion,
}: {
  onNavigate: (section: Section, link: HTMLOrSVGElement) => void;
  onHoverSection?: (section: Section | null) => void;
  x: number;
  baselines: readonly number[];
  reduceMotion: boolean;
}) {
  const masks = useSegmentMasks(words, reduceMotion);

  return (
    <g>
      {words.map((word, row) => {
        const entry = sections[row]!;
        return (
          <a
            key={row}
            className="section-link"
            aria-label={entry}
            href={sectionPath(entry)}
            onMouseEnter={() => onHoverSection?.(entry)}
            onMouseLeave={() => onHoverSection?.(null)}
            onFocus={() => onHoverSection?.(entry)}
            onBlur={() => onHoverSection?.(null)}
            onClick={(event) => {
              if (
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              event.preventDefault();
              onHoverSection?.(null);
              onNavigate(entry, event.currentTarget);
            }}
          >
            <g
              transform={`translate(${x} ${baselines[row]}) scale(2) skewX(-5)`}
            >
              <rect
                x="-29"
                y="-29"
                width="120"
                height="85"
                fill="transparent"
              />
              <WordSegments
                word={word}
                masks={masks === null ? null : (masks[row] ?? [])}
                y={-24}
              />
            </g>
          </a>
        );
      })}
    </g>
  );
}
