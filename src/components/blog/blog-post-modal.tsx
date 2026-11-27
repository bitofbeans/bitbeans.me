"use client";

import { motion, useReducedMotionConfig } from "framer-motion";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { BlogBlock, BlogPost, InlineToken } from "~/lib/blog-types";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function ordinalDay(day: number) {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

function formatOrdinalDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return iso;
  const year = Number(match[1]);
  const month = months[Number(match[2]) - 1];
  const day = Number(match[3]);
  if (!month || !day) return iso;
  return `${month} ${ordinalDay(day)}, ${year}`;
}

function renderInline(tokens: readonly InlineToken[]) {
  return tokens.map((token, i) => {
    switch (token.type) {
      case "text":
        return <Fragment key={i}>{token.text}</Fragment>;
      case "bold":
        return <strong key={i}>{token.text}</strong>;
      case "italic":
        return <em key={i}>{token.text}</em>;
      case "code":
        return <code key={i}>{token.text}</code>;
      case "link": {
        const external =
          token.href.startsWith("http://") || token.href.startsWith("https://");
        return (
          <a
            key={i}
            href={token.href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
          >
            {token.text}
            {external ? " ↗" : ""}
          </a>
        );
      }
    }
  });
}

function renderBlock(block: BlogBlock, index: number) {
  switch (block.type) {
    case "heading":
      return block.level === 2 ? (
        <h3 key={index}>{renderInline(block.tokens)}</h3>
      ) : (
        <h4 key={index}>{renderInline(block.tokens)}</h4>
      );
    case "paragraph":
      return <p key={index}>{renderInline(block.tokens)}</p>;
    case "blockquote":
      return <blockquote key={index}>{renderInline(block.tokens)}</blockquote>;
    case "list":
      return block.ordered ? (
        <ol key={index}>
          {block.items.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ol>
      ) : (
        <ul key={index}>
          {block.items.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    case "code":
      return (
        <pre key={index}>
          <code>{block.code}</code>
        </pre>
      );
    case "hr":
      return <hr key={index} />;
  }
}

const scanlineBands = [
  { top: 0, bottom: 90, delay: 0.08, duration: 0.26, steps: 5 },
  { top: 10, bottom: 80, delay: 0.04, duration: 0.28, steps: 6 },
  { top: 20, bottom: 70, delay: 0.06, duration: 0.24, steps: 5 },
  { top: 30, bottom: 60, delay: 0.02, duration: 0.26, steps: 6 },
  { top: 40, bottom: 50, delay: 0, duration: 0.24, steps: 5 },
  { top: 50, bottom: 40, delay: 0.015, duration: 0.26, steps: 6 },
  { top: 60, bottom: 30, delay: 0.035, duration: 0.24, steps: 5 },
  { top: 70, bottom: 20, delay: 0.055, duration: 0.28, steps: 6 },
  { top: 80, bottom: 10, delay: 0.03, duration: 0.26, steps: 5 },
  { top: 90, bottom: 0, delay: 0.075, duration: 0.26, steps: 5 },
] as const;

function steppedEase(steps: number) {
  return (t: number) => (t >= 1 ? 1 : Math.floor(t * steps) / steps);
}

const closeWipeDuration = 0.24;
const closeWipeSteps = 6;
const closeTotalMs = Math.ceil(closeWipeDuration * 1000) + 20;

export function BlogPostModal({
  post,
  onClose,
}: {
  post: BlogPost;
  onClose: () => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const closeTimerRef = useRef<number | null>(null);
  const closingRef = useRef(false);
  const [closing, setClosing] = useState(false);
  const reduceMotion = Boolean(useReducedMotionConfig());

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (reduceMotion) {
      onCloseRef.current();
      return;
    }
    setClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      onCloseRef.current();
    }, closeTotalMs);
  }, [reduceMotion]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const main = document.querySelector("main");
    const prevInert = main?.inert ?? false;
    if (main) main.inert = true;
    return () => {
      if (main) main.inert = prevInert;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
      } else if (event.key === "Tab") {
        const frame = frameRef.current;
        if (!frame) return;
        const focusable = Array.from(
          frame.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        const active = document.activeElement;
        if (event.shiftKey) {
          if (active === first || !frame.contains(active)) {
            event.preventDefault();
            last.focus();
          }
        } else if (active === last || !frame.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [requestClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      className="blog-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={post.title}
      style={closing ? { pointerEvents: "none" } : undefined}
      initial={false}
      animate={{
        clipPath: closing ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 0% 0%)",
      }}
      transition={
        closing && !reduceMotion
          ? { duration: closeWipeDuration, ease: steppedEase(closeWipeSteps) }
          : { duration: 0 }
      }
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      {/* Full-screen Geist Pixel Line horizontal stripe bands expanding from center in chunks */}
      {reduceMotion ? (
        <div className="blog-modal-scanlines" aria-hidden="true" />
      ) : (
        scanlineBands.map((band, i) => (
          <motion.div
            key={i}
            className="blog-modal-scanlines"
            aria-hidden="true"
            initial={{ clipPath: `inset(${band.top}% 50% ${band.bottom}% 50%)` }}
            animate={{ clipPath: `inset(${band.top}% 0% ${band.bottom}% 0%)` }}
            transition={{
              delay: band.delay,
              duration: band.duration,
              ease: steppedEase(band.steps),
            }}
          />
        ))
      )}

      {/* Centered blog shell (close button above + solid black box) opening out of the lines after ~0.5s */}
      <motion.div
        ref={frameRef}
        className="blog-modal-shell"
        initial={
          reduceMotion
            ? { opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }
            : { opacity: 0, clipPath: "inset(0% 50% 0% 50%)" }
        }
        animate={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : {
                delay: 0.48,
                duration: 0.22,
                ease: steppedEase(5),
              }
        }
      >
        <button
          ref={closeRef}
          type="button"
          className="blog-modal-close"
          onClick={requestClose}
          aria-label="Close post"
        >
          Close ×
        </button>

        <div className="blog-modal-frame">
          <article className="blog-modal-body">
            <h2>{post.title}</h2>
            {post.date && (
              <time dateTime={post.date} className="blog-modal-date">
                {formatOrdinalDate(post.date)}
              </time>
            )}
            {post.blocks.map((block, i) => renderBlock(block, i))}
          </article>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
