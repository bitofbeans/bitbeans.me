"use client";

import Link from "next/link";
import {
  animate,
  motion,
  MotionConfig,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { BlogPost } from "~/lib/blog-types";
import {
  blogCameraDuration,
  blogTravelDuration,
  cameraDuration,
  logoSnapSpring,
  sceneGeometry,
  springHandoff,
  travelDuration,
  travelEase,
  type SceneGeometry,
} from "~/lib/scene-geometry";
import {
  blogPostPath,
  blogPostTitle,
  blogSlugFromPath,
  markSectionVisited,
  sectionFromHash,
  sectionFromPath,
  sectionPath,
  sections,
  sectionTitle,
  type Section,
} from "~/lib/sections";
import { AnimatedLogo } from "./animated-logo";
import { BlogPanel } from "./blog/blog-panel";
import { CircuitBackdrop } from "./circuit-backdrop";
import { PortfolioPanel, SectionContent } from "./portfolio-panel";

const enableHomeBackdropHighlights = false;

const sessionToken =
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Math.random());

export function PortfolioScene({
  initialSection = null,
  initialPostSlug = null,
  blogPosts = [],
}: {
  initialSection?: Section | null;
  initialPostSlug?: string | null;
  blogPosts?: readonly BlogPost[];
}) {
  const root = useRef<HTMLElement>(null);
  const [geometry, setGeometry] = useState<SceneGeometry | null>(null);
  const [target, setTarget] = useState(initialSection);
  const [section, setSection] = useState(initialSection);
  const [activePostSlug, setActivePostSlug] = useState<string | null>(
    initialPostSlug,
  );
  const [docked, setDocked] = useState(!!initialSection);
  const [labelsReady, setLabelsReady] = useState(Boolean(initialSection));
  const [hoveredSection, setHoveredSection] = useState<Section | null>(null);
  const [motionOff, setMotionOff] = useState(false);
  const progress = useMotionValue(initialSection ? 1 : 0);
  const camera = useMotionValue(initialSection ? 1 : 0);
  const osReduce = useReducedMotion();
  const reduce = Boolean(osReduce) || motionOff;

  useEffect(() => {
    try {
      if (window.localStorage.getItem("bitbeans-motion-off") === "1") {
        setMotionOff(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (motionOff) {
      document.documentElement.dataset.reducedMotion = "true";
    } else {
      delete document.documentElement.dataset.reducedMotion;
    }
  }, [motionOff]);

  function toggleMotion() {
    setMotionOff((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem("bitbeans-motion-off", next ? "1" : "0");
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }
  const lastLink = useRef<HTMLOrSVGElement | null>(null);
  const hadSection = useRef(Boolean(initialSection));
  const returningHome = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const blogPostCount = blogPosts.length;

  useLayoutEffect(() => {
    if (initialSection) markSectionVisited();
    const el = root.current!;
    const measure = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      const logo = el.querySelector<HTMLDivElement>(".home-logo");
      const logoWidth = logo?.getBoundingClientRect().width;
      if (w && h && logoWidth) {
        setGeometry(sceneGeometry(w, h, logoWidth, blogPostCount));
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [initialSection, blogPostCount]);

  useEffect(() => {
    const sync = () => {
      returningHome.current = false;
      const legacy =
        location.pathname === "/" ? sectionFromHash(location.hash) : null;
      if (legacy)
        history.replaceState(null, "", sectionPath(legacy) + location.search);
      const next = sectionFromPath(location.pathname);
      const nextSlug = blogSlugFromPath(location.pathname);
      if (next) setSection(next);
      setTarget(next);
      setActivePostSlug(next === "Blog" ? nextSlug : null);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    const activePost =
      target === "Blog" && activePostSlug
        ? blogPosts.find((entry) => entry.slug === activePostSlug)
        : null;
    document.title = activePost
      ? blogPostTitle(activePost.title)
      : sectionTitle(target);
  }, [target, activePostSlug, blogPosts]);

  const measured = geometry !== null;
  const flightAxis: "right" | "down" = section === "Blog" ? "down" : "right";

  useEffect(() => {
    if (!measured) return;
    setDocked(false);
    const end = target ? 1 : 0;
    const isBlogFlight = flightAxis === "down";
    const baseCameraDuration = isBlogFlight
      ? blogCameraDuration
      : cameraDuration;
    const baseTravelDuration = isBlogFlight
      ? blogTravelDuration
      : travelDuration;

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
            entry.fromLogo === sessionToken
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
    let cancelled = false;
    let cameraDone = camera.get() === end;
    let nodeDone = distance === 0;
    if (!cameraDone) {
      animate(camera, end, {
        type: "tween",
        duration: baseCameraDuration * Math.abs(end - camera.get()),
        ease: [0.42, 0, 0.42, 1],
        onComplete() {
          if (cancelled) return;
          cameraDone = true;
          if (nodeDone) finish();
        },
      });
    }
    if (nodeDone) {
      return () => {
        cancelled = true;
        camera.stop();
      };
    }
    const duration = baseTravelDuration * Math.abs(distance);
    const exitSlope = (1 - travelEase[3]) / (1 - travelEase[2]);
    animate(progress, end - distance * springHandoff, {
      type: "tween",
      duration,
      ease: travelEase,
      onComplete() {
        if (cancelled) return;
        animate(progress, end, {
          ...logoSnapSpring,
          velocity: (distance * (1 - springHandoff) * exitSlope) / duration,
          restDelta: 0.0001,
          restSpeed: 0.001,
          onComplete() {
            if (cancelled) return;
            nodeDone = true;
            if (cameraDone) finish();
          },
        });
      },
    });
    return () => {
      cancelled = true;
      camera.stop();
      progress.stop();
    };
  }, [target, flightAxis, measured, progress, camera, reduce]); // Resizing a docked panel does not replay the flight.

  useEffect(() => {
    if (section) {
      markSectionVisited();
      hadSection.current = true;
    }
    if (docked) heading.current?.focus({ preventScroll: true });
    else if (!section && hadSection.current) {
      hadSection.current = false;
      const fallback =
        lastLink.current ??
        root.current?.querySelector<SVGAElement>(".section-link");
      fallback?.focus({ preventScroll: true });
    }
  }, [docked, section]);

  function goBack() {
    returningHome.current = true;
    setActivePostSlug(null);
    setTarget(null);
  }

  function openBlogPost(slug: string) {
    history.pushState({ fromBlog: sessionToken }, "", blogPostPath(slug));
    setActivePostSlug(slug);
  }

  function closeBlogPost() {
    setActivePostSlug(null);
    if (blogSlugFromPath(location.pathname) === null) return;
    const entry: unknown = history.state;
    if (
      entry &&
      typeof entry === "object" &&
      "fromBlog" in entry &&
      entry.fromBlog === sessionToken
    ) {
      history.back();
    } else {
      history.replaceState(null, "", sectionPath("Blog"));
    }
  }

  const cameraX = useTransform(
    camera,
    (v) =>
      -v *
      (flightAxis === "down"
        ? (geometry?.blogCameraX ?? 0)
        : (geometry?.distance ?? 0)),
  );
  const cameraY = useTransform(
    camera,
    (v) =>
      -v *
      (flightAxis === "down"
        ? (geometry?.blogDistance ?? 0)
        : (geometry?.cameraY ?? 0)),
  );
  const backdropSize = useMemo(
    () =>
      geometry
        ? {
            width: geometry.w,
            height: geometry.h,
            logoWidth: geometry.logoWidth,
          }
        : null,
    [geometry],
  );

  return (
    <MotionConfig reducedMotion={motionOff ? "always" : "user"}>
      <main
        ref={root}
        className="fixed inset-x-0 top-0 isolate h-dvh overflow-clip"
      >
      {!section && <h1 className="sr-only">Benas Unguraitis — BitBeans</h1>}
      {!geometry && initialSection && (() => {
        const initialPost =
          initialSection === "Blog" && initialPostSlug
            ? blogPosts.find((entry) => entry.slug === initialPostSlug)
            : null;
        return (
          <section className="panel-content relative z-20 max-h-full overflow-y-auto bg-black text-white">
            <Link href={initialPost ? sectionPath("Blog") : "/"}>
              {initialPost ? "Back to blog" : "Back to homepage"}
            </Link>
            <h1>{initialPost ? initialPost.title : initialSection}</h1>
            {initialPost ? (
              <article>
                {initialPost.displayDate && <p>{initialPost.displayDate}</p>}
                {initialPost.summary && <p>{initialPost.summary}</p>}
              </article>
            ) : (
              <SectionContent section={initialSection} blogPosts={blogPosts} />
            )}
          </section>
        );
      })()}
      {!initialSection && !section && !labelsReady && (
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
      )}
      <motion.div
        className="absolute inset-0"
        style={{ x: cameraX, y: cameraY }}
      >
        <div
          inert={!!section}
          className="pointer-events-none absolute inset-0 isolate z-10 grid place-items-center"
        >
          <CircuitBackdrop
            size={backdropSize}
            flight={section ? geometry : null}
            flightAxis={flightAxis}
            hoveredSection={
              enableHomeBackdropHighlights && !section ? hoveredSection : null
            }
            interactive={enableHomeBackdropHighlights && !section}
          />
          <AnimatedLogo
            progress={progress}
            flightAxis={flightAxis}
            geometry={geometry}
            onLabelsReady={() => setLabelsReady(true)}
            onHoverSection={
              enableHomeBackdropHighlights ? setHoveredSection : undefined
            }
            onNavigate={(next, link) => {
              if (section) return;
              setHoveredSection(null);
              lastLink.current = link;
              history.pushState(
                { fromLogo: sessionToken },
                "",
                sectionPath(next),
              );
              setSection(next);
              setTarget(next);
            }}
          />
          <button
            type="button"
            role="switch"
            aria-checked={!reduce}
            aria-label={reduce ? "Turn animations on" : "Turn animations off"}
            aria-hidden={!labelsReady}
            tabIndex={labelsReady ? undefined : -1}
            title={reduce ? "Animations: OFF" : "Animations: ON"}
            className={
              "motion-knob" +
              (labelsReady ? " is-ready" : "") +
              (reduce ? " is-off" : "")
            }
            onClick={toggleMotion}
          >
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <circle
                cx="10"
                cy="10"
                r="7.5"
                fill="#000000"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line
                className="motion-knob-dial"
                x1="10"
                y1="10"
                x2="10"
                y2="4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{
                  transform: `rotate(${reduce ? -40 : 40}deg)`,
                  transformOrigin: "10px 10px",
                }}
              />
            </svg>
            <span className="motion-knob-label">
              {reduce ? "off" : "anim"}
            </span>
          </button>
        </div>
        {section &&
          geometry &&
          (section === "Blog" ? (
            <BlogPanel
              key="Blog"
              posts={blogPosts}
              activePostSlug={activePostSlug}
              onOpenPost={openBlogPost}
              onClosePost={closeBlogPost}
              geometry={geometry}
              progress={progress}
              target={target}
              docked={docked}
              heading={heading}
              goBack={goBack}
            />
          ) : (
            <PortfolioPanel
              key={section}
              section={section}
              geometry={geometry}
              docked={docked}
              heading={heading}
              goBack={goBack}
              blogPosts={blogPosts}
            />
          ))}
      </motion.div>
      </main>
    </MotionConfig>
  );
}
