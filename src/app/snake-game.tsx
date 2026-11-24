"use client";

import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { SegmentDigits } from "./segment-labels";

type Cell = { x: number; y: number };
type Direction = "up" | "down" | "left" | "right";
type Phase = "ready" | "playing" | "paused" | "over" | "won";

const COLS = 16;
const ROWS = 12;
const CELL = 28;
const BOARD_W = COLS * CELL;
const BOARD_H = ROWS * CELL;
const WIRE_W = 16;
const INNER_W = WIRE_W / 2;
const NODE_OUTER_R = 11.5;
const NODE_INNER_R = NODE_OUTER_R - (WIRE_W - INNER_W) / 2;
const FOOD_OUTER_R = 9.5;
const FOOD_INNER_R = 5.5;
const BEST_KEY = "bitbeans-snake-best";

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

function initialSnake(): Cell[] {
  const cy = Math.floor(ROWS / 2);
  const cx = Math.floor(COLS / 2) - 1;
  return [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ];
}

function initialFood(): Cell {
  return { x: Math.floor(COLS / 2) + 4, y: Math.floor(ROWS / 2) };
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

function cellCenter(c: Cell) {
  return { x: c.x * CELL + CELL / 2, y: c.y * CELL + CELL / 2 };
}

function tickDurationMs(score: number) {
  return Math.max(82, 148 - score * 2.4);
}

function buildSnakeGeometry(
  prev: Cell[],
  curr: Cell[],
  t: number,
  grew: boolean,
) {
  const clamped = Math.max(0, Math.min(1, t));
  const points: { x: number; y: number }[] = [];

  const currHead = cellCenter(curr[0]!);
  const prevHead = cellCenter(prev[0] ?? curr[0]!);
  const head = {
    x: prevHead.x + (currHead.x - prevHead.x) * clamped,
    y: prevHead.y + (currHead.y - prevHead.y) * clamped,
  };
  points.push(head);

  // Include intermediate grid vertices so every bend stays sharp at 90 degrees.
  for (let i = 1; i < curr.length - 1; i++) {
    points.push(cellCenter(curr[i]!));
  }

  const currTail = cellCenter(curr[curr.length - 1]!);
  const prevTail = cellCenter(prev[prev.length - 1] ?? curr[curr.length - 1]!);
  const tail = grew
    ? currTail
    : {
        x: prevTail.x + (currTail.x - prevTail.x) * clamped,
        y: prevTail.y + (currTail.y - prevTail.y) * clamped,
      };

  // If moving around a corner, keep the penultimate cell before the tail so
  // the tail smoothly retracts around the corner instead of cutting diagonally.
  if (!grew && clamped < 1 && curr.length >= 2) {
    const prevLast = prev[prev.length - 1]!;
    const currLast = curr[curr.length - 1]!;
    if (prevLast.x !== currLast.x || prevLast.y !== currLast.y) {
      points.push(currTail);
    }
  }
  points.push(tail);

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");

  return { d, head, tail };
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
    duration: number,
    type: OscillatorType,
    gainPeak: number,
    delay = 0,
  ) {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  return {
    eat() {
      tone(523.25, 0.075, "triangle", 0.07, 0);
      tone(783.99, 0.1, "triangle", 0.07, 0.055);
    },
    start() {
      tone(392, 0.06, "triangle", 0.05, 0);
      tone(523.25, 0.08, "triangle", 0.05, 0.05);
    },
    over() {
      tone(220, 0.13, "sawtooth", 0.05, 0);
      tone(146.83, 0.22, "sawtooth", 0.05, 0.11);
    },
    win() {
      tone(523.25, 0.08, "triangle", 0.07, 0);
      tone(659.25, 0.08, "triangle", 0.07, 0.08);
      tone(783.99, 0.14, "triangle", 0.07, 0.16);
    },
  };
}

export function SnakeGame() {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [muted, setMuted] = useState(false);
  const [food, setFood] = useState<Cell>(initialFood);

  // Mutable simulation state kept in refs for smooth 60fps SVG updates.
  const snakeRef = useRef<Cell[]>(initialSnake());
  const prevSnakeRef = useRef<Cell[]>(initialSnake());
  const foodRef = useRef<Cell>(initialFood());
  const dirRef = useRef<Direction>("right");
  const queueRef = useRef<Direction[]>([]);
  const grewRef = useRef(false);
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const phaseRef = useRef<Phase>("ready");
  const mutedRef = useRef(false);
  const lastTickRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const synthRef = useRef<ReturnType<typeof createSynth> | null>(null);

  // Direct SVG element refs for zero-React-render frame interpolation.
  const outerPathRef = useRef<SVGPathElement>(null);
  const innerPathRef = useRef<SVGPathElement>(null);
  const headOuterRef = useRef<SVGCircleElement>(null);
  const headInnerRef = useRef<SVGCircleElement>(null);
  const tailOuterRef = useRef<SVGCircleElement>(null);
  const tailInnerRef = useRef<SVGCircleElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    synthRef.current = createSynth();
    try {
      const saved = Number(window.localStorage.getItem(BEST_KEY) ?? "0");
      if (Number.isFinite(saved) && saved > 0) {
        bestRef.current = saved;
        setBest(saved);
      }
    } catch {
      // Ignore storage access errors in private browsing.
    }
  }, []);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const paintSnake = useCallback((t: number) => {
    const { d, head, tail } = buildSnakeGeometry(
      prevSnakeRef.current,
      snakeRef.current,
      t,
      grewRef.current,
    );
    outerPathRef.current?.setAttribute("d", d);
    innerPathRef.current?.setAttribute("d", d);
    headOuterRef.current?.setAttribute("cx", head.x.toFixed(2));
    headOuterRef.current?.setAttribute("cy", head.y.toFixed(2));
    headInnerRef.current?.setAttribute("cx", head.x.toFixed(2));
    headInnerRef.current?.setAttribute("cy", head.y.toFixed(2));
    tailOuterRef.current?.setAttribute("cx", tail.x.toFixed(2));
    tailOuterRef.current?.setAttribute("cy", tail.y.toFixed(2));
    tailInnerRef.current?.setAttribute("cx", tail.x.toFixed(2));
    tailInnerRef.current?.setAttribute("cy", tail.y.toFixed(2));
  }, []);

  // Paint initial snake position on mount.
  useEffect(() => {
    paintSnake(1);
  }, [paintSnake]);

  const startGame = useCallback(
    (initialDirection?: Direction) => {
      const fresh = initialSnake();
      const startFood = initialFood();
      snakeRef.current = fresh;
      prevSnakeRef.current = fresh;
      foodRef.current = startFood;
      dirRef.current =
        initialDirection && initialDirection !== "left"
          ? initialDirection
          : "right";
      queueRef.current = [];
      grewRef.current = false;
      scoreRef.current = 0;
      phaseRef.current = "playing";
      lastTickRef.current = performance.now();

      setFood(startFood);
      setScore(0);
      setIsNewBest(false);
      setPhase("playing");
      paintSnake(1);
      if (!mutedRef.current) synthRef.current?.start();
    },
    [paintSnake],
  );

  const togglePause = useCallback(() => {
    if (phaseRef.current === "playing") {
      phaseRef.current = "paused";
      setPhase("paused");
    } else if (phaseRef.current === "paused") {
      phaseRef.current = "playing";
      lastTickRef.current = performance.now();
      setPhase("playing");
    }
  }, []);

  const queueDirection = useCallback(
    (next: Direction) => {
      if (phaseRef.current === "ready") {
        startGame(next);
        return;
      }
      if (phaseRef.current === "paused") {
        phaseRef.current = "playing";
        lastTickRef.current = performance.now();
        setPhase("playing");
      }
      if (phaseRef.current !== "playing") return;

      const queue = queueRef.current;
      const lastPlanned = queue[queue.length - 1] ?? dirRef.current;
      if (next === lastPlanned || next === OPPOSITE[lastPlanned]) return;
      if (queue.length < 2) {
        queue.push(next);
      } else {
        queue[1] = next;
      }
    },
    [startGame],
  );

  // Main animation and simulation loop.
  useEffect(() => {
    if (phase !== "playing") return;

    let rafId = 0;
    const step = (now: number) => {
      if (phaseRef.current !== "playing") return;

      const interval = tickDurationMs(scoreRef.current);
      const elapsed = now - lastTickRef.current;

      if (elapsed >= interval) {
        lastTickRef.current = now - (elapsed % interval);
        const curr = snakeRef.current;
        const nextDir = queueRef.current.shift() ?? dirRef.current;
        dirRef.current = nextDir;

        const delta = DELTAS[nextDir];
        const nextHead: Cell = {
          x: curr[0]!.x + delta.x,
          y: curr[0]!.y + delta.y,
        };

        const ate =
          nextHead.x === foodRef.current.x && nextHead.y === foodRef.current.y;

        // Tail vacates its cell unless the snake grows this tick.
        const bodyToCheck = ate ? curr : curr.slice(0, -1);
        const hitWall =
          nextHead.x < 0 ||
          nextHead.x >= COLS ||
          nextHead.y < 0 ||
          nextHead.y >= ROWS;
        const hitSelf = bodyToCheck.some(
          (segment) => segment.x === nextHead.x && segment.y === nextHead.y,
        );

        if (hitWall || hitSelf) {
          phaseRef.current = "over";
          setPhase("over");
          paintSnake(1);
          if (!mutedRef.current) synthRef.current?.over();
          return;
        }

        prevSnakeRef.current = curr;
        const nextSnake = ate
          ? [nextHead, ...curr]
          : [nextHead, ...curr.slice(0, -1)];
        snakeRef.current = nextSnake;
        grewRef.current = ate;

        if (ate) {
          const nextScore = scoreRef.current + 1;
          scoreRef.current = nextScore;
          setScore(nextScore);

          if (nextScore > bestRef.current) {
            bestRef.current = nextScore;
            setBest(nextScore);
            setIsNewBest(true);
            try {
              window.localStorage.setItem(BEST_KEY, String(nextScore));
            } catch {
              // Ignore storage errors.
            }
          }

          const nextFood = spawnFood(nextSnake);
          if (!nextFood) {
            phaseRef.current = "won";
            setPhase("won");
            paintSnake(1);
            if (!mutedRef.current) synthRef.current?.win();
            return;
          }
          foodRef.current = nextFood;
          setFood(nextFood);
          if (!mutedRef.current) synthRef.current?.eat();
        }
      }

      const progress = reduceMotion
        ? 1
        : (now - lastTickRef.current) / tickDurationMs(scoreRef.current);
      paintSnake(progress);
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [phase, reduceMotion, paintSnake]);

  // Keyboard controls (Arrows, WASD, Space/P/Enter).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      )
        return;

      const key = event.key;
      let dir: Direction | null = null;
      if (key === "ArrowUp" || key === "w" || key === "W") dir = "up";
      else if (key === "ArrowDown" || key === "s" || key === "S") dir = "down";
      else if (key === "ArrowLeft" || key === "a" || key === "A") dir = "left";
      else if (key === "ArrowRight" || key === "d" || key === "D")
        dir = "right";

      if (dir) {
        event.preventDefault();
        queueDirection(dir);
        return;
      }

      const onInteractive =
        target !== null &&
        (target.tagName === "BUTTON" || target.tagName === "A");

      if (key === "p" || key === "P" || (key === " " && !onInteractive)) {
        if (phaseRef.current === "playing" || phaseRef.current === "paused") {
          event.preventDefault();
          togglePause();
        } else if (
          key === " " &&
          (phaseRef.current === "ready" ||
            phaseRef.current === "over" ||
            phaseRef.current === "won")
        ) {
          event.preventDefault();
          startGame();
        }
      } else if (
        key === "Enter" &&
        !onInteractive &&
        (phaseRef.current === "ready" ||
          phaseRef.current === "over" ||
          phaseRef.current === "won")
      ) {
        event.preventDefault();
        startGame();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [queueDirection, startGame, togglePause]);

  const foodCenter = cellCenter(food);
  const formattedScore = String(score).padStart(3, "0");
  const formattedBest = String(best).padStart(3, "0");
  const crashed = phase === "over";

  return (
    <div className="snake-game">
      <div className="snake-hud">
        <div className="snake-stat" aria-label={`Score ${score}`}>
          <span className="snake-stat-label">SCORE</span>
          <SegmentDigits value={formattedScore} height={24} />
        </div>
        <div className="snake-stat" aria-label={`Best score ${best}`}>
          <span className="snake-stat-label">BEST</span>
          <SegmentDigits value={formattedBest} height={24} />
        </div>
        <div className="snake-hud-actions">
          {(phase === "playing" || phase === "paused") && (
            <button
              type="button"
              className="snake-tool-btn"
              onClick={togglePause}
            >
              {phase === "paused" ? "Resume" : "Pause"}
            </button>
          )}
          <button
            type="button"
            className="snake-tool-btn"
            aria-pressed={!muted}
            onClick={() => setMuted((m) => !m)}
          >
            {muted ? "Sound: Off" : "Sound: On"}
          </button>
        </div>
      </div>

      <div
        ref={boardRef}
        className="snake-stage"
        onTouchStart={(event) => {
          const touch = event.touches[0];
          if (touch)
            touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          const start = touchStartRef.current;
          const touch = event.changedTouches[0];
          touchStartRef.current = null;
          if (!start || !touch) return;
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          if (Math.hypot(dx, dy) < 22) return;
          if (Math.abs(dx) > Math.abs(dy)) {
            queueDirection(dx > 0 ? "right" : "left");
          } else {
            queueDirection(dy > 0 ? "down" : "up");
          }
        }}
      >
        <svg
          role="img"
          aria-label={`Circuit Snake board. Score ${score}.`}
          viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
          className="snake-svg"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width={BOARD_W} height={BOARD_H} fill="#040806" />

          {/* Subtle PCB grid vias */}
          <g fill="#1d3044" opacity="0.65">
            {Array.from({ length: ROWS }, (_, row) =>
              Array.from({ length: COLS }, (_, col) => (
                <circle
                  key={`${col}-${row}`}
                  cx={col * CELL + CELL / 2}
                  cy={row * CELL + CELL / 2}
                  r={1.35}
                />
              )),
            )}
          </g>

          {/* Food target node (amber hollow ring matching 7-segment accent) */}
          <g className={reduceMotion ? undefined : "snake-food-pulse"}>
            <circle
              cx={foodCenter.x}
              cy={foodCenter.y}
              r={FOOD_OUTER_R + 3.5}
              stroke="#ffbc42"
              strokeWidth={1.25}
              opacity="0.32"
            />
            <circle
              cx={foodCenter.x}
              cy={foodCenter.y}
              r={FOOD_OUTER_R}
              fill="#ffbc42"
            />
            <circle
              cx={foodCenter.x}
              cy={foodCenter.y}
              r={FOOD_INNER_R}
              fill="#040806"
            />
          </g>

          {/* Snake styled identically to BitBeans logo lines & hollow end nodes */}
          <g>
            {/* Outer green trace body */}
            <path
              ref={outerPathRef}
              stroke="#2bbc7d"
              strokeWidth={WIRE_W}
              d=""
            />
            {/* Tail node (green hollow logo node) */}
            <circle
              ref={tailOuterRef}
              r={NODE_OUTER_R}
              fill="#2bbc7d"
              cx={0}
              cy={0}
            />
            {/* Head node (white logo node, flashes amber on crash) */}
            <circle
              ref={headOuterRef}
              r={NODE_OUTER_R}
              fill={crashed ? "#ffbc42" : "#ffffff"}
              cx={0}
              cy={0}
            />
            {/* Inner black channels drawn OVER node outlines so channels connect */}
            <circle
              ref={tailInnerRef}
              r={NODE_INNER_R}
              fill="#040806"
              cx={0}
              cy={0}
            />
            <circle
              ref={headInnerRef}
              r={NODE_INNER_R}
              fill="#040806"
              cx={0}
              cy={0}
            />
            <path
              ref={innerPathRef}
              stroke="#040806"
              strokeWidth={INNER_W}
              d=""
            />
          </g>
        </svg>

        {phase !== "playing" && (
          <div className="snake-overlay" role="status">
            {phase === "ready" && (
              <>
                <p className="snake-overlay-title">Circuit Snake</p>
                <p className="snake-overlay-sub">
                  Route the signal to each amber node. Arrow keys, WASD, or
                  swipe.
                </p>
                <button
                  type="button"
                  className="pixel-action"
                  onClick={() => startGame()}
                >
                  Start game
                </button>
              </>
            )}
            {phase === "paused" && (
              <>
                <p className="snake-overlay-title">Paused</p>
                <button
                  type="button"
                  className="pixel-action"
                  onClick={togglePause}
                >
                  Resume
                </button>
              </>
            )}
            {(phase === "over" || phase === "won") && (
              <>
                <p className="snake-overlay-title">
                  {phase === "won" ? "Board complete!" : "Short circuit"}
                </p>
                <p className="snake-overlay-sub">
                  Score {score}
                  {isNewBest && score > 0 ? " · New best!" : ""}
                </p>
                <button
                  type="button"
                  className="pixel-action"
                  onClick={() => startGame()}
                >
                  Play again
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Compact touch/click D-pad for mobile & pointer play */}
      <div className="snake-controls-row">
        <p className="snake-hint">
          Arrow keys / WASD to steer · Space to pause
        </p>
        <div className="snake-dpad" role="group" aria-label="Direction pad">
          <button
            type="button"
            className="snake-dpad-up"
            aria-label="Move up"
            onClick={() => queueDirection("up")}
          >
            ▲
          </button>
          <button
            type="button"
            className="snake-dpad-left"
            aria-label="Move left"
            onClick={() => queueDirection("left")}
          >
            ◀
          </button>
          <button
            type="button"
            className="snake-dpad-down"
            aria-label="Move down"
            onClick={() => queueDirection("down")}
          >
            ▼
          </button>
          <button
            type="button"
            className="snake-dpad-right"
            aria-label="Move right"
            onClick={() => queueDirection("right")}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}
