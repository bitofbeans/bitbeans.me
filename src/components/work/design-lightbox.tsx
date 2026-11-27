"use client";

import Image from "next/image";
import { useRef } from "react";
import { ModalDialog } from "~/components/modal-dialog";
import { art } from "./portfolio-data";

export function DesignLightbox({
  index,
  onClose,
  onChange,
}: {
  index: number;
  onClose: () => void;
  onChange: (next: number) => void;
}) {
  const swipeStart = useRef<number | null>(null);
  const item = art[index]!;
  const [file, name, width, height] = item;
  const total = art.length;

  const prev = () => onChange((index - 1 + total) % total);
  const next = () => onChange((index + 1) % total);

  return (
    <ModalDialog
      label={name}
      counter={`${index + 1} / ${total}`}
      closeLabel="Close viewer"
      onClose={onClose}
      onPrev={prev}
      onNext={next}
      headerActions={
        <a
          href={"/images/" + file}
          target="_blank"
          rel="noreferrer"
          className="design-lightbox-link"
        >
          View original ↗
        </a>
      }
    >
      <div
        className="design-lightbox-stage"
        onTouchStart={(event) => {
          const touch = event.touches[0];
          if (touch) swipeStart.current = touch.clientX;
        }}
        onTouchEnd={(event) => {
          const startX = swipeStart.current;
          const touch = event.changedTouches[0];
          swipeStart.current = null;
          if (startX === null || !touch) return;
          const dx = touch.clientX - startX;
          if (Math.abs(dx) < 36) return;
          if (dx < 0) next();
          else prev();
        }}
      >
        <button
          type="button"
          className="design-lightbox-nav design-lightbox-prev"
          aria-label="Previous design"
          onClick={prev}
        >
          ←
        </button>
        <figure className="design-lightbox-figure">
          <Image
            key={file}
            src={"/images/" + file}
            width={width}
            height={height}
            sizes="90vw"
            alt={name}
            priority
          />
          <figcaption>{name}</figcaption>
        </figure>
        <button
          type="button"
          className="design-lightbox-nav design-lightbox-next"
          aria-label="Next design"
          onClick={next}
        >
          →
        </button>
      </div>
    </ModalDialog>
  );
}
