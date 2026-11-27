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
import { useEffect, useRef, useState } from "react";
import {
  artboardSize,
  bendX,
  centerY,
  diagonalRun,
  greenStrokeWidth,
  leftX,
  logoOffset,
  logoScale,
  logoSnapSpring,
  lowerLeftY,
  lowerStemY,
  rightX,
  spineX,
  springHandoff,
  stemX,
  travelDuration,
  travelEase,
  upperLeftY,
  upperStemY,
  type SceneGeometry,
} from "~/lib/scene-geometry";
import { shouldSkipIntro } from "~/lib/sections";
import { SegmentLabels, type Section } from "./segment-labels";

const initialExtension = 12_000;

type BranchTips = {
  upperLeftX: MotionValue<number>;
  upperRightY: MotionValue<number>;
  farRightX: MotionValue<number>;
  farRightY: MotionValue<number>;
  crossbar: MotionValue<string>;
  lowerRightY: MotionValue<number>;
  lowerLeftX: MotionValue<number>;
  middleLeftX: MotionValue<number>;
};

function LogoStrokes({
  tips,
  inner = false,
}: {
  tips: BranchTips;
  inner?: boolean;
}) {
  const green = inner ? "black" : "#2bbc7d";
  const white = inner ? "black" : "white";
  const nodeWidth = inner ? greenStrokeWidth / 2 : greenStrokeWidth;

  const outline = useMotionTemplate`M${tips.upperLeftX},${upperLeftY} H${bendX} L${spineX},${upperLeftY + diagonalRun} V${lowerLeftY - diagonalRun} L${bendX},${lowerLeftY} H${tips.lowerLeftX}`;
  const middle = useMotionTemplate`M${spineX},${centerY} H${tips.middleLeftX}`;
  const stem = useMotionTemplate`M${stemX},${tips.upperRightY} V${tips.lowerRightY}`;

  return (
    <g fill="none">
      <motion.path d={outline} stroke={green} strokeWidth={nodeWidth} />
      <g stroke={green} strokeWidth={nodeWidth}>
        <motion.circle cx={tips.upperLeftX} cy={upperLeftY} r={19} />
        <motion.circle cx={tips.middleLeftX} cy={centerY} r={19} />
        <motion.circle cx={tips.lowerLeftX} cy={lowerLeftY} r={19} />
        <circle cx={spineX} cy={centerY} r={19} />
      </g>
      <motion.path d={middle} stroke={green} strokeWidth={nodeWidth} />
      <g stroke={white}>
        <g fill={inner ? "none" : green} strokeWidth={nodeWidth}>
          <motion.circle cx={stemX} cy={tips.upperRightY} r={19} />
          <motion.circle cx={stemX} cy={tips.lowerRightY} r={19} />
          <motion.circle cx={tips.farRightX} cy={tips.farRightY} r={19} />
          <circle cx={stemX} cy={centerY} r={19} />
        </g>
        <motion.path
          d={tips.crossbar}
          strokeLinejoin="round"
          strokeWidth={nodeWidth}
          strokeLinecap={inner ? undefined : "butt"}
        />
        <motion.path d={stem} strokeWidth={nodeWidth} />
      </g>
    </g>
  );
}

export function AnimatedLogo({
  progress,
  flightAxis = "right",
  geometry,
  onNavigate,
  onHoverSection,
  onLabelsReady,
}: {
  progress: MotionValue<number>;
  flightAxis?: "right" | "down";
  geometry: SceneGeometry | null;
  onNavigate: (section: Section, link: HTMLOrSVGElement) => void;
  onHoverSection?: (section: Section | null) => void;
  onLabelsReady?: () => void;
}) {
  const [showLabels, setShowLabels] = useState(false);
  const [skippedIntro, setSkippedIntro] = useState(false);
  const onLabelsReadyRef = useRef(onLabelsReady);
  useEffect(() => {
    onLabelsReadyRef.current = onLabelsReady;
  }, [onLabelsReady]);
  const logoRef = useRef<HTMLDivElement>(null);
  const upperLeft = useMotionValue(initialExtension);
  const upperRight = useMotionValue(initialExtension);
  const farRight = useMotionValue(initialExtension);
  const lowerRight = useMotionValue(initialExtension);
  const lowerLeft = useMotionValue(initialExtension);
  const middleLeft = useMotionValue(initialExtension);
  const reduceMotion = useReducedMotionConfig();

  // Extend either the crossbar to the right (Work/About) or the bottom stem downward (Blog).
  const scale = geometry?.scale ?? 1;
  const straightLength =
    flightAxis === "right" ? (geometry?.straight ?? 0) / scale : 0;
  const dropLength =
    flightAxis === "right" ? (geometry?.loopHeight ?? 0) / scale : 0;
  const foldLength =
    flightAxis === "right" ? (geometry?.loopWidth ?? 0) / scale : 0;
  const blogDropLength =
    flightAxis === "down" ? (geometry?.blogDrop ?? 0) / scale : 0;
  const traveled = useTransform(
    progress,
    (value) => value * (straightLength + dropLength + foldLength),
  );
  const straight = useTransform(traveled, (value) =>
    Math.min(value, straightLength),
  );
  const drop = useTransform(traveled, (value) =>
    Math.min(Math.max(0, value - straightLength), dropLength),
  );
  const fold = useTransform(
    traveled,
    (value) => -Math.max(0, value - straightLength - dropLength),
  );
  const elbow = useTransform(() => rightX + farRight.get() + straight.get());
  const tipX = useTransform(() => elbow.get() + fold.get());
  const tipY = useTransform(() => centerY + drop.get());
  const crossbar = useMotionTemplate`M${spineX},${centerY} H${elbow} V${tipY} H${tipX}`;
  const lowerRightY = useTransform(
    () => lowerStemY + lowerRight.get() + progress.get() * blogDropLength,
  );
  const tips = {
    upperLeftX: useTransform(upperLeft, (distance) => leftX - distance),
    upperRightY: useTransform(upperRight, (distance) => upperStemY - distance),
    farRightX: tipX,
    farRightY: tipY,
    crossbar,
    lowerRightY,
    lowerLeftX: useTransform(lowerLeft, (distance) => leftX - distance),
    middleLeftX: useTransform(middleLeft, (distance) => leftX - distance),
  };

  useEffect(() => {
    // Start at the upper-left tip and work clockwise around the logo.
    const branches = [
      { extension: upperLeft, axis: "horizontal" },
      { extension: upperRight, axis: "vertical" },
      { extension: farRight, axis: "horizontal" },
      { extension: lowerRight, axis: "vertical" },
      { extension: lowerLeft, axis: "horizontal" },
      { extension: middleLeft, axis: "horizontal" },
    ];

    if (reduceMotion || shouldSkipIntro()) {
      setSkippedIntro(true);
      setShowLabels(true);
      onLabelsReadyRef.current?.();
      branches.forEach(({ extension }) => extension.jump(0));
      return;
    }

    let cancelled = false;
    function retractBranches() {
      if (cancelled) return;
      const width = logoRef.current?.getBoundingClientRect().width;
      if (!width) return;

      const unitsPerPixel = artboardSize / (width * logoScale);
      const exitSlope = (1 - travelEase[3]) / (1 - travelEase[2]);
      let delayMs = 100;
      let remaining = branches.length;
      branches.forEach(({ extension, axis }, index) => {
        const viewportSize =
          axis === "horizontal" ? window.innerWidth : window.innerHeight;
        const reach = viewportSize * unitsPerPixel * 0.6;
        const travel = reach * (1 - springHandoff);
        // Match the Bézier curve's exit velocity at the spring handoff.
        const velocity = (-travel * exitSlope) / travelDuration;

        extension.jump(reach);
        void animate(extension, reach * springHandoff, {
          type: "tween",
          duration: travelDuration,
          delay: delayMs / 1000,
          ease: travelEase,
          onComplete() {
            if (cancelled) return;
            void animate(extension, 0, {
              ...logoSnapSpring,
              velocity,
              restSpeed: 3,
              restDelta: 0.35,
              onComplete() {
                if (cancelled) return;
                if (--remaining === 0) {
                  setShowLabels(true);
                  onLabelsReadyRef.current?.();
                }
              },
            });
          },
        });
        delayMs += 60 + index * 10;
      });
    }

    const frameId = requestAnimationFrame(retractBranches);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      branches.forEach(({ extension }) => extension.stop());
    };
  }, [
    upperLeft,
    upperRight,
    farRight,
    lowerRight,
    lowerLeft,
    middleLeft,
    reduceMotion,
  ]);

  const flightWidth =
    geometry && flightAxis === "right"
      ? artboardSize +
        Math.ceil((geometry.straight * logoScale) / geometry.scale)
      : artboardSize;
  const flightHeight =
    geometry && flightAxis === "down"
      ? artboardSize +
        Math.ceil((geometry.blogDrop * logoScale) / geometry.scale)
      : artboardSize;

  return (
    <div
      ref={logoRef}
      className="home-logo relative aspect-square w-[min(85vw,80dvh,36rem)]"
    >
      <svg
        role="navigation"
        aria-label="BitBeans logo with Work, About, and Blog"
        viewBox={`0 0 ${flightWidth} ${flightHeight}`}
        className="absolute top-0 left-0 max-h-none max-w-none overflow-visible"
        style={{
          width: `${(100 * flightWidth) / artboardSize}%`,
          height: `${(100 * flightHeight) / artboardSize}%`,
        }}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g
          transform={`translate(${logoOffset.x} ${logoOffset.y}) scale(${logoScale})`}
        >
          <LogoStrokes tips={tips} />
          <LogoStrokes tips={tips} inner />
          {showLabels && (
            <SegmentLabels
              onNavigate={onNavigate}
              onHoverSection={onHoverSection}
              x={leftX + 9}
              baselines={[upperLeftY - 58, centerY - 58, lowerLeftY - 58]}
              reduceMotion={Boolean(reduceMotion) || skippedIntro}
            />
          )}
        </g>
      </svg>
    </div>
  );
}
