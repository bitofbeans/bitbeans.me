"use client";

import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotionConfig,
  useTransform,
  type MotionValue,
} from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  BackLabel,
  SegmentDigits,
  TopLabel,
} from "~/components/segment-labels";
import { StaticTrace } from "~/components/static-trace";
import type { BlogPost } from "~/lib/blog-types";
import type { BlogBranchGeometry, SceneGeometry } from "~/lib/scene-geometry";
import { blogPostPath, type Section } from "~/lib/sections";
import { BlogPostModal } from "./blog-post-modal";

const spewSpring = {
  type: "spring",
  stiffness: 250,
  damping: 17,
  mass: 0.8,
} as const;

function useBranchSpew({
  junctionY,
  branchRun,
  geometry: g,
  progress,
  target,
  docked,
  reduceMotion,
}: {
  junctionY: number;
  branchRun: number;
  geometry: SceneGeometry;
  progress: MotionValue<number>;
  target: Section | null;
  docked: boolean;
  reduceMotion: boolean;
}) {
  const rawExtend = useMotionValue(docked || reduceMotion ? 1 : 0);
  const stateRef = useRef<"in" | "out">(docked || reduceMotion ? "out" : "in");

  useEffect(() => {
    if (reduceMotion) {
      stateRef.current = target === "Blog" || docked ? "out" : "in";
      rawExtend.jump(stateRef.current === "out" ? 1 : 0);
      return;
    }

    const sync = (p: number) => {
      const tipLocalY = g.bottomTipY + p * g.blogDrop - g.blogDistance;
      if (target === "Blog") {
        // Spew out the instant the descending white node passes this junction,
        // or once docked for posts further down the scroll canvas.
        if (stateRef.current !== "out" && (docked || tipLocalY >= junctionY)) {
          stateRef.current = "out";
          void animate(rawExtend, 1, spewSpring);
        }
      } else if (stateRef.current !== "in" && tipLocalY <= junctionY) {
        stateRef.current = "in";
        rawExtend.jump(0);
      }
    };

    sync(progress.get());
    const unsub = progress.on("change", sync);
    return () => {
      unsub();
    };
  }, [
    rawExtend,
    junctionY,
    g.bottomTipY,
    g.blogDrop,
    g.blogDistance,
    progress,
    target,
    docked,
    reduceMotion,
  ]);

  useEffect(() => () => rawExtend.stop(), [rawExtend]);

  // During upward return flight, cap extension directly against the rising spine tip
  // so every branch pulls cleanly back into the spine and can never float detached.
  const extend = useTransform(() => {
    const raw = rawExtend.get();
    const p = progress.get();
    if (docked || target === "Blog") return raw;
    const tipLocalY = g.bottomTipY + p * g.blogDrop - g.blogDistance;
    const ceiling = Math.max(
      0,
      Math.min(1, (tipLocalY - junctionY) / (branchRun * 1.15)),
    );
    return Math.min(raw, ceiling);
  });

  return extend;
}

function BlogBranchPass({
  branch,
  geometry: g,
  progress,
  target,
  docked,
  hot,
  inner = false,
  reduceMotion,
}: {
  branch: BlogBranchGeometry;
  geometry: SceneGeometry;
  progress: MotionValue<number>;
  target: Section | null;
  docked: boolean;
  hot: boolean;
  inner?: boolean;
  reduceMotion: boolean;
}) {
  const { wire, innerWire, nodeR, centerX, branchRun } = g.blogTree;
  const { side, junctionY } = branch;
  const extend = useBranchSpew({
    junctionY,
    branchRun,
    geometry: g,
    progress,
    target,
    docked,
    reduceMotion,
  });

  const curX = useTransform(extend, (v) => centerX + side * branchRun * v);
  const curY = useTransform(extend, (v) => junctionY + branchRun * v);
  const curR = useTransform(extend, [0, 0.3], [0, nodeR]);
  const branchPath = useMotionTemplate`M${centerX},${junctionY} L${curX},${curY}`;
  const visibility = useTransform(extend, (v) => (v > 0.01 ? 1 : 0));
  const stroke = inner ? "black" : hot ? "#ffbc42" : "white";
  const strokeWidth = inner ? innerWire : wire;

  return (
    <motion.g style={{ opacity: visibility }}>
      <motion.path
        d={branchPath}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <motion.circle
        cx={curX}
        cy={curY}
        r={curR}
        fill="black"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </motion.g>
  );
}

function BlogBranchButton({
  post,
  branch,
  geometry: g,
  progress,
  target,
  docked,
  reduceMotion,
  buttonRef,
  onHover,
  onSelect,
}: {
  post: BlogPost;
  branch: BlogBranchGeometry;
  geometry: SceneGeometry;
  progress: MotionValue<number>;
  target: Section | null;
  docked: boolean;
  reduceMotion: boolean;
  buttonRef: (el: HTMLButtonElement | null) => void;
  onHover: (active: boolean) => void;
  onSelect: () => void;
}) {
  const { nodeOuterR, branchRun, labelGap, maxLabelWidth } = g.blogTree;
  const { side, junctionY, nodeY } = branch;
  const isRight = side === 1;
  const hitSize = Math.max(44, nodeOuterR * 2.2);
  const anchorOffset = branchRun - hitSize / 2;

  const extend = useBranchSpew({
    junctionY,
    branchRun,
    geometry: g,
    progress,
    target,
    docked,
    reduceMotion,
  });
  const labelOpacity = useTransform(extend, [0.45, 0.96], [0, 1]);
  const labelShift = useTransform(extend, [0.45, 1], [isRight ? -10 : 10, 0]);
  const [dateRevealed, setDateRevealed] = useState(
    () => docked || reduceMotion || extend.get() >= 0.45,
  );

  useEffect(() => {
    if (reduceMotion) {
      setDateRevealed(true);
      return;
    }
    const sync = (v: number) => {
      if (v >= 0.45) {
        setDateRevealed(true);
      } else if (v <= 0.01 && target !== "Blog") {
        setDateRevealed(false);
      }
    };
    sync(extend.get());
    return extend.on("change", sync);
  }, [extend, target, reduceMotion]);

  return (
    <button
      ref={buttonRef}
      type="button"
      className={
        "blog-node-btn " + (isRight ? "blog-node-right" : "blog-node-left")
      }
      style={{
        ...(isRight
          ? { left: `calc(50% + ${anchorOffset}px)` }
          : { right: `calc(50% + ${anchorOffset}px)` }),
        top: nodeY,
        minHeight: hitSize,
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      onClick={onSelect}
      aria-label={
        post.displayDate ? `${post.title} (${post.displayDate})` : post.title
      }
    >
      <motion.span
        className="blog-node-text"
        style={{
          opacity: labelOpacity,
          x: labelShift,
          maxWidth: maxLabelWidth,
          marginLeft: isRight ? hitSize / 2 + labelGap : 0,
          marginRight: isRight ? 0 : hitSize / 2 + labelGap,
        }}
      >
        {post.date && (
          <span className="blog-node-date">
            <SegmentDigits
              value={post.date.replace(/[./\s]+/g, "-")}
              height={15}
              flash={dateRevealed}
            />
          </span>
        )}
        <span className="blog-node-title">{post.title}</span>
      </motion.span>
    </button>
  );
}

type BlogBgTrace = {
  key: string;
  d: string;
  tip: readonly [number, number];
};

type Seg = { x1: number; y1: number; x2: number; y2: number };

function segDistToPoint(s: Seg, px: number, py: number) {
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - s.x1, py - s.y1);
  const t = Math.max(0, Math.min(1, ((px - s.x1) * dx + (py - s.y1) * dy) / lenSq));
  return Math.hypot(px - (s.x1 + t * dx), py - (s.y1 + t * dy));
}

function collinearOverlap(a: Seg, b: Seg, tol: number) {
  const aVert = Math.abs(a.x1 - a.x2) < 0.5;
  const bVert = Math.abs(b.x1 - b.x2) < 0.5;
  if (aVert && bVert) {
    if (Math.abs(a.x1 - b.x1) >= tol) return false;
    const aMin = Math.min(a.y1, a.y2) - tol;
    const aMax = Math.max(a.y1, a.y2) + tol;
    const bMin = Math.min(b.y1, b.y2);
    const bMax = Math.max(b.y1, b.y2);
    return aMin <= bMax && bMin <= aMax;
  }
  const aHoriz = Math.abs(a.y1 - a.y2) < 0.5;
  const bHoriz = Math.abs(b.y1 - b.y2) < 0.5;
  if (aHoriz && bHoriz) {
    if (Math.abs(a.y1 - b.y1) >= tol) return false;
    const aMin = Math.min(a.x1, a.x2) - tol;
    const aMax = Math.max(a.x1, a.x2) + tol;
    const bMin = Math.min(b.x1, b.x2);
    const bMax = Math.max(b.x1, b.x2);
    return aMin <= bMax && bMin <= aMax;
  }
  return false;
}

function buildBlogBackgroundTraces(g: SceneGeometry): BlogBgTrace[] {
  const { w, traces: m, blogTree } = g;
  const { canvasHeight, centerX, branchRun, labelGap, maxLabelWidth } =
    blogTree;
  const overscan = Math.abs(g.blogCameraX) + m.strokeWidth * 4;
  const laneStep = Math.max(m.nodeOuterRadius * 3.1, m.strokeWidth * 3.6, 36);
  const segTol = Math.max(m.strokeWidth * 2.1, 18);
  const nodeClear = m.nodeOuterRadius * 2.5 + m.strokeWidth;

  // Keep background traces cleanly in the outer left/right flanks clear of the blog tree & titles.
  const titleReserve = branchRun + labelGap + maxLabelWidth * 0.82;
  const maxFlank = Math.max(laneStep * 1.4, centerX - titleReserve);
  const laneCount = Math.max(2, Math.min(7, Math.floor(maxFlank / laneStep)));
  const edgeInset = Math.max(laneStep * 0.65, m.nodeOuterRadius * 1.8);
  const laneX = (side: -1 | 1, lane: number) => {
    const idx = Math.min(lane, laneCount - 1);
    const offset = edgeInset + idx * laneStep;
    return side === -1 ? offset : w - offset;
  };

  const out: BlogBgTrace[] = [];
  const placedSegs: Seg[] = [];
  const placedTips: (readonly [number, number])[] = [];

  const tryAdd = (
    key: string,
    pts: readonly (readonly [number, number])[],
  ) => {
    if (pts.length < 2) return;
    const tip = pts[pts.length - 1]!;
    const segs: Seg[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i]!;
      const p2 = pts[i + 1]!;
      if (Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) < 1) continue;
      segs.push({ x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1] });
    }
    if (segs.length === 0) return;

    // Keep tip away from existing tips and segments.
    for (const prevTip of placedTips) {
      if (Math.hypot(tip[0] - prevTip[0], tip[1] - prevTip[1]) < nodeClear * 1.35) {
        return;
      }
    }
    for (const prevSeg of placedSegs) {
      if (segDistToPoint(prevSeg, tip[0], tip[1]) < nodeClear) return;
    }

    // Keep new segments clear of existing tips and never collinearly overlapping existing segments.
    for (const seg of segs) {
      for (const prevTip of placedTips) {
        if (segDistToPoint(seg, prevTip[0], prevTip[1]) < nodeClear) return;
      }
      for (const prevSeg of placedSegs) {
        if (collinearOverlap(seg, prevSeg, segTol)) return;
      }
    }

    const d = pts
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${Math.round(x)} ${Math.round(y)}`)
      .join(" ");
    out.push({ key, d, tip });
    placedSegs.push(...segs);
    placedTips.push(tip);
  };

  // 1. Upper side-entering traces spanning across y = 0 so there is no horizontal seam during flight
  //    and the top-most ones enter cleanly off the top edge once docked.
  const upperSideSpecs: readonly (readonly [
    -1 | 1,
    number,
    number,
    number,
    number,
  ])[] = [
    [-1, -110, 0, 0.34, 0],
    [-1, -46, 2, 0.44, 1],
    [-1, 34, 4, 0.3, 3],
    [1, -96, 0, 0.38, 0],
    [1, -28, 2, 0.48, 1],
    [1, 52, 4, 0.34, 3],
  ];
  upperSideSpecs.forEach(([side, startY, l1, endF, l2], i) => {
    if (l1 >= laneCount && l2 >= laneCount) return;
    const edgeX = side === -1 ? -overscan : w + overscan;
    const x1 = laneX(side, l1);
    const x2 = laneX(side, l2);
    const endY = Math.max(startY + 180, canvasHeight * endF);
    const jogY = startY + (endY - startY) * 0.42;
    const pts: (readonly [number, number])[] =
      x1 === x2
        ? [
            [edgeX, startY],
            [x1, startY],
            [x1, endY],
          ]
        : [
            [edgeX, startY],
            [x1, startY],
            [x1, jogY],
            [x2, jogY],
            [x2, endY],
          ];
    tryAdd(`upper-${i}`, pts);
  });

  // 2. Bottom-entering long vertical trunks rising cleanly up the lower half (below the fold during flight).
  const bottomCandidates: readonly (readonly [-1 | 1, number, number, number, number])[] =
    [
      [-1, 0, 0.84, 0, 0.68],
      [-1, 2, 0.88, 1, 0.72],
      [-1, 4, 0.86, 3, 0.7],
      [1, 0, 0.82, 0, 0.64],
      [1, 2, 0.9, 1, 0.74],
      [1, 4, 0.84, 3, 0.66],
    ];
  bottomCandidates.forEach(([side, l1, jogF, l2, endF], i) => {
    if (l1 >= laneCount || l2 >= laneCount) return;
    const x1 = laneX(side, l1);
    const x2 = laneX(side, l2);
    const jogY = canvasHeight * jogF;
    const endY = canvasHeight * endF;
    const pts: (readonly [number, number])[] =
      x1 === x2
        ? [
            [x1, canvasHeight + overscan],
            [x1, endY],
          ]
        : [
            [x1, canvasHeight + overscan],
            [x1, jogY],
            [x2, jogY],
            [x2, endY],
          ];
    tryAdd(`bot-${i}`, pts);
  });

  // 3. Side-entering traces that turn into long vertical legs down or up the scroll canvas.
  const bands = Math.max(2, Math.round(canvasHeight / 540));
  const bandH = canvasHeight / bands;
  const sideSpecs: readonly (readonly [-1 | 1, number, number, number, number])[] =
    [
      [-1, 0.14, 3, 0.76, 3],
      [-1, 0.42, 1, 0.92, 1],
      [-1, 0.66, 5, 0.22, 4],
      [-1, 0.86, 2, 0.48, 2],
      [1, 0.18, 3, 0.78, 3],
      [1, 0.46, 1, 0.94, 1],
      [1, 0.7, 5, 0.26, 4],
      [1, 0.88, 2, 0.5, 2],
    ];

  for (let b = 0; b < bands; b++) {
    const baseY = b * bandH;
    sideSpecs.forEach(([side, startF, lA, endF, lB], i) => {
      const laneA = lA % laneCount;
      const laneB = lB % laneCount;
      const edgeX = side === -1 ? -overscan : w + overscan;
      const startY = baseY + bandH * startF;
      const endY = Math.max(
        nodeClear,
        Math.min(canvasHeight - nodeClear, baseY + bandH * endF),
      );
      const xA = laneX(side, laneA);
      const xB = laneX(side, laneB);
      const midY = startY + (endY - startY) * 0.55;
      const pts: (readonly [number, number])[] =
        xA === xB
          ? [
              [edgeX, startY],
              [xA, startY],
              [xA, endY],
            ]
          : [
              [edgeX, startY],
              [xA, startY],
              [xA, midY],
              [xB, midY],
              [xB, endY],
            ];
      tryAdd(`side-${b}-${i}`, pts);
    });
  }

  return out;
}

export function BlogFallback({ posts }: { posts: readonly BlogPost[] }) {
  return (
    <div className="about-copy">
      {posts.map((post) => (
        <article key={post.slug} className="project-block">
          <h2>
            <Link href={blogPostPath(post.slug)}>{post.title}</Link>
          </h2>
          {post.displayDate && <p>{post.displayDate}</p>}
          {post.summary && <p>{post.summary}</p>}
        </article>
      ))}
    </div>
  );
}

export function BlogPanel({
  posts,
  activePostSlug,
  onOpenPost,
  onClosePost,
  geometry: g,
  progress,
  target,
  docked,
  heading,
  goBack,
}: {
  posts: readonly BlogPost[];
  activePostSlug: string | null;
  onOpenPost: (slug: string) => void;
  onClosePost: () => void;
  geometry: SceneGeometry;
  progress: MotionValue<number>;
  target: Section | null;
  docked: boolean;
  heading: RefObject<HTMLHeadingElement | null>;
  goBack: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const reduceMotion = Boolean(useReducedMotionConfig());

  const activeIndex = useMemo(() => {
    if (!activePostSlug) return null;
    const idx = posts.findIndex((post) => post.slug === activePostSlug);
    return idx >= 0 ? idx : null;
  }, [activePostSlug, posts]);

  useEffect(() => {
    if (!docked) {
      setHoveredIndex(null);
      if (scrollRef.current && scrollRef.current.scrollTop !== 0) {
        scrollRef.current.scrollTop = 0;
      }
    }
  }, [docked]);

  function closeModal() {
    const returnIndex = activeIndex;
    onClosePost();
    if (returnIndex !== null) {
      requestAnimationFrame(() => {
        triggerRefs.current[returnIndex]?.focus({ preventScroll: true });
      });
    }
  }

  function scrollToTop() {
    scrollRef.current?.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
    heading.current?.focus({ preventScroll: true });
  }

  const {
    wire,
    innerWire,
    nodeR,
    centerX,
    backTop,
    branches,
    spineEndY,
    topBtnY,
    canvasHeight,
  } = g.blogTree;
  const bgTraces = useMemo(() => buildBlogBackgroundTraces(g), [g]);

  // Keep the inner black channel of the central spine synced to the live descending
  // white node during flight so every branch junction stays seamlessly hollow.
  const liveBlackSpineY = useTransform(progress, (p) => {
    if (docked) return spineEndY;
    const tipLocalY = g.bottomTipY + p * g.blogDrop - g.blogDistance;
    return Math.max(-wire, Math.min(spineEndY, tipLocalY));
  });

  return (
    <section
      aria-label="Blog"
      inert={!docked}
      className={"blog-destination" + (docked ? " powered" : "")}
      style={{
        left: g.blogCameraX,
        top: g.blogDistance,
        width: g.w,
        height: g.h,
      }}
    >
      <div ref={scrollRef} className="blog-scroll">
        <div className="blog-canvas" style={{ height: canvasHeight }}>
          {/* Solid black backdrop swaps in on dock so scrolling cleanly covers the logo stem behind it */}
          <div className="blog-dock-bg" aria-hidden="true" />

          <h1 ref={heading} tabIndex={-1} className="sr-only">
            Blog
          </h1>

          {/* Two-pass SVG: all white outer strokes & nodes first, then all black inner channels on top */}
          <svg
            aria-hidden="true"
            className="blog-tree-svg"
            width={g.w}
            height={canvasHeight}
            viewBox={`0 0 ${g.w} ${canvasHeight}`}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Pass 0: Long vertical blue background traces & nodes (visible throughout flight & dock) */}
            <g>
              {bgTraces.map((trace) => (
                <StaticTrace
                  key={trace.key}
                  d={trace.d}
                  metrics={g.traces}
                  tip={trace.tip}
                />
              ))}
            </g>

            {/* Pass 1: Outer spewing branches underneath the white outer spine & terminal circle node */}
            {branches.map((branch) => (
              <BlogBranchPass
                key={`outer-${posts[branch.index]?.slug ?? branch.index}`}
                branch={branch}
                geometry={g}
                progress={progress}
                target={target}
                docked={docked}
                hot={hoveredIndex === branch.index}
                reduceMotion={reduceMotion}
              />
            ))}

            <g className="blog-dock-spine">
              <line
                x1={centerX}
                y1={-wire}
                x2={centerX}
                y2={spineEndY}
                stroke="white"
                strokeWidth={wire}
                strokeLinecap="round"
              />
              <circle
                cx={centerX}
                cy={spineEndY}
                r={nodeR}
                fill="black"
                stroke="white"
                strokeWidth={wire}
              />
            </g>

            {/* Pass 2: Black inner spine, terminal hollow node, and branch channels */}
            <motion.line
              x1={centerX}
              y1={-wire}
              x2={centerX}
              y2={liveBlackSpineY}
              stroke="black"
              strokeWidth={innerWire}
              strokeLinecap="round"
            />
            <g className="blog-dock-spine">
              <line
                x1={centerX}
                y1={-wire}
                x2={centerX}
                y2={spineEndY}
                stroke="black"
                strokeWidth={innerWire}
                strokeLinecap="round"
              />
              <circle
                cx={centerX}
                cy={spineEndY}
                r={nodeR}
                fill="black"
                stroke="black"
                strokeWidth={innerWire}
              />
            </g>

            {branches.map((branch) => (
              <BlogBranchPass
                key={`inner-${posts[branch.index]?.slug ?? branch.index}`}
                branch={branch}
                geometry={g}
                progress={progress}
                target={target}
                docked={docked}
                hot={hoveredIndex === branch.index}
                inner
                reduceMotion={reduceMotion}
              />
            ))}
          </svg>

          {/* Back button beside the top of the incoming vertical spine */}
          <button
            type="button"
            className="return-switch blog-back"
            onClick={goBack}
            aria-label="Back to homepage"
            style={{
              left: `calc(50% + ${wire / 2 + Math.max(14, wire * 0.5)}px)`,
              top: backTop,
            }}
          >
            {docked && <BackLabel />}
          </button>

          {/* Interactive node hit targets + post titles beside each alternating node */}
          {branches.map((branch) => {
            const post = posts[branch.index];
            if (!post) return null;
            return (
              <BlogBranchButton
                key={post.slug}
                post={post}
                branch={branch}
                geometry={g}
                progress={progress}
                target={target}
                docked={docked}
                reduceMotion={reduceMotion}
                buttonRef={(el) => {
                  triggerRefs.current[branch.index] = el;
                }}
                onHover={(active) =>
                  setHoveredIndex((curr) =>
                    active ? branch.index : curr === branch.index ? null : curr,
                  )
                }
                onSelect={() => onOpenPost(post.slug)}
              />
            );
          })}

          {/* Bottom "top" button centered beneath the terminal circle node */}
          <button
            type="button"
            className="return-switch blog-top"
            onClick={scrollToTop}
            aria-label="Scroll to top"
            style={{
              left: "50%",
              top: topBtnY,
            }}
          >
            {docked && <TopLabel />}
          </button>
        </div>
      </div>

      {activeIndex !== null && posts[activeIndex] && (
        <BlogPostModal post={posts[activeIndex]} onClose={closeModal} />
      )}
    </section>
  );
}
