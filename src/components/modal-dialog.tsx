"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function ModalDialog({
  label,
  counter,
  closeLabel = "Close dialog",
  frameClassName,
  headerActions,
  onClose,
  onPrev,
  onNext,
  children,
}: {
  label: string;
  counter?: ReactNode;
  closeLabel?: string;
  frameClassName?: string;
  headerActions?: ReactNode;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  children: ReactNode;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const callbacksRef = useRef({ onClose, onPrev, onNext });

  useEffect(() => {
    callbacksRef.current = { onClose, onPrev, onNext };
  }, [onClose, onPrev, onNext]);

  // Focus the close button once on mount and mark background <main> inert.
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
      const {
        onClose: close,
        onPrev: prev,
        onNext: next,
      } = callbacksRef.current;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowLeft" && prev) {
        event.preventDefault();
        prev();
      } else if (event.key === "ArrowRight" && next) {
        event.preventDefault();
        next();
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
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="design-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={frameRef}
        className={
          "design-lightbox-frame" + (frameClassName ? " " + frameClassName : "")
        }
      >
        <div className="design-lightbox-bar">
          <span className="design-lightbox-counter">{counter}</span>
          <div className="design-lightbox-actions">
            {headerActions}
            <button
              ref={closeRef}
              type="button"
              className="design-lightbox-btn"
              onClick={onClose}
              aria-label={closeLabel}
            >
              Close ×
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
