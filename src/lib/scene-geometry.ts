export const artboardSize = 1000;
export const logoScale = 0.962535;
export const logoOffset = { x: 98.962642, y: 23.705111 } as const;
export const greenStrokeWidth = 64;
export const centerY = 476;
export const leftX = 186;
export const spineX = 478;
export const stemX = 554;
export const rightX = 652;
export const upperLeftY = centerY - 250;
export const lowerLeftY = centerY + 250;
export const upperStemY = centerY - 194;
export const lowerStemY = centerY + 194;
export const bendX = 350;
export const diagonalRun = spineX - bendX;

export const travelDuration = 0.76;
export const blogTravelDuration = 0.9;
export const cameraDuration = 1.15;
export const blogCameraDuration = 1.25;
export const springHandoff = 0.075;
export const travelEase = [0.52, 0, 0.26, 0.82] as const;

export const logoSnapSpring = {
  type: "spring",
  stiffness: 360,
  damping: 22,
  mass: 0.7,
} as const;

export const desktopLaneSpacing = 82;
export const blueOutlineScale = 0.7;

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

export function restingBottomWhiteTip(logoWidth: number) {
  const unit = logoWidth / artboardSize;
  const scale = unit * logoScale;
  return {
    scale,
    x: unit * logoOffset.x + stemX * scale,
    y: unit * logoOffset.y + lowerStemY * scale,
  };
}

export function traceMetrics(width: number, height: number, logoWidth: number) {
  const laneSpacing = Math.min(desktopLaneSpacing, width / 9, height / 6);
  const compactness = 1 - laneSpacing / desktopLaneSpacing;
  const baseStrokeWidth =
    (logoBranchStrokeWidth(logoWidth) / 2) * (1 - 0.4 * compactness);
  const innerStrokeWidth = baseStrokeWidth / 2;
  const strokeWidth = innerStrokeWidth * (1 + blueOutlineScale);
  const crossingGap = strokeWidth / 4;
  const nodeInnerRadius = baseStrokeWidth * 0.525;
  const nodeOuterRadius =
    nodeInnerRadius + (baseStrokeWidth / 4) * blueOutlineScale;
  const nodeClearRadius = nodeOuterRadius + strokeWidth / 8;
  return {
    compactness,
    strokeWidth,
    innerStrokeWidth,
    crossingGap,
    nodeInnerRadius,
    nodeOuterRadius,
    nodeClearRadius,
  };
}

export type TraceMetrics = ReturnType<typeof traceMetrics>;

export type BlogBranchGeometry = {
  index: number;
  side: 1 | -1;
  junctionY: number;
  nodeX: number;
  nodeY: number;
};

export function blogTreeLayout(
  w: number,
  h: number,
  wire: number,
  postCount: number,
) {
  const innerWire = wire / 2;
  const nodeR = (19 / 64) * wire;
  const nodeOuterR = nodeR + wire / 2;
  const centerX = w / 2;
  const backTop = Math.max(20, Math.min(h * 0.055, 44));
  const branchRun = Math.max(wire * 1.9, Math.min(wire * 2.45, w * 0.145, 92));
  const branchStep = Math.max(wire * 3.1, 96);
  const firstJunctionY = backTop + Math.max(wire * 2.7, 78);

  // Evenly spaced alternating 45° downward branches (right, left, right, left, ...).
  const branches: BlogBranchGeometry[] = Array.from(
    { length: postCount },
    (_, index) => {
      const side: 1 | -1 = index % 2 === 0 ? 1 : -1;
      const junctionY = firstJunctionY + index * branchStep;
      return {
        index,
        side,
        junctionY,
        nodeX: centerX + side * branchRun,
        nodeY: junctionY + branchRun,
      };
    },
  );

  const lastBranch = branches[branches.length - 1];
  const lastNodeY = lastBranch ? lastBranch.nodeY : firstJunctionY + branchRun;
  const spineEndY = lastNodeY + Math.max(wire * 1.9, 64);
  const topBtnY = spineEndY + nodeOuterR + 22;
  const canvasHeight = Math.max(h, topBtnY + 84);
  const labelGap = nodeOuterR + Math.max(12, wire * 0.45);
  const maxLabelWidth = Math.max(
    88,
    Math.min(280, w / 2 - branchRun - labelGap - 16),
  );

  return {
    wire,
    innerWire,
    nodeR,
    nodeOuterR,
    centerX,
    backTop,
    branchRun,
    branchStep,
    firstJunctionY,
    branches,
    spineEndY,
    topBtnY,
    canvasHeight,
    labelGap,
    maxLabelWidth,
  };
}

export type BlogTreeLayout = ReturnType<typeof blogTreeLayout>;

export function sceneGeometry(
  w: number,
  h: number,
  logoWidth: number,
  blogPostCount: number,
) {
  const tip = restingWhiteTip(logoWidth);
  const tipX = (w - logoWidth) / 2 + tip.x;
  const tipY = (h - logoWidth) / 2 + tip.y;
  const bottomTip = restingBottomWhiteTip(logoWidth);
  const bottomTipX = (w - logoWidth) / 2 + bottomTip.x;
  const bottomTipY = (h - logoWidth) / 2 + bottomTip.y;
  const wire = logoBranchStrokeWidth(logoWidth);
  const traces = traceMetrics(w, h, logoWidth);
  const left = Math.max(Math.min(w * 0.088, 112), (w - 1160) / 2, 18);
  const top = Math.max(18, Math.min(h * 0.085, 88));
  const distance = w * 1.65;
  const railY = top + wire + 12;
  const loopWidth = wire * 1.45;
  const loopHeight = wire + 12;
  const blogTree = blogTreeLayout(w, h, wire, blogPostCount);
  const blogCameraX = bottomTipX - w / 2;
  const blogDistance = h * 1.65;
  // Fly all the way to the terminal circle node when it fits on screen, or cleanly
  // past the bottom edge of the viewport when the tree extends below the fold.
  const blogFlightEndY = Math.min(
    blogTree.spineEndY,
    h + blogTree.nodeOuterR * 2,
  );
  const blogDrop = blogDistance + blogFlightEndY - bottomTipY;

  return {
    w,
    h,
    logoWidth,
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
    bottomTipX,
    bottomTipY,
    blogCameraX,
    blogDistance,
    blogFlightEndY,
    blogDrop,
    blogTree,
  };
}

export type SceneGeometry = ReturnType<typeof sceneGeometry>;
