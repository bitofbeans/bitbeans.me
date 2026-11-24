"use client";

import { useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { SegmentDigits } from "./segment-labels";

type Cell = { x: number; y: number };
type Point = { x: number; y: number };
type Direction = "up" | "down" | "left" | "right";
type Phase = "ready" | "playing" | "paused" | "over" | "won";
type SpeedKey = "slow" | "normal" | "fast";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
};
type Ripple = { x: number; y: number; life: number; maxLife: number };
type Shake = { dx: number; dy: number; start: number };

type Sim = {
  prevSnake: Cell[];
  snake: Cell[];
  food: Cell;
  foodSpawnedAt: number;
  dir: Direction;
  queue: Direction[];
  grewThisStep: boolean;
  pendingGrow: boolean;
  stepStart: number;
  pausedAt: number;
  graceStart: number | null;
  graceDir: Direction;
  score: number;
  best: number;
  combo: number;
  lastEatAt: number;
  eatFlashUntil: number;
  particles: Particle[];
  ripples: Ripple[];
  shake: Shake | null;
  bonk: Point;
  endedAt: number;
  lastFrameAt: number;
};

// Board: classic 17 × 15 grid.
const COLS = 17;
const ROWS = 15;

// Everything is drawn in "art pixels" on a tiny canvas, then scaled up by a
// whole number of device pixels so every pixel stays square and crisp.
const CELL = 10;
const FRAME = 3;
const ART_W = COLS * CELL + FRAME * 2;
const ART_H = ROWS * CELL + FRAME * 2;
const MAX_CSS_SCALE = 4;

// Snake trace geometry inside a cell (mirrors the logo: wire with black channel).
const WIRE = 6;
const WIRE_INSET = (CELL - WIRE) / 2;
const CHANNEL = 2;
const CHANNEL_INSET = (CELL - CHANNEL) / 2;

const GRACE_MS = 70;
const END_OVERLAY_DELAY_MS = 420;
const RESTART_KEY_LOCK_MS = 350;
const RESTART_ARROW_LOCK_MS = 750;
const CRASH_BLINK_MS = 600;
const BEST_KEY = "bitbeans-snake-best";

const COLORS = {
  tileA: "#030806",
  tileB: "#08130d",
  black: "#000000",
  green: "#2bbc7d",
  greenDim: "#14563a",
  white: "#ffffff",
  amber: "#ffbc42",
  amberDim: "#8e713b",
  amberGlow: "#3a2c12",
};

const SPEEDS: Record<SpeedKey, { label: string; ms: number }> = {
  slow: { label: "Slow", ms: 150 },
  normal: { label: "Normal", ms: 115 },
  fast: { label: "Fast", ms: 82 },
};
const SPEED_ORDER: SpeedKey[] = ["normal", "fast", "slow"];

const DELTAS: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const KEY_DIRS: Record<string, Direction> = {
  ArrowUp: "up",
  w: "up",
  W: "up",
  ArrowDown: "down",
  s: "down",
  S: "down",
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
};

// Pentatonic rise for quick consecutive eats.
const EAT_SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

function initialSnake(): Cell[] {
  const cy = Math.floor(ROWS / 2);
  return [
    { x: 4, y: cy },
    { x: 3, y: cy },
    { x: 2, y: cy },
  ];
}

function initialFood(): Cell {
  return { x: 12, y: Math.floor(ROWS / 2) };
}

function createSim(best = 0): Sim {
  const snake = initialSnake();
  return {
    prevSnake: snake,
    snake,
    food: initialFood(),
    foodSpawnedAt: -Infinity,
    dir: "right",
    queue: [],
    grewThisStep: false,
    pendingGrow: false,
    stepStart: 0,
    pausedAt: 0,
    graceStart: null,
    graceDir: "right",
    score: 0,
    best,
    combo: 0,
    lastEatAt: -Infinity,
    eatFlashUntil: 0,
    particles: [],
    ripples: [],
    shake: null,
    bonk: { x: 0, y: 0 },
    endedAt: 0,
    lastFrameAt: 0,
  };
}

function spawnFood(snake: Cell[]): Cell | null {
  const occupied = new Set(snake.map((c) => `${c.x},${c.y}`));
  const free: Cell[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[Math.floor(Math.random() * free.length)] ?? null;
}

function canMoveTo(snake: Cell[], dir: Direction, keepTail: boolean) {
  const delta = DELTAS[dir];
  const next: Cell = { x: snake[0]!.x + delta.x, y: snake[0]!.y + delta.y };
  if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS) {
    return null;
  }
  const body = keepTail ? snake : snake.slice(0, -1);
  return body.some((s) => s.x === next.x && s.y === next.y) ? null : next;
}

function cellOrigin(c: Cell): Point {
  return { x: FRAME + c.x * CELL, y: FRAME + c.y * CELL };
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

// Polyline of cell origins (top-left corners) from head to tail. Every pair of
// consecutive points is axis-aligned, so runs can be filled as rectangles.
function snakePoints(
  prev: Cell[],
  curr: Cell[],
  t: number,
  grew: boolean,
  bonk: Point,
): Point[] {
  const k = clamp01(t);
  const between = (a: Cell, b: Cell): Point => {
    const pa = cellOrigin(a);
    const pb = cellOrigin(b);
    return {
      x: Math.round(pa.x + (pb.x - pa.x) * k),
      y: Math.round(pa.y + (pb.y - pa.y) * k),
    };
  };

  const head = between(prev[0] ?? curr[0]!, curr[0]!);
  const points: Point[] = [];
  if (bonk.x !== 0 || bonk.y !== 0) {
    points.push({ x: head.x + bonk.x, y: head.y + bonk.y });
  }
  points.push(head);
  for (let i = 1; i < curr.length - 1; i++) points.push(cellOrigin(curr[i]!));
  const currTail = curr[curr.length - 1]!;
  points.push(cellOrigin(currTail));
  if (!grew) points.push(between(prev[prev.length - 1] ?? currTail, currTail));
  return points;
}

function fillRun(
  ctx: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  inset: number,
  width: number,
) {
  ctx.fillRect(
    Math.min(a.x, b.x) + inset,
    Math.min(a.y, b.y) + inset,
    Math.abs(b.x - a.x) + width,
    Math.abs(b.y - a.y) + width,
  );
}

// Pixel "circle": a square with stepped corners.
function fillOct(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y, size - 4, size);
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.fillRect(x, y + 2, size, size - 4);
}

// Black hollow center of a 10px node, matching the logo's channels.
function fillHole(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = COLORS.black;
  ctx.fillRect(x + 4, y + 3, 2, 4);
  ctx.fillRect(x + 3, y + 4, 4, 2);
}

function outlineSquare(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  ctx.fillRect(x + 1, y, size - 2, 1);
  ctx.fillRect(x + 1, y + size - 1, size - 2, 1);
  ctx.fillRect(x, y + 1, 1, size - 2);
  ctx.fillRect(x + size - 1, y + 1, 1, size - 2);
}

function drawBoard(ctx: CanvasRenderingContext2D) {
  // Frame: green wire with a black channel, like the panel frame.
  ctx.fillStyle = COLORS.green;
  ctx.fillRect(0, 0, ART_W, ART_H);
  ctx.fillStyle = COLORS.black;
  ctx.fillRect(1, 1, ART_W - 2, ART_H - 2);
  ctx.fillStyle = COLORS.green;
  ctx.fillRect(2, 2, ART_W - 4, ART_H - 4);

  ctx.fillStyle = COLORS.tileA;
  ctx.fillRect(FRAME, FRAME, COLS * CELL, ROWS * CELL);
  ctx.fillStyle = COLORS.tileB;
  for (let row = 0; row < ROWS; row++) {
    for (let col = (row + 1) % 2; col < COLS; col += 2) {
      ctx.fillRect(FRAME + col * CELL, FRAME + row * CELL, CELL, CELL);
    }
  }
}

function addEatFx(sim: Sim, cell: Cell) {
  const o = cellOrigin(cell);
  const cx = o.x + CELL / 2;
  const cy = o.y + CELL / 2;
  // Eight sparks along horizontal, vertical, and 45° axes.
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i;
    const speed = i % 2 === 0 ? 70 : 55;
    sim.particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2,
      color: i % 2 === 0 ? COLORS.amber : COLORS.white,
      life: 0,
      maxLife: 0.26,
    });
  }
  sim.ripples.push({ x: cx, y: cy, life: 0, maxLife: 0.24 });
}

function addCrashFx(sim: Sim, head: Cell, dir: Direction) {
  const d = DELTAS[dir];
  const o = cellOrigin(head);
  const x = o.x + CELL / 2 + d.x * (CELL / 2);
  const y = o.y + CELL / 2 + d.y * (CELL / 2);
  const back = Math.atan2(-d.y, -d.x);
  for (let i = 0; i < 6; i++) {
    const angle = back + (Math.PI / 4) * (i % 3 - 1);
    const speed = 45 + (i >= 3 ? 25 : 0);
    sim.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2,
      color: i % 2 === 0 ? COLORS.white : COLORS.amber,
      life: 0,
      maxLife: 0.3,
    });
  }
}

function createSynth() {
  let ctx: AudioContext | null = null;
  function getCtx() {
    if (typeof window === "undefined") return null;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }

  function tone(
    freq: number,
    endFreq: number,
    duration: number,
    gainPeak: number,
    delay = 0,
  ) {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  const turnFreq: Record<Direction, number> = {
    up: 330,
    right: 294,
    left: 262,
    down: 220,
  };

  return {
    turn(dir: Direction) {
      tone(turnFreq[dir], turnFreq[dir], 0.025, 0.012);
    },
    eat(combo: number) {
      const base = EAT_SCALE[Math.min(combo, EAT_SCALE.length - 1)]!;
      tone(base, base, 0.05, 0.035);
      tone(base * 1.5, base * 1.5, 0.08, 0.03, 0.05);
    },
    start() {
      tone(392, 392, 0.05, 0.03);
      tone(523.25, 523.25, 0.07, 0.03, 0.05);
    },
    over() {
      tone(220, 110, 0.18, 0.04);
      tone(147, 73, 0.26, 0.035, 0.1);
    },
    win() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tone(f, f, i === 3 ? 0.18 : 0.08, 0.035, i * 0.08),
      );
    },
  };
}

type Synth = ReturnType<typeof createSynth>;

export function SnakeGame({ active = true }: { active?: boolean }) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("ready");
  const [showEndOverlay, setShowEndOverlay] = useState(false);
  const [score, setScore] = useState(0);
  const [scorePopKey, setScorePopKey] = useState(0);
  const [best, setBest] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState<SpeedKey>("normal");
  const [scale, setScale] = useState(2);

  const slotRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const synthRef = useRef<Synth | null>(null);
  const simRef = useRef<Sim>(createSim());
  const phaseRef = useRef<Phase>("ready");
  const mutedRef = useRef(false);
  const speedRef = useRef<SpeedKey>("normal");
  const scaleRef = useRef(2);
  const reduceRef = useRef(false);
  const touchRef = useRef<Point | null>(null);
  const overlayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    reduceRef.current = Boolean(reduceMotion);
  }, [reduceMotion]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    synthRef.current = createSynth();
    try {
      const saved = Number(window.localStorage.getItem(BEST_KEY) ?? "0");
      if (Number.isFinite(saved) && saved > 0) {
        simRef.current.best = saved;
        setBest(saved);
      }
    } catch {
      // Ignore storage errors in private browsing.
    }
    return () => {
      if (overlayTimerRef.current !== null) {
        window.clearTimeout(overlayTimerRef.current);
      }
    };
  }, []);

  // Fit the board to the space left over in the panel. The slot's size never
  // depends on the board's size, so this can't feed back into itself.
  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const update = () => {
      const w = slot.clientWidth;
      const h = slot.clientHeight;
      if (w < 40 || h < 40) return;
      const dpr = window.devicePixelRatio || 1;
      const devicePx = Math.floor(
        Math.min((w * dpr) / ART_W, (h * dpr) / ART_H, MAX_CSS_SCALE * dpr),
      );
      const next = Math.max(1, devicePx) / dpr;
      scaleRef.current = next;
      setScale((prev) => (prev === next ? prev : next));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(slot);
    // Browser zoom changes devicePixelRatio without always resizing the slot.
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const setPhaseBoth = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const clearOverlayTimer = useCallback(() => {
    if (overlayTimerRef.current !== null) {
      window.clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = null;
    }
  }, []);

  const endGame = useCallback(
    (result: "over" | "won", now: number) => {
      const sim = simRef.current;
      sim.endedAt = now;
      sim.graceStart = null;
      sim.queue = [];
      setPhaseBoth(result);
      setShowEndOverlay(false);
      clearOverlayTimer();
      overlayTimerRef.current = window.setTimeout(
        () => {
          overlayTimerRef.current = null;
          if (phaseRef.current === result) setShowEndOverlay(true);
        },
        reduceRef.current ? 0 : END_OVERLAY_DELAY_MS,
      );
      if (!mutedRef.current) {
        if (result === "won") synthRef.current?.win();
        else synthRef.current?.over();
      }
    },
    [clearOverlayTimer, setPhaseBoth],
  );

  const commitStep = useCallback(
    (nextDir: Direction, nextHead: Cell, stepStart: number) => {
      const sim = simRef.current;
      const turned = nextDir !== sim.dir;
      sim.prevSnake = sim.snake;
      sim.snake = sim.pendingGrow
        ? [nextHead, ...sim.snake]
        : [nextHead, ...sim.snake.slice(0, -1)];
      sim.grewThisStep = sim.pendingGrow;
      sim.pendingGrow = false;
      sim.dir = nextDir;
      sim.stepStart = stepStart;
      sim.graceStart = null;
      sim.bonk = { x: 0, y: 0 };
      if (turned && !mutedRef.current) synthRef.current?.turn(nextDir);
    },
    [],
  );

  const startGame = useCallback(
    (initialDirection?: Direction) => {
      clearOverlayTimer();
      const now = performance.now();
      const dir: Direction =
        initialDirection && initialDirection !== "left"
          ? initialDirection
          : "right";

      // Fresh state object: nothing from the previous round can leak in.
      const sim = createSim(simRef.current.best);
      sim.dir = dir;
      sim.graceDir = dir;
      sim.foodSpawnedAt = now;
      sim.stepStart = now;
      sim.lastFrameAt = now;
      const firstHead = canMoveTo(sim.snake, dir, false);
      if (firstHead) {
        sim.prevSnake = sim.snake;
        sim.snake = [firstHead, ...sim.snake.slice(0, -1)];
      }
      simRef.current = sim;
      if (canvasRef.current) canvasRef.current.style.transform = "";

      setScore(0);
      setIsNewBest(false);
      setShowEndOverlay(false);
      setPhaseBoth("playing");
      if (!mutedRef.current) synthRef.current?.start();
    },
    [clearOverlayTimer, setPhaseBoth],
  );

  const pauseGame = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    simRef.current.pausedAt = performance.now();
    setPhaseBoth("paused");
  }, [setPhaseBoth]);

  const resumeGame = useCallback(() => {
    if (phaseRef.current !== "paused") return;
    const sim = simRef.current;
    const now = performance.now();
    // Shift every running clock by the time spent paused (including a pending
    // crash grace window, which previously expired instantly on resume).
    const shift = now - sim.pausedAt;
    sim.stepStart += shift;
    if (sim.graceStart !== null) sim.graceStart += shift;
    sim.lastFrameAt = now;
    setPhaseBoth("playing");
  }, [setPhaseBoth]);

  const togglePause = useCallback(() => {
    if (phaseRef.current === "playing") pauseGame();
    else if (phaseRef.current === "paused") resumeGame();
  }, [pauseGame, resumeGame]);

  const tryRestart = useCallback(() => {
    const ph = phaseRef.current;
    if (ph === "ready") startGame();
    else if (
      (ph === "over" || ph === "won") &&
      performance.now() - simRef.current.endedAt >= RESTART_KEY_LOCK_MS
    ) {
      startGame();
    }
  }, [startGame]);

  const queueDirection = useCallback(
    (next: Direction) => {
      const ph = phaseRef.current;
      const now = performance.now();
      if (ph === "ready") {
        if (next !== "left") startGame(next);
        return;
      }
      if (ph === "over" || ph === "won") {
        // Arrows restart too, after a pause long enough to avoid accidental
        // restarts from the keys still being mashed at the moment of the crash.
        if (
          next !== "left" &&
          now - simRef.current.endedAt >= RESTART_ARROW_LOCK_MS
        ) {
          startGame(next);
        }
        return;
      }
      if (ph === "paused") resumeGame();

      const sim = simRef.current;
      // Late-turn rescue while the head is pressed against an obstacle.
      if (
        sim.graceStart !== null &&
        next !== sim.dir &&
        next !== OPPOSITE[sim.dir]
      ) {
        const safe = canMoveTo(sim.snake, next, sim.pendingGrow);
        if (safe) {
          sim.queue = [];
          commitStep(next, safe, now);
          return;
        }
      }

      const queue = sim.queue;
      const last = queue[queue.length - 1] ?? sim.dir;
      if (next === last || next === OPPOSITE[last]) return;
      if (queue.length < 2) queue.push(next);
      else queue[1] = next;
    },
    [commitStep, resumeGame, startGame],
  );

  // Pause automatically if the game panel undocks (e.g. navigating back home).
  useEffect(() => {
    if (!active) pauseGame();
  }, [active, pauseGame]);

  // Auto-pause when the browser tab is hidden so players never return to a crash.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) pauseGame();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [pauseGame]);

  // Keyboard controls (Arrows, WASD, Space/P/Enter).
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const dir = KEY_DIRS[event.key];
      if (dir) {
        event.preventDefault();
        queueDirection(dir);
        return;
      }

      const key = event.key;
      const onInteractive =
        target !== null &&
        (target.tagName === "BUTTON" || target.tagName === "A");
      const isSpace = key === " " && !onInteractive;
      const isP = key === "p" || key === "P";
      const isEnter = key === "Enter" && !onInteractive;
      if (!isSpace && !isP && !isEnter) return;

      event.preventDefault();
      // Holding a key must not flicker pause on and off or chain restarts.
      if (event.repeat) return;

      const ph = phaseRef.current;
      if (ph === "playing" || ph === "paused") {
        if (isSpace || isP) togglePause();
      } else if (isSpace || isEnter) {
        tryRestart();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, queueDirection, togglePause, tryRestart]);

  // Simulation + render loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let rafId = 0;
    let running = true;

    const crash = (now: number) => {
      const sim = simRef.current;
      const d = DELTAS[sim.graceDir];
      sim.bonk = { x: d.x * 2, y: d.y * 2 };
      if (!reduceRef.current) {
        sim.shake = { dx: d.x, dy: d.y, start: now };
        addCrashFx(sim, sim.snake[0]!, sim.graceDir);
      }
      endGame("over", now);
    };

    const simulate = (now: number) => {
      const sim = simRef.current;
      const interval = SPEEDS[speedRef.current].ms;

      if (sim.graceStart !== null) {
        const elapsed = now - sim.graceStart;
        const d = DELTAS[sim.graceDir];
        const nudge = elapsed > GRACE_MS / 2 ? 1 : 0;
        sim.bonk = { x: d.x * nudge, y: d.y * nudge };

        while (sim.queue.length > 0) {
          const candidate = sim.queue.shift()!;
          if (candidate === OPPOSITE[sim.dir]) continue;
          const safe = canMoveTo(sim.snake, candidate, sim.pendingGrow);
          if (safe) {
            commitStep(candidate, safe, now);
            return;
          }
        }
        if (elapsed >= GRACE_MS) crash(now);
        return;
      }

      const elapsed = now - sim.stepStart;
      if (elapsed < interval) return;

      // The head has fully arrived in its cell: eat on arrival.
      const head = sim.snake[0]!;
      if (head.x === sim.food.x && head.y === sim.food.y) {
        const nextScore = sim.score + 1;
        sim.score = nextScore;
        setScore(nextScore);
        setScorePopKey((k) => k + 1);
        sim.combo =
          now - sim.lastEatAt < 2300
            ? Math.min(sim.combo + 1, EAT_SCALE.length - 1)
            : 0;
        sim.lastEatAt = now;
        sim.eatFlashUntil = now + 100;
        if (!reduceRef.current) addEatFx(sim, head);
        if (!mutedRef.current) synthRef.current?.eat(sim.combo);

        if (nextScore > sim.best) {
          sim.best = nextScore;
          setBest(nextScore);
          setIsNewBest(true);
          try {
            window.localStorage.setItem(BEST_KEY, String(nextScore));
          } catch {
            // Ignore storage errors.
          }
        }

        sim.pendingGrow = true;
        const nextFood = spawnFood(sim.snake);
        if (!nextFood) {
          endGame("won", now);
          return;
        }
        sim.food = nextFood;
        sim.foodSpawnedAt = now;
      }

      let nextDir = sim.dir;
      while (sim.queue.length > 0) {
        const candidate = sim.queue.shift()!;
        if (candidate !== OPPOSITE[sim.dir]) {
          nextDir = candidate;
          break;
        }
      }

      const nextHead = canMoveTo(sim.snake, nextDir, sim.pendingGrow);
      if (nextHead) {
        const carry = Math.min(elapsed - interval, interval * 0.45);
        commitStep(nextDir, nextHead, now - carry);
      } else {
        // Brief grace window for a last-moment turn before crashing.
        sim.graceStart = now;
        sim.graceDir = nextDir;
      }
    };

    const updateFx = (dt: number) => {
      const sim = simRef.current;
      for (let i = sim.particles.length - 1; i >= 0; i--) {
        const p = sim.particles[i]!;
        p.life += dt;
        if (p.life >= p.maxLife) {
          sim.particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const drag = Math.exp(-dt * 6);
        p.vx *= drag;
        p.vy *= drag;
      }
      for (let i = sim.ripples.length - 1; i >= 0; i--) {
        const r = sim.ripples[i]!;
        r.life += dt;
        if (r.life >= r.maxLife) sim.ripples.splice(i, 1);
      }
    };

    const draw = (now: number) => {
      const sim = simRef.current;
      const ph = phaseRef.current;
      const reduce = reduceRef.current;
      const interval = SPEEDS[speedRef.current].ms;

      drawBoard(ctx);

      let t = 1;
      if (!reduce && sim.graceStart === null) {
        if (ph === "playing") t = (now - sim.stepStart) / interval;
        else if (ph === "paused") t = (sim.pausedAt - sim.stepStart) / interval;
      }

      // Eat ripple.
      for (const r of sim.ripples) {
        const u = r.life / r.maxLife;
        const radius = Math.round(6 + u * 8);
        ctx.fillStyle = u < 0.5 ? COLORS.amber : COLORS.amberDim;
        outlineSquare(ctx, r.x - radius, r.y - radius, radius * 2);
      }

      // Food: amber hollow node that pops in, then blinks.
      if (ph !== "won") {
        const o = cellOrigin(sim.food);
        const age = reduce ? Infinity : now - sim.foodSpawnedAt;
        if (age < 60) {
          ctx.fillStyle = COLORS.amber;
          ctx.fillRect(o.x + 3, o.y + 3, 4, 4);
        } else if (age < 120) {
          fillOct(ctx, o.x + 2, o.y + 2, 6, COLORS.amber);
        } else {
          const blink =
            !reduce &&
            (ph === "playing" || ph === "ready") &&
            Math.floor(now / 300) % 2 === 0;
          if (blink) fillOct(ctx, o.x - 1, o.y - 1, CELL + 2, COLORS.amberGlow);
          fillOct(ctx, o.x, o.y, CELL, COLORS.amber);
          fillHole(ctx, o.x, o.y);
        }
      }

      // Snake: green trace with a black channel, white head node, green tail node.
      const pts = snakePoints(
        sim.prevSnake,
        sim.snake,
        t,
        sim.grewThisStep,
        sim.bonk,
      );
      const sinceEnd = now - sim.endedAt;
      const dim =
        ph === "over" &&
        !reduce &&
        sinceEnd < CRASH_BLINK_MS &&
        Math.floor(sinceEnd / 100) % 2 === 0;
      const body = dim ? COLORS.greenDim : COLORS.green;
      const head = pts[0]!;
      const tail = pts[pts.length - 1]!;

      ctx.fillStyle = body;
      for (let i = 0; i < pts.length - 1; i++) {
        fillRun(ctx, pts[i]!, pts[i + 1]!, WIRE_INSET, WIRE);
      }
      fillOct(ctx, tail.x, tail.y, CELL, body);
      fillOct(
        ctx,
        head.x,
        head.y,
        CELL,
        ph === "over" || now < sim.eatFlashUntil ? COLORS.amber : COLORS.white,
      );
      ctx.fillStyle = COLORS.black;
      for (let i = 0; i < pts.length - 1; i++) {
        fillRun(ctx, pts[i]!, pts[i + 1]!, CHANNEL_INSET, CHANNEL);
      }
      fillHole(ctx, tail.x, tail.y);
      fillHole(ctx, head.x, head.y);

      // Sparks.
      for (const p of sim.particles) {
        const u = p.life / p.maxLife;
        const size = u < 0.6 ? p.size : 1;
        ctx.fillStyle = u < 0.5 ? p.color : COLORS.amberDim;
        ctx.fillRect(
          Math.round(p.x - size / 2),
          Math.round(p.y - size / 2),
          size,
          size,
        );
      }

      // Crash shake in whole art pixels.
      if (sim.shake) {
        const steps = [2, -1, 1];
        const step = steps[Math.floor((now - sim.shake.start) / 50)];
        if (step === undefined) {
          sim.shake = null;
          canvas.style.transform = "";
        } else {
          const m = step * scaleRef.current;
          canvas.style.transform = `translate(${sim.shake.dx * m}px, ${sim.shake.dy * m}px)`;
        }
      }
    };

    const shouldContinue = (now: number) => {
      const sim = simRef.current;
      const ph = phaseRef.current;
      if (ph === "playing") return true;
      if (reduceRef.current) return false;
      if (ph === "ready") return true;
      if (sim.particles.length > 0 || sim.ripples.length > 0 || sim.shake) {
        return true;
      }
      return ph === "over" && now - sim.endedAt < CRASH_BLINK_MS + 50;
    };

    const frame = (now: number) => {
      if (!running) return;
      const sim = simRef.current;
      const dt = Math.min(
        0.05,
        Math.max(0, (now - (sim.lastFrameAt || now)) / 1000),
      );
      sim.lastFrameAt = now;
      if (phaseRef.current === "playing") simulate(now);
      updateFx(dt);
      draw(now);
      if (running && shouldContinue(now)) {
        rafId = requestAnimationFrame(frame);
      }
    };

    frame(performance.now());
    return () => {
      running = false;
      cancelAnimationFrame(rafId);
    };
  }, [phase, reduceMotion, commitStep, endGame]);

  const cycleSpeed = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (event.detail > 0) event.currentTarget.blur();
    const curr = speedRef.current;
    const next = SPEED_ORDER[(SPEED_ORDER.indexOf(curr) + 1) % SPEED_ORDER.length]!;
    const sim = simRef.current;
    // Keep the current step's progress so the snake doesn't jump.
    if (phaseRef.current === "playing" || phaseRef.current === "paused") {
      const ref =
        phaseRef.current === "paused" ? sim.pausedAt : performance.now();
      const progress = clamp01((ref - sim.stepStart) / SPEEDS[curr].ms);
      sim.stepStart = ref - progress * SPEEDS[next].ms;
    }
    speedRef.current = next;
    setSpeed(next);
  };

  const pressDirection = (dir: Direction) => ({
    onPointerDown: (event: React.PointerEvent) => {
      event.preventDefault();
      queueDirection(dir);
    },
    onClick: (event: ReactMouseEvent) => {
      // Keyboard activation only; pointers are handled on press.
      if (event.detail === 0) queueDirection(dir);
    },
  });

  const stageW = ART_W * scale;
  const stageH = ART_H * scale;
  const canPause = phase === "playing" || phase === "paused";

  return (
    <div
      className="snake-game"
      style={
        { "--stage-w": `${stageW}px`, "--px": `${scale}px` } as CSSProperties
      }
    >
      <div className="snake-hud">
        <div className="snake-hud-stats">
          <div className="snake-stat" aria-label={`Score ${score}`}>
            <span className="snake-stat-label">SCORE</span>
            <span
              key={scorePopKey}
              className={
                "snake-stat-digits" + (score > 0 ? " snake-stat-pop" : "")
              }
            >
              <SegmentDigits value={String(score).padStart(3, "0")} height={22} />
            </span>
          </div>
          <div className="snake-stat" aria-label={`Best score ${best}`}>
            <span className="snake-stat-label">BEST</span>
            <span className="snake-stat-digits">
              <SegmentDigits value={String(best).padStart(3, "0")} height={22} />
            </span>
          </div>
        </div>
        <div className="snake-hud-actions">
          <button
            type="button"
            className="snake-tool-btn"
            aria-label={`Speed: ${SPEEDS[speed].label}`}
            title="Change speed"
            onClick={cycleSpeed}
          >
            {SPEEDS[speed].label}
          </button>
          <button
            type="button"
            className="snake-tool-btn"
            disabled={!canPause}
            onClick={(event) => {
              if (event.detail > 0) event.currentTarget.blur();
              togglePause();
            }}
          >
            {phase === "paused" ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            className="snake-tool-btn"
            aria-pressed={!muted}
            onClick={(event) => {
              if (event.detail > 0) event.currentTarget.blur();
              setMuted((m) => !m);
            }}
          >
            Sound
          </button>
        </div>
      </div>

      <div ref={slotRef} className="snake-stage-slot">
        <div
          className="snake-stage"
          style={{ width: stageW, height: stageH }}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            if (touch) touchRef.current = { x: touch.clientX, y: touch.clientY };
          }}
          onTouchMove={(event) => {
            const anchor = touchRef.current;
            const touch = event.touches[0];
            if (!anchor || !touch) return;
            const dx = touch.clientX - anchor.x;
            const dy = touch.clientY - anchor.y;
            if (Math.hypot(dx, dy) < 18) return;
            if (Math.abs(dx) > Math.abs(dy)) {
              queueDirection(dx > 0 ? "right" : "left");
            } else {
              queueDirection(dy > 0 ? "down" : "up");
            }
            // Re-anchor so one continuous drag can chain turns.
            touchRef.current = { x: touch.clientX, y: touch.clientY };
          }}
          onTouchEnd={() => {
            touchRef.current = null;
          }}
        >
          <canvas
            ref={canvasRef}
            width={ART_W}
            height={ART_H}
            role="img"
            aria-label={`Snake board. Score ${score}.`}
            className="snake-canvas"
          />

          {phase === "ready" && (
            <div className="snake-overlay" role="status">
              <div className="snake-overlay-card">
                <p className="snake-overlay-title">Snake</p>
                <p className="snake-overlay-sub">
                  Press an arrow key or swipe to start.
                </p>
                <button
                  type="button"
                  className="pixel-action"
                  onClick={() => startGame()}
                >
                  Play
                </button>
              </div>
            </div>
          )}

          {phase === "paused" && (
            <div className="snake-overlay" role="status">
              <div className="snake-overlay-card">
                <p className="snake-overlay-title">Paused</p>
                <button
                  type="button"
                  className="pixel-action"
                  onClick={resumeGame}
                >
                  Resume
                </button>
              </div>
            </div>
          )}

          {(phase === "over" || phase === "won") && showEndOverlay && (
            <div className="snake-overlay" role="status">
              <div className="snake-overlay-card">
                <p className="snake-overlay-title">
                  {phase === "won" ? "Board complete!" : "Short circuit"}
                </p>
                <p className="snake-overlay-sub">
                  Score {score}
                  {isNewBest && score > 0 && (
                    <span className="snake-overlay-badge"> · New best!</span>
                  )}
                </p>
                <button
                  type="button"
                  className="pixel-action"
                  onClick={() => startGame()}
                >
                  Play again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="snake-footer">
        <p className="snake-hint">Arrows / WASD to steer · Space to pause</p>
        <div className="snake-dpad" role="group" aria-label="Direction pad">
          <button
            type="button"
            className="snake-dpad-up"
            aria-label="Move up"
            {...pressDirection("up")}
          >
            ▲
          </button>
          <button
            type="button"
            className="snake-dpad-left"
            aria-label="Move left"
            {...pressDirection("left")}
          >
            ◀
          </button>
          <button
            type="button"
            className="snake-dpad-down"
            aria-label="Move down"
            {...pressDirection("down")}
          >
            ▼
          </button>
          <button
            type="button"
            className="snake-dpad-right"
            aria-label="Move right"
            {...pressDirection("right")}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}
