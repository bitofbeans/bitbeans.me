"use client";

import { useEffect, useRef, useState } from "react";
import { BOOKMARKLET_HREF } from "./portfolio-data";

export function BookmarkletLink() {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const copyTimerRef = useRef<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Attach the javascript: href on the DOM node so dragging to the bookmarks
    // bar works without triggering React's javascript: URL warning.
    linkRef.current?.setAttribute("href", BOOKMARKLET_HREF);
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  async function copyBookmarklet() {
    try {
      await navigator.clipboard.writeText(BOOKMARKLET_HREF);
      setCopied(true);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        copyTimerRef.current = null;
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="older-actions">
      <a
        ref={linkRef}
        className="pixel-action"
        draggable
        onClick={(event) => {
          event.preventDefault();
          void copyBookmarklet();
        }}
        title="Drag to your bookmarks bar, or click to copy"
      >
        2048 Bookmarklet
      </a>
      <button
        type="button"
        className="subtle-action"
        onClick={() => void copyBookmarklet()}
      >
        {copied ? "Copied!" : "Copy script"}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Bookmarklet script copied to clipboard" : ""}
      </span>
      <a
        href="https://github.com/bitofbeans/js2048Game"
        target="_blank"
        rel="noreferrer"
      >
        Source code ↗
      </a>
    </div>
  );
}
