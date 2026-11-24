"use client";

import { StaticTrace } from "./static-trace";
import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { SceneGeometry } from "./portfolio-scene";
import { BackLabel, type Section } from "./segment-labels";
import { SnakeGame } from "./snake-game";

const BOOKMARKLET_HREF =
  "javascript:(()=>{const s=document.createElement('script');s.src='https://bitofbeans.github.io/js2048Game/new/script.js';document.body.appendChild(s);})();";
const ITCH_EMBED_URL =
  "https://itch.io/embed/4765787?bg_color=131a2b&fg_color=ffffff&link_color=995afa&border_color=3d4350";
const SOUNDCLOUD_EMBED_URL =
  "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2358514967&color=%232bbc7d&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true";

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

function DesignLightbox({
  index,
  onClose,
  onChange,
}: {
  index: number;
  onClose: () => void;
  onChange: (next: number) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipeStart = useRef<number | null>(null);
  const item = art[index]!;
  const [file, name, width, height] = item;
  const total = art.length;

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        onChange((index - 1 + total) % total);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        onChange((index + 1) % total);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, total, onClose, onChange]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="design-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={name}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="design-lightbox-frame">
        <div className="design-lightbox-bar">
          <span className="design-lightbox-counter">
            {index + 1} / {total}
          </span>
          <div className="design-lightbox-actions">
            <a
              href={"/images/" + file}
              target="_blank"
              rel="noreferrer"
              className="design-lightbox-link"
            >
              View original ↗
            </a>
            <button
              ref={closeRef}
              type="button"
              className="design-lightbox-btn"
              onClick={onClose}
              aria-label="Close viewer"
            >
              Close ×
            </button>
          </div>
        </div>
        <div
          className="design-lightbox-stage"
          onTouchStart={(event) => {
            const touch = event.touches[0];
            if (touch) swipeStart.current = touch.clientX;
          }}
          onTouchEnd={(event) => {
            const startX = swipeStart.current;
            const touch = event.changedTouches[0];
            swipeStart.current = null;
            if (startX === null || !touch) return;
            const dx = touch.clientX - startX;
            if (Math.abs(dx) < 36) return;
            onChange((index + (dx < 0 ? 1 : -1) + total) % total);
          }}
        >
          <button
            type="button"
            className="design-lightbox-nav design-lightbox-prev"
            aria-label="Previous design"
            onClick={() => onChange((index - 1 + total) % total)}
          >
            ←
          </button>
          <figure className="design-lightbox-figure">
            <Image
              key={file}
              src={"/images/" + file}
              width={width}
              height={height}
              sizes="90vw"
              alt={name}
              priority
            />
            <figcaption>{name}</figcaption>
          </figure>
          <button
            type="button"
            className="design-lightbox-nav design-lightbox-next"
            aria-label="Next design"
            onClick={() => onChange((index + 1) % total)}
          >
            →
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function BookmarkletLink() {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Attach the javascript: href on the DOM node so dragging to the bookmarks
    // bar works without triggering React's javascript: URL warning.
    linkRef.current?.setAttribute("href", BOOKMARKLET_HREF);
  }, []);

  async function copyBookmarklet() {
    try {
      await navigator.clipboard.writeText(BOOKMARKLET_HREF);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="older-actions">
      <a
        ref={linkRef}
        className="pixel-action"
        draggable
        onClick={(event) => {
          event.preventDefault();
          void copyBookmarklet();
        }}
        title="Drag to your bookmarks bar, or click to copy"
      >
        2048 Bookmarklet
      </a>
      <button
        type="button"
        className="subtle-action"
        onClick={() => void copyBookmarklet()}
      >
        {copied ? "Copied!" : "Copy script"}
      </button>
      <a
        href="https://github.com/bitofbeans/js2048Game"
        target="_blank"
        rel="noreferrer"
      >
        Source code ↗
      </a>
    </div>
  );
}

function Work() {
  const [gallery, setGallery] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showItchEmbed, setShowItchEmbed] = useState(false);
  const [showMixPlayer, setShowMixPlayer] = useState(false);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function closeLightbox() {
    const returnIndex = lightboxIndex;
    setLightboxIndex(null);
    if (returnIndex !== null) {
      requestAnimationFrame(() => {
        triggerRefs.current[returnIndex]?.focus({ preventScroll: true });
      });
    }
  }

  return (
    <>
      <div className="work-switch" role="group" aria-label="Work categories">
        <button
          type="button"
          aria-pressed={!gallery}
          onClick={() => {
            setGallery(false);
            setLightboxIndex(null);
          }}
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
        <>
          <div className="design-grid">
            {art.map(([file, name, width, height], index) => (
              <button
                key={file}
                ref={(el) => {
                  triggerRefs.current[index] = el;
                }}
                type="button"
                className="design-card"
                onClick={() => setLightboxIndex(index)}
                aria-label={`View ${name}`}
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
              </button>
            ))}
          </div>
          {lightboxIndex !== null && (
            <DesignLightbox
              index={lightboxIndex}
              onClose={closeLightbox}
              onChange={setLightboxIndex}
            />
          )}
        </>
      ) : (
        <>
          {projects.map((project) => (
            <div className="project-block" key={project.href}>
              <article className="project-feature">
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
                  <div className="project-actions">
                    <a
                      className="pixel-action"
                      href={project.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {project.action} ↗
                    </a>
                    {project.name === "Teleport" && (
                      <button
                        type="button"
                        className="subtle-action relative z-10"
                        aria-expanded={showItchEmbed}
                        onClick={() => setShowItchEmbed((open) => !open)}
                      >
                        {showItchEmbed ? "Hide itch.io" : "itch.io embed"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
              {project.name === "Teleport" && showItchEmbed && (
                <div className="inline-embed">
                  <iframe
                    title="TELEPORT by BitBeans on itch.io"
                    src={ITCH_EMBED_URL}
                    width="552"
                    height="167"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          ))}
          <article className="mix-row">
            <div className="mix-header">
              <h2>DJ Mix</h2>
              <div className="mix-links">
                <button
                  type="button"
                  className="subtle-action"
                  aria-expanded={showMixPlayer}
                  onClick={() => setShowMixPlayer((open) => !open)}
                >
                  {showMixPlayer ? "Hide player" : "Play inline"}
                </button>
                <a
                  href="https://soundcloud.com/user-95597774/primaconca"
                  target="_blank"
                  rel="noreferrer"
                >
                  Listen on SoundCloud ↗
                </a>
              </div>
            </div>
            {showMixPlayer && (
              <div className="inline-embed">
                <iframe
                  title="primaconca DJ Mix demo on SoundCloud"
                  src={SOUNDCLOUD_EMBED_URL}
                  width="100%"
                  height="166"
                  allow="autoplay"
                  loading="lazy"
                />
              </div>
            )}
          </article>
          <section className="older-work" aria-label="Older Work">
            <h2>Older Work</h2>
            <div className="older-grid">
              <article className="older-card">
                <h3>2048</h3>
                <p>
                  2048 clone that runs on any webpage. Drag the bookmarklet to
                  your bookmarks bar or copy the script.
                </p>
                <BookmarkletLink />
              </article>
              <article className="older-card">
                <h3>Wordle</h3>
                <p>Wordle clone built in Svelte.</p>
                <div className="older-actions">
                  <a
                    className="pixel-action"
                    href="https://bit-wordle.web.app"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Play Wordle ↗
                  </a>
                  <a
                    href="https://github.com/bitofbeans/jsWordleGame"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Source code ↗
                  </a>
                </div>
              </article>
            </div>
          </section>
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
    <SnakeGame />
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
