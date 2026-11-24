"use client";

import { StaticTrace } from "./static-trace";
import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { SceneGeometry } from "./portfolio-scene";
import { BackLabel, type Section } from "./segment-labels";

const art = [
  ["0Band25-6-Shirt.png", "Marching band shirt", 1226, 684],
  ["1HuckFinnFront.png", "Huckleberry Finn · front cover", 1391, 1800],
  ["2HuckFinnBack.png", "Huckleberry Finn · back cover", 1391, 1800],
  ["3TPAlbum1.png", "Teleport · light cover", 1800, 1800],
  ["4TPAlbum2.png", "Teleport · dark cover", 1800, 1800],
  ["5TPThumb.png", "Teleport · game artwork", 2001, 1501],
  ["Altlogooption.png", "Logo study", 1000, 1000],
  ["BenetDrumBack.png", "Drumline shirt", 1524, 1800],
  ["SLBank.png", "Bank icon", 1502, 1502],
  ["SLGiveaway.png", "Giveaway icon", 1502, 1502],
] as const;

const projects = [
  {
    name: "MarMap",
    description:
      "Explore the terrain of Mars and find the best route for a rover.",
    href: "https://marmap.quobits.workers.dev/",
    action: "Explore MarMap",
    image: "/images/marmap.png",
    alt: "Team Elders’ MarMap logo above the surface of Mars",
    width: 1724,
    height: 1138,
  },
  {
    name: "vlonely&friends",
    description: "A portfolio I built for an artist promoter.",
    href: "https://vlfriends.com/",
    action: "Visit vlonely&friends",
    image: "/images/vlonely-and-friends.png",
    alt: "vlonely and friends logo with smiling hearts and stars",
    width: 2000,
    height: 1336,
  },
  {
    name: "Teleport",
    description: "Play the finished game on Scratch.",
    href: "https://scratch.mit.edu/projects/1299864236/",
    action: "Play Teleport",
    image: "/images/5TPThumb.png",
    alt: "Teleport artwork with two green characters bursting through the screen",
    width: 2001,
    height: 1501,
  },
];

function Work() {
  const [gallery, setGallery] = useState(false);
  return (
    <>
      <div className="work-switch" role="group" aria-label="Work categories">
        <button
          type="button"
          aria-pressed={!gallery}
          onClick={() => setGallery(false)}
        >
          Projects
        </button>
        <button
          type="button"
          aria-pressed={gallery}
          onClick={() => setGallery(true)}
        >
          Designs
        </button>
      </div>
      {gallery ? (
        <div className="design-grid">
          {art.map(([file, name, width, height]) => (
            <a
              key={file}
              href={"/images/" + file}
              target="_blank"
              rel="noreferrer"
            >
              <figure>
                <Image
                  src={"/images/" + file}
                  width={width}
                  height={height}
                  sizes="(max-width: 650px) 85vw, 32vw"
                  alt={name}
                />
                <figcaption>{name}</figcaption>
              </figure>
            </a>
          ))}
        </div>
      ) : (
        <>
          {projects.map((project) => (
            <article className="project-feature" key={project.href}>
              <Image
                src={project.image}
                width={project.width}
                height={project.height}
                sizes="(max-width: 650px) 80vw, 45vw"
                alt={project.alt}
              />
              <div>
                <h2>{project.name}</h2>
                <p>{project.description}</p>
                <a
                  className="pixel-action"
                  href={project.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {project.action} ↗
                </a>
              </div>
            </article>
          ))}
          <article className="mix-row">
            <h2>DJ Mix</h2>
            <a
              href="https://soundcloud.com/user-95597774/primaconca"
              target="_blank"
              rel="noreferrer"
            >
              Listen to the demo ↗
            </a>
          </article>
        </>
      )}
    </>
  );
}

function About() {
  return (
    <div className="about-copy">
      <p>
        Hey! I’m Benas. I made this website. I like making games, designs, and
        music.
      </p>
      <h2>Contact</h2>
      <p>
        <a href="mailto:bitofbeans@gmail.com">bitofbeans@gmail.com</a>
      </p>
      <p>
        <a
          href="https://github.com/bitofbeans"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
      </p>
      <p>
        <a
          href="https://www.linkedin.com/in/benas-unguraitis/"
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn ↗
        </a>
      </p>
    </div>
  );
}

function SignalGame() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [turn, setTurn] = useState<"ready" | "watch" | "play" | "miss">(
    "ready",
  );
  const [active, setActive] = useState(-1);
  const [index, setIndex] = useState(0);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const firstPadRef = useRef<HTMLButtonElement>(null);
  const flashTimer = useRef<number | null>(null);
  const nextSignal = () => Math.floor(Math.random() * 3);

  useEffect(() => {
    return () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    };
  }, []);

  useEffect(() => {
    if (turn === "play") {
      firstPadRef.current?.focus({ preventScroll: true });
      return;
    }
    if (turn !== "watch") return;
    const timers: number[] = [];
    sequence.forEach((node, i) => {
      timers.push(window.setTimeout(() => setActive(node), 450 + i * 720));
      timers.push(window.setTimeout(() => setActive(-1), 900 + i * 720));
    });
    timers.push(
      window.setTimeout(() => setTurn("play"), 450 + sequence.length * 720),
    );
    return () => timers.forEach(clearTimeout);
  }, [sequence, turn]);

  function press(node: number) {
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    setActive(node);
    flashTimer.current = window.setTimeout(() => setActive(-1), 160);
    if (node !== sequence[index]) {
      setTurn("miss");
      return;
    }
    if (index + 1 === sequence.length) {
      setIndex(0);
      setSequence([...sequence, nextSignal()]);
      setTurn("watch");
    } else setIndex(index + 1);
  }
  const names = ["One", "Two", "Three"];
  return (
    <div className="signal-game">
      <h2>Signal memory</h2>
      <p>Watch the three nodes. Repeat their sequence.</p>
      <p>(There are plans for a better game here, this is temporary.)</p>
      <div className="signal-pads">
        {names.map((name, i) => (
          <button
            key={name}
            ref={i === 0 ? firstPadRef : undefined}
            type="button"
            className={active === i ? "lit" : ""}
            disabled={turn !== "play"}
            onClick={() => press(i)}
            aria-label={name}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <p ref={statusRef} role="status" tabIndex={-1}>
        {turn === "watch"
          ? `Round ${sequence.length} · Watch ${active >= 0 ? names[active] : ""}`
          : turn === "play"
            ? `Your turn · ${index + 1} of ${sequence.length}`
            : turn === "miss"
              ? `Sequence broken · ${sequence.length - 1} completed`
              : ""}
      </p>
      {(turn === "ready" || turn === "miss") && (
        <button
          type="button"
          className="pixel-action"
          onClick={() => {
            if (flashTimer.current !== null)
              window.clearTimeout(flashTimer.current);
            setActive(-1);
            setIndex(0);
            setSequence([nextSignal()]);
            setTurn("watch");
            statusRef.current?.focus({ preventScroll: true });
          }}
        >
          {turn === "ready" ? "Start game" : "Try again"}
        </button>
      )}
    </div>
  );
}

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

function Frame({ g }: { g: SceneGeometry }) {
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

export function SectionContent({ section }: { section: Section }) {
  return section === "Work" ? (
    <Work />
  ) : section === "About" ? (
    <About />
  ) : (
    <SignalGame />
  );
}

export function PortfolioPanel({
  section,
  geometry: g,
  docked,
  heading,
  goBack,
}: {
  section: Section;
  geometry: SceneGeometry;
  docked: boolean;
  heading: RefObject<HTMLHeadingElement | null>;
  goBack: () => void;
}) {
  return (
    <section
      aria-label={section}
      inert={!docked}
      className={"destination" + (docked ? " powered" : "")}
      style={{ left: g.distance, top: g.cameraY, width: g.w, height: g.h }}
    >
      <Frame g={g} />
      <button
        type="button"
        className="return-switch"
        onClick={goBack}
        aria-label="Back to homepage"
        style={{
          left: g.left,
          top: g.railY - g.wire / 2,
          paddingLeft: g.loopWidth + g.wire / 2 + 10,
          height: g.loopHeight + g.wire,
        }}
      >
        {docked && <BackLabel />}
      </button>
      <div
        className="panel-scroll"
        style={{
          left: g.left + g.wire / 2 + 4,
          right: g.left + g.wire / 2 + 4,
          top: g.railY + g.loopHeight + g.wire / 2 + 8,
          bottom: g.top + g.wire / 2 + 4,
        }}
      >
        <div className="panel-content">
          <h1 ref={heading} tabIndex={-1}>
            {section}
          </h1>
          <SectionContent section={section} />
        </div>
      </div>
    </section>
  );
}
