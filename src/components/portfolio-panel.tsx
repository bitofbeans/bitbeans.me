"use client";

import type { RefObject } from "react";
import type { BlogPost } from "~/lib/blog-types";
import type { SceneGeometry } from "~/lib/scene-geometry";
import { AboutSection } from "./about/about-section";
import { BlogFallback } from "./blog/blog-panel";
import { SceneFrame } from "./scene-frame";
import { BackLabel, type Section } from "./segment-labels";
import { WorkSection } from "./work/work-section";

export function SectionContent({
  section,
  docked = true,
  blogPosts = [],
}: {
  section: Section;
  docked?: boolean;
  blogPosts?: readonly BlogPost[];
}) {
  return section === "Work" ? (
    <WorkSection docked={docked} />
  ) : section === "About" ? (
    <AboutSection />
  ) : (
    <BlogFallback posts={blogPosts} />
  );
}

export function PortfolioPanel({
  section,
  geometry: g,
  docked,
  heading,
  goBack,
  blogPosts,
}: {
  section: Section;
  geometry: SceneGeometry;
  docked: boolean;
  heading: RefObject<HTMLHeadingElement | null>;
  goBack: () => void;
  blogPosts: readonly BlogPost[];
}) {
  return (
    <section
      aria-label={section}
      inert={!docked}
      className={"destination" + (docked ? " powered" : "")}
      style={{ left: g.distance, top: g.cameraY, width: g.w, height: g.h }}
    >
      <SceneFrame g={g} />
      <button
        type="button"
        className="return-switch"
        onClick={goBack}
        aria-label="Back to homepage"
        style={{
          left: g.left,
          top: g.railY - g.wire / 2,
          paddingLeft: g.loopWidth + g.wire / 2 + 10,
          height: g.loopHeight + g.wire,
        }}
      >
        {docked && <BackLabel />}
      </button>
      <div
        className="panel-scroll"
        style={{
          left: g.left + g.wire / 2 + 4,
          right: g.left + g.wire / 2 + 4,
          top: g.railY + g.loopHeight + g.wire / 2 + 8,
          bottom: g.top + g.wire / 2 + 4,
        }}
      >
        <div className="panel-content">
          <h1 ref={heading} tabIndex={-1}>
            {section}
          </h1>
          <SectionContent
            section={section}
            docked={docked}
            blogPosts={blogPosts}
          />
        </div>
      </div>
    </section>
  );
}
