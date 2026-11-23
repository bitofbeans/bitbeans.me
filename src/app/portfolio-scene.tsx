"use client";

import Link from "next/link";
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
  logoSnapSpring,
  springHandoff,
  travelDuration,
  travelEase,
} from "./animated-logo";
import { CircuitBackdrop, traceMetrics } from "./circuit-backdrop";
import { PortfolioPanel, SectionContent } from "./portfolio-panel";

import { sectionPath, sections, type Section } from "./sections";

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

export function PortfolioScene({
  initialSection = null,
}: {
  initialSection?: Section | null;
}) {
  const root = useRef<HTMLElement>(null);
  const [geometry, setGeometry] = useState<SceneGeometry | null>(null);
  const [target, setTarget] = useState(initialSection);
  const [section, setSection] = useState(initialSection);
  const [docked, setDocked] = useState(!!initialSection);
  const progress = useMotionValue(initialSection ? 1 : 0);
  const camera = useMotionValue(initialSection ? 1 : 0);
  const reduce = useReducedMotion();
  const lastLink = useRef<HTMLOrSVGElement | null>(null);
  const returningHome = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const el = root.current!;
    const measure = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      const logo = el.querySelector<HTMLDivElement>(".home-logo");
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
      returningHome.current = false;
      const legacy =
        location.pathname === "/" &&
        sections.find((entry) => "#" + entry.toLowerCase() === location.hash);
      if (legacy)
        history.replaceState(null, "", sectionPath(legacy) + location.search);
      const next =
        sections.find((entry) => sectionPath(entry) === location.pathname) ??
        null;
      if (next) setSection(next);
      setTarget(next);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
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
        if (returningHome.current) {
          returningHome.current = false;
          const entry: unknown = history.state;
          if (
            entry &&
            typeof entry === "object" &&
            "fromLogo" in entry &&
            entry.fromLogo === true
          )
            history.back();
          else history.replaceState(null, "", "/");
        }
      }
    };
    if (reduce || (progress.get() === end && camera.get() === end)) {
      progress.jump(end);
      camera.jump(end);
      finish();
      return;
    }
    const distance = end - progress.get();
    let cameraDone = camera.get() === end;
    let nodeDone = distance === 0;
    if (!cameraDone) {
      animate(camera, end, {
        type: "tween",
        duration: 1.15 * Math.abs(end - camera.get()),
        ease: [0.42, 0, 0.42, 1],
        onComplete() {
          cameraDone = true;
          if (nodeDone) finish();
        },
      });
    }
    if (nodeDone) return () => camera.stop();
    const duration = travelDuration * Math.abs(distance);
    const exitSlope = (1 - travelEase[3]) / (1 - travelEase[2]);
    animate(progress, end - distance * springHandoff, {
      type: "tween",
      duration,
      ease: travelEase,
      onComplete() {
        animate(progress, end, {
          ...logoSnapSpring,
          velocity: (distance * (1 - springHandoff) * exitSlope) / duration,
          restDelta: 0.0001,
          restSpeed: 0.001,
          onComplete() {
            nodeDone = true;
            if (cameraDone) finish();
          },
        });
      },
    });
    return () => {
      camera.stop();
      progress.stop();
    };
  }, [target, measured, progress, camera, reduce]); // Resizing a docked panel does not replay the flight.

  useEffect(() => {
    if (docked) heading.current?.focus({ preventScroll: true });
    else if (!section) lastLink.current?.focus({ preventScroll: true });
  }, [docked, section]);

  function goBack() {
    returningHome.current = true;
    setTarget(null);
  }
  const cameraX = useTransform(camera, (v) => -v * (geometry?.distance ?? 0));
  const cameraY = useTransform(camera, (v) => -v * (geometry?.cameraY ?? 0));

  return (
    <main
      ref={root}
      className="fixed inset-x-0 top-0 isolate h-dvh overflow-clip"
    >
      {!geometry &&
        (initialSection ? (
          <section className="panel-content relative z-20 max-h-full overflow-y-auto bg-black text-white">
            <Link href="/">Back to homepage</Link>
            <h1>{initialSection}</h1>
            <SectionContent section={initialSection} />
          </section>
        ) : (
          <nav
            aria-label="Portfolio"
            className="sr-only focus-within:not-sr-only"
          >
            {sections.map((entry) => (
              <a key={entry} href={sectionPath(entry)}>
                {entry}
              </a>
            ))}
          </nav>
        ))}
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
              history.pushState({ fromLogo: true }, "", sectionPath(next));
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
