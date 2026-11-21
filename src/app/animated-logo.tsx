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
import { useEffect, useRef } from "react";

const artboardSize = 1000;
const logoScale = 0.962535;
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

const travelDuration = 0.76;
const springHandoff = 0.075;
const travelEase = [0.52, 0, 0.26, 0.82] as const;

export const logoSnapSpring = {
  type: "spring",
  stiffness: 360,
  damping: 22,
  mass: 0.7,
} as const;

export function logoBranchStrokeWidth(svgWidth: number) {
  return (greenStrokeWidth * logoScale * svgWidth) / artboardSize;
}

type BranchTips = {
  upperLeftX: MotionValue<number>;
  upperRightY: MotionValue<number>;
  farRightX: MotionValue<number>;
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
  const crossbar = useMotionTemplate`M${spineX},${centerY} H${tips.farRightX}`;
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
          <motion.circle cx={tips.farRightX} cy={centerY} r={19} />
          <circle cx={stemX} cy={centerY} r={19} />
        </g>
        <motion.path
          d={crossbar}
          strokeWidth={inner ? 40 : 80}
          strokeLinecap={inner ? undefined : "butt"}
        />
        <motion.path d={stem} strokeWidth={inner ? 28 : 56} />
      </g>
    </g>
  );
}

export function AnimatedLogo() {
  const svgRef = useRef<SVGSVGElement>(null);
  const upperLeft = useMotionValue(initialExtension);
  const upperRight = useMotionValue(initialExtension);
  const farRight = useMotionValue(initialExtension);
  const lowerRight = useMotionValue(initialExtension);
  const lowerLeft = useMotionValue(initialExtension);
  const middleLeft = useMotionValue(initialExtension);
  const reduceMotion = useReducedMotion();

  const tips = {
    upperLeftX: useTransform(upperLeft, (distance) => leftX - distance),
    upperRightY: useTransform(upperRight, (distance) => upperStemY - distance),
    farRightX: useTransform(farRight, (distance) => rightX + distance),
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

    if (reduceMotion) {
      branches.forEach(({ extension }) => extension.jump(0));
      return;
    }

    function retractBranches() {
      const width = svgRef.current?.getBoundingClientRect().width;
      if (!width) return;

      const unitsPerPixel = artboardSize / (width * logoScale);
      const exitSlope = (1 - travelEase[3]) / (1 - travelEase[2]);
      let delayMs = 100;
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
            });
          },
        });
        delayMs += 60 + index * 10;
      });
    }

    if (document.readyState === "complete") {
      retractBranches();
    } else {
      window.addEventListener("load", retractBranches, { once: true });
    }

    return () => {
      window.removeEventListener("load", retractBranches);
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

  return (
    <svg
      ref={svgRef}
      role="img"
      aria-label="BitBeans logo"
      viewBox="0 0 1000 1000"
      className="h-auto w-[min(85vw,80dvh,36rem)] overflow-visible"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform="translate(98.962642 23.705111) scale(0.962535)">
        <LogoStrokes tips={tips} />
        <LogoStrokes tips={tips} inner />
      </g>
    </svg>
  );
}
