"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BookmarkletLink } from "./bookmarklet-link";
import { DesignLightbox } from "./design-lightbox";
import { art, projects, SOUNDCLOUD_EMBED_URL } from "./portfolio-data";

export function WorkSection({ docked = true }: { docked?: boolean }) {
  const [gallery, setGallery] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [openEmbeds, setOpenEmbeds] = useState<Record<string, boolean>>({});
  const [showMixPlayer, setShowMixPlayer] = useState(false);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!docked) setLightboxIndex(null);
  }, [docked]);

  function closeLightbox() {
    const returnIndex = lightboxIndex;
    setLightboxIndex(null);
    if (returnIndex !== null) {
      requestAnimationFrame(() => {
        triggerRefs.current[returnIndex]?.focus({ preventScroll: true });
      });
    }
  }

  return (
    <>
      <div className="work-switch" role="group" aria-label="Work categories">
        <button
          type="button"
          aria-pressed={!gallery}
          onClick={() => {
            setGallery(false);
            setLightboxIndex(null);
          }}
        >
          Projects
        </button>
        <button
          type="button"
          aria-pressed={gallery}
          onClick={() => setGallery(true)}
        >
          Designs
        </button>
      </div>
      {gallery ? (
        <>
          <div className="design-grid">
            {art.map(([file, name, width, height], index) => (
              <figure key={file} className="design-card">
                <button
                  ref={(el) => {
                    triggerRefs.current[index] = el;
                  }}
                  type="button"
                  className="design-card-trigger"
                  onClick={() => setLightboxIndex(index)}
                  aria-label={`View ${name}`}
                >
                  <Image
                    src={"/images/" + file}
                    width={width}
                    height={height}
                    sizes="(max-width: 650px) 85vw, 32vw"
                    alt={name}
                  />
                </button>
                <figcaption>{name}</figcaption>
              </figure>
            ))}
          </div>
          {lightboxIndex !== null && (
            <DesignLightbox
              index={lightboxIndex}
              onClose={closeLightbox}
              onChange={setLightboxIndex}
            />
          )}
        </>
      ) : (
        <>
          {projects.map((project) => {
            const embedOpen = Boolean(openEmbeds[project.href]);
            return (
              <div className="project-block" key={project.href}>
                <article className="project-feature">
                  <Image
                    src={project.image}
                    width={project.width}
                    height={project.height}
                    sizes="(max-width: 650px) 80vw, 45vw"
                    alt={project.alt}
                  />
                  <div>
                    <h2>{project.name}</h2>
                    <p>{project.description}</p>
                    <div className="project-actions">
                      <a
                        className="pixel-action"
                        href={project.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {project.action} ↗
                      </a>
                      {project.embed && (
                        <button
                          type="button"
                          className="subtle-action relative z-10"
                          aria-expanded={embedOpen}
                          onClick={() =>
                            setOpenEmbeds((prev) => ({
                              ...prev,
                              [project.href]: !prev[project.href],
                            }))
                          }
                        >
                          {embedOpen
                            ? project.embed.hideLabel
                            : project.embed.showLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
                {project.embed && embedOpen && (
                  <div className="inline-embed">
                    <iframe
                      title={project.embed.title}
                      src={project.embed.src}
                      width={project.embed.width}
                      height={project.embed.height}
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            );
          })}
          <article className="mix-row">
            <div className="mix-header">
              <h2>DJ Mix</h2>
              <div className="mix-links">
                <button
                  type="button"
                  className="subtle-action"
                  aria-expanded={showMixPlayer}
                  onClick={() => setShowMixPlayer((open) => !open)}
                >
                  {showMixPlayer ? "Hide player" : "Play inline"}
                </button>
                <a
                  href="https://soundcloud.com/user-95597774/primaconca"
                  target="_blank"
                  rel="noreferrer"
                >
                  Listen on SoundCloud ↗
                </a>
              </div>
            </div>
            {showMixPlayer && (
              <div className="inline-embed">
                <iframe
                  title="primaconca DJ Mix demo on SoundCloud"
                  src={SOUNDCLOUD_EMBED_URL}
                  width="100%"
                  height="166"
                  allow="autoplay"
                  loading="lazy"
                />
              </div>
            )}
          </article>
          <section className="older-work" aria-label="Older Work">
            <h2>Older Work</h2>
            <div className="older-grid">
              <article className="older-card">
                <h3>2048</h3>
                <p>
                  2048 clone that runs on any webpage. Drag the bookmarklet to
                  your bookmarks bar or copy the script.
                </p>
                <BookmarkletLink />
              </article>
              <article className="older-card">
                <h3>Wordle</h3>
                <p>Wordle clone built in Svelte.</p>
                <div className="older-actions">
                  <a
                    className="pixel-action"
                    href="https://bit-wordle.web.app"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Play Wordle ↗
                  </a>
                  <a
                    href="https://github.com/bitofbeans/jsWordleGame"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Source code ↗
                  </a>
                </div>
              </article>
            </div>
          </section>
        </>
      )}
    </>
  );
}
