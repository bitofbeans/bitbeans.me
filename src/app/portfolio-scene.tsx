"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  AnimatedLogo,
  restingWhiteTip,
  logoBranchStrokeWidth,
} from "./animated-logo";
import { CircuitBackdrop, traceMetrics } from "./circuit-backdrop";
import { PortfolioPanel } from "./portfolio-panel";

import { sections, type Section } from "./segment-labels";

function sceneGeometry(w: number, h: number, logoWidth: number) {
  const tip = restingWhiteTip(logoWidth);
  const tipX = (w - logoWidth) / 2 + tip.x;
  const tipY = (h - logoWidth) / 2 + tip.y;
  const wire = logoBranchStrokeWidth(logoWidth);
  const traces = traceMetrics(w, h, logoWidth);
  const left = Math.max(Math.min(w * 0.088, 112), (w - 1160) / 2, 18);
  const top = Math.max(18, Math.min(h * 0.085, 88));
  const distance = w * 1.65;
  const railY = top + wire + 12;
  const loopWidth = wire * 1.45;
  const loopHeight = wire + 12;
  return {
    w,
    h,
    wire,
    traces,
    left,
    top,
    distance,
    loopWidth,
    loopHeight,
    railY,
    cameraY: tipY - railY,
    scale: tip.scale,
    straight: distance + left + loopWidth - tipX,
  };
}
export type SceneGeometry = ReturnType<typeof sceneGeometry>;

export function PortfolioScene() {
  const root = useRef<HTMLElement>(null);
  const [geometry, setGeometry] = useState<SceneGeometry | null>(null);
  const [target, setTarget] = useState<Section | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [docked, setDocked] = useState(false);
  const progress = useMotionValue(0);
  const reduce = useReducedMotion();
  const lastLink = useRef<HTMLOrSVGElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const el = root.current!;
    const measure = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      const logo = el.querySelector<SVGSVGElement>(".home-logo");
      const logoWidth = logo?.getBoundingClientRect().width;
      if (w && h && logoWidth) setGeometry(sceneGeometry(w, h, logoWidth));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => {
      const next =
        sections.find((s) => "#" + s.toLowerCase() === location.hash) ?? null;
      if (next) setSection(next);
      setTarget(next);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const measured = geometry !== null;
  useEffect(() => {
    if (!measured) return;
    setDocked(false);
    const end = target ? 1 : 0;
    const finish = () => {
      if (target) setDocked(true);
      else {
        setSection(null);
      }
    };
    if (reduce || progress.get() === end) {
      progress.jump(end);
      finish();
      return;
    }
    const controls = animate(progress, end, {
      duration: (target ? 1.5 : 1.1) * Math.abs(end - progress.get()),
      ease: [0.42, 0, 0.25, 1],
      onComplete: finish,
    });
    return () => controls.stop();
  }, [target, measured, progress, reduce]); // Resizing a docked panel does not replay the flight.

  useEffect(() => {
    if (docked) heading.current?.focus({ preventScroll: true });
    else if (!section) lastLink.current?.focus({ preventScroll: true });
  }, [docked, section]);

  function goBack() {
    const entry = history.state as { fromLogo?: boolean } | null;
    if (entry?.fromLogo) history.back();
    else {
      history.replaceState(
        history.state,
        "",
        location.pathname + location.search,
      );
      setTarget(null);
    }
  }
  // Quadratic shoulders meet the constant-speed middle at the same velocity.
  // This lets the tip lead on departure and the camera coast through docking.
  const camera = useTransform(progress, (p) => {
    const start = 0.18,
      tail = 0.34;
    const speed = 1 / (1 - (start + tail) / 2);
    if (p < start) return (speed * p * p) / (2 * start);
    if (p > 1 - tail) return 1 - (speed * (1 - p) ** 2) / (2 * tail);
    return speed * (p - start / 2);
  });
  const cameraX = useTransform(camera, (v) => -v * (geometry?.distance ?? 0));
  const cameraY = useTransform(camera, (v) => -v * (geometry?.cameraY ?? 0));

  return (
    <main
      ref={root}
      className="fixed inset-x-0 top-0 isolate h-dvh overflow-clip"
    >
      <motion.div
        className="absolute inset-0"
        style={{ x: cameraX, y: cameraY }}
      >
        <div
          inert={!!section}
          className="pointer-events-none absolute inset-0 isolate z-10 grid place-items-center"
        >
          <CircuitBackdrop flight={section ? geometry : null} />
          <AnimatedLogo
            progress={progress}
            geometry={geometry}
            onNavigate={(next, link) => {
              if (section) return;
              lastLink.current = link;
              history.pushState(
                { ...history.state, fromLogo: true },
                "",
                "#" + next.toLowerCase(),
              );
              setSection(next);
              setTarget(next);
            }}
          />
        </div>
        {section && geometry && (
          <PortfolioPanel
            key={section}
            section={section}
            geometry={geometry}
            docked={docked}
            heading={heading}
            goBack={goBack}
          />
        )}
      </motion.div>
    </main>
  );
}
