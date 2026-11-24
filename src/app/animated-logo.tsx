"use client";

import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

import type { SceneGeometry } from "./portfolio-scene";
import { SegmentLabels, type Section } from "./segment-labels";
import { shouldSkipIntro } from "./sections";

const artboardSize = 1000;
const logoScale = 0.962535;
const logoOffset = { x: 98.962642, y: 23.705111 };
const greenStrokeWidth = 64;
const initialExtension = 12_000;
const centerY = 476;
const leftX = 186;
const spineX = 478;
const stemX = 554;
const rightX = 652;
const upperLeftY = centerY - 250;
const lowerLeftY = centerY + 250;
const upperStemY = centerY - 194;
const lowerStemY = centerY + 194;
const bendX = 350;
const diagonalRun = spineX - bendX;

export const travelDuration = 0.76;
export const springHandoff = 0.075;
export const travelEase = [0.52, 0, 0.26, 0.82] as const;

export const logoSnapSpring = {
  type: "spring",
  stiffness: 360,
  damping: 22,
  mass: 0.7,
} as const;

export function logoBranchStrokeWidth(svgWidth: number) {
  return (greenStrokeWidth * logoScale * svgWidth) / artboardSize;
}

export function restingWhiteTip(logoWidth: number) {
  const unit = logoWidth / artboardSize;
  const scale = unit * logoScale;
  return {
    scale,
    x: unit * logoOffset.x + rightX * scale,
    y: unit * logoOffset.y + centerY * scale,
  };
}

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
  geometry,
  onNavigate,
  onHoverSection,
}: {
  progress: MotionValue<number>;
  geometry: SceneGeometry | null;
  onNavigate: (section: Section, link: HTMLOrSVGElement) => void;
  onHoverSection?: (section: Section | null) => void;
}) {
  const [showLabels, setShowLabels] = useState(false);
  const [skippedIntro, setSkippedIntro] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const upperLeft = useMotionValue(initialExtension);
  const upperRight = useMotionValue(initialExtension);
  const farRight = useMotionValue(initialExtension);
  const lowerRight = useMotionValue(initialExtension);
  const lowerLeft = useMotionValue(initialExtension);
  const middleLeft = useMotionValue(initialExtension);
  const reduceMotion = useReducedMotion();

  // Extend the actual crossbar around the return loop, keeping its white tip on the path.
  const scale = geometry?.scale ?? 1;
  const straightLength = (geometry?.straight ?? 0) / scale;
  const dropLength = (geometry?.loopHeight ?? 0) / scale;
  const foldLength = (geometry?.loopWidth ?? 0) / scale;
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
  const tips = {
    upperLeftX: useTransform(upperLeft, (distance) => leftX - distance),
    upperRightY: useTransform(upperRight, (distance) => upperStemY - distance),
    farRightX: tipX,
    farRightY: tipY,
    crossbar,
    lowerRightY: useTransform(lowerRight, (distance) => lowerStemY + distance),
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
      branches.forEach(({ extension }) => extension.jump(0));
      return;
    }

    function retractBranches() {
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
            void animate(extension, 0, {
              ...logoSnapSpring,
              velocity,
              restSpeed: 3,
              restDelta: 0.35,
              onComplete() {
                if (--remaining === 0) setShowLabels(true);
              },
            });
          },
        });
        delayMs += 60 + index * 10;
      });
    }

    const frameId = requestAnimationFrame(retractBranches);

    return () => {
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

  const flightWidth = geometry
    ? artboardSize + Math.ceil((geometry.straight * logoScale) / geometry.scale)
    : artboardSize;

  return (
    <div
      ref={logoRef}
      className="home-logo relative aspect-square w-[min(85vw,80dvh,36rem)]"
    >
      <svg
        role="navigation"
        aria-label="BitBeans logo with Work, About, and Game"
        viewBox={`0 0 ${flightWidth} ${artboardSize}`}
        className="absolute top-0 left-0 h-full max-w-none overflow-visible"
        style={{ width: `${(100 * flightWidth) / artboardSize}%` }}
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
