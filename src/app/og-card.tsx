import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteDescription, siteTitle } from "./sections";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

let cachedFont: Promise<ArrayBuffer> | null = null;
function loadPixelifyFont() {
  cachedFont ??= readFile(
    join(process.cwd(), "public/fonts/pixelify-sans.ttf"),
  ).then((buf) => new Uint8Array(buf).buffer);
  return cachedFont;
}

export async function renderOgCard({
  heading = siteTitle,
  badge = "bitbeans.me",
  subtitle = siteDescription,
}: {
  heading?: string;
  badge?: string;
  subtitle?: string;
}) {
  const fontData = await loadPixelifyFont();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#000000",
        display: "flex",
        position: "relative",
        fontFamily: '"Pixelify Sans"',
        color: "#f0f3ed",
        overflow: "hidden",
      }}
    >
      {/* Background blue circuit traces and double-walled green frame */}
      <svg
        width="1200"
        height="630"
        viewBox="0 0 1200 630"
        fill="none"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {/* Blue perimeter traces */}
        <g>
          {[
            { d: "M 92,0 V 48 H 158", tip: [158, 48] as const, lit: false },
            {
              d: "M 275,0 V 26 H 338 V 44",
              tip: [338, 44] as const,
              lit: true,
            },
            { d: "M 540,0 V 36 H 625", tip: [625, 36] as const, lit: false },
            { d: "M 885,0 V 44 H 815", tip: [815, 44] as const, lit: false },
            { d: "M 1090,0 V 32 H 1030 V 58", tip: null, lit: true },
            {
              d: "M 1200,150 H 1152 V 210",
              tip: [1152, 210] as const,
              lit: false,
            },
            {
              d: "M 1200,455 H 1164 V 385",
              tip: [1164, 385] as const,
              lit: false,
            },
            {
              d: "M 1110,630 V 582 H 1020",
              tip: [1020, 582] as const,
              lit: false,
            },
            { d: "M 740,630 V 594 H 825 V 572", tip: null, lit: true },
            {
              d: "M 390,630 V 584 H 315",
              tip: [315, 584] as const,
              lit: false,
            },
            { d: "M 0,145 H 46 V 220", tip: [46, 220] as const, lit: false },
            { d: "M 0,485 H 42 V 410", tip: [42, 410] as const, lit: true },
          ].map(({ d, tip, lit }, i) => (
            <g key={i}>
              <path
                d={d}
                stroke={lit ? "#5792af" : "#1d3044"}
                strokeWidth={12}
                strokeLinejoin="miter"
                strokeLinecap="butt"
              />
              {tip && (
                <circle
                  cx={tip[0]}
                  cy={tip[1]}
                  r={10}
                  fill={lit ? "#5792af" : "#1d3044"}
                />
              )}
              {tip && <circle cx={tip[0]} cy={tip[1]} r={5.5} fill="#000000" />}
              <path
                d={d}
                stroke="#000000"
                strokeWidth={5.5}
                strokeLinejoin="miter"
                strokeLinecap="butt"
              />
            </g>
          ))}
        </g>

        {/* Main green double-walled frame */}
        <rect x="64" y="58" width="1072" height="514" fill="#000000" />
        <path
          d="M 64,58 H 1136 V 572 H 64 Z"
          stroke="#2bbc7d"
          strokeWidth={14}
          strokeLinejoin="round"
        />
        {[
          [64, 58],
          [1136, 58],
          [1136, 572],
          [64, 572],
        ].map(([cx, cy], idx) => (
          <circle
            key={idx}
            cx={cx}
            cy={cy}
            r={11}
            fill="#000000"
            stroke="#2bbc7d"
            strokeWidth={4}
          />
        ))}
        <path
          d="M 64,58 H 1136 V 572 H 64 Z"
          stroke="#000000"
          strokeWidth={7}
          strokeLinejoin="round"
        />
      </svg>

      {/* Foreground content */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "96px 112px",
          gap: "56px",
        }}
      >
        {/* BitBeans Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="290" height="290" viewBox="0 0 1000 1000" fill="none">
            <g
              transform="translate(98.962642 23.705111) scale(0.962535)"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M186,226 H350 L478,354 V598 L350,726 H186"
                stroke="#2bbc7d"
                strokeWidth={64}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx={186}
                cy={226}
                r={19}
                stroke="#2bbc7d"
                strokeWidth={64}
              />
              <circle
                cx={186}
                cy={476}
                r={19}
                stroke="#2bbc7d"
                strokeWidth={64}
              />
              <circle
                cx={186}
                cy={726}
                r={19}
                stroke="#2bbc7d"
                strokeWidth={64}
              />
              <circle
                cx={478}
                cy={476}
                r={19}
                stroke="#2bbc7d"
                strokeWidth={64}
              />
              <path
                d="M478,476 H186"
                stroke="#2bbc7d"
                strokeWidth={64}
                strokeLinecap="round"
              />

              <circle
                cx={554}
                cy={282}
                r={19}
                fill="#2bbc7d"
                stroke="#ffffff"
                strokeWidth={64}
              />
              <circle
                cx={554}
                cy={670}
                r={19}
                fill="#2bbc7d"
                stroke="#ffffff"
                strokeWidth={64}
              />
              <circle
                cx={652}
                cy={476}
                r={19}
                fill="#2bbc7d"
                stroke="#ffffff"
                strokeWidth={64}
              />
              <circle
                cx={554}
                cy={476}
                r={19}
                fill="#2bbc7d"
                stroke="#ffffff"
                strokeWidth={64}
              />
              <path
                d="M478,476 H652"
                stroke="#ffffff"
                strokeWidth={80}
                strokeLinecap="butt"
              />
              <path
                d="M554,282 V670"
                stroke="#ffffff"
                strokeWidth={56}
                strokeLinecap="round"
              />

              {/* Black inner channels */}
              <path
                d="M186,226 H350 L478,354 V598 L350,726 H186"
                stroke="#000000"
                strokeWidth={32}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx={186}
                cy={226}
                r={19}
                stroke="#000000"
                strokeWidth={32}
              />
              <circle
                cx={186}
                cy={476}
                r={19}
                stroke="#000000"
                strokeWidth={32}
              />
              <circle
                cx={186}
                cy={726}
                r={19}
                stroke="#000000"
                strokeWidth={32}
              />
              <circle
                cx={478}
                cy={476}
                r={19}
                stroke="#000000"
                strokeWidth={32}
              />
              <circle
                cx={554}
                cy={282}
                r={19}
                stroke="#000000"
                strokeWidth={32}
              />
              <circle
                cx={554}
                cy={670}
                r={19}
                stroke="#000000"
                strokeWidth={32}
              />
              <circle
                cx={652}
                cy={476}
                r={19}
                stroke="#000000"
                strokeWidth={32}
              />
              <circle
                cx={554}
                cy={476}
                r={19}
                stroke="#000000"
                strokeWidth={32}
              />
              <path
                d="M478,476 H186"
                stroke="#000000"
                strokeWidth={32}
                strokeLinecap="round"
              />
              <path
                d="M478,476 H652"
                stroke="#000000"
                strokeWidth={40}
                strokeLinecap="round"
              />
              <path
                d="M554,282 V670"
                stroke="#000000"
                strokeWidth={28}
                strokeLinecap="round"
              />
            </g>
          </svg>
        </div>

        {/* Right text column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            gap: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "28px",
              color: "#ffbc42",
              letterSpacing: "0.04em",
            }}
          >
            {badge}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "76px",
              lineHeight: 1.02,
              color: "#f0f3ed",
              letterSpacing: "-0.03em",
            }}
          >
            {heading}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "30px",
              lineHeight: 1.35,
              color: "#a5b5ac",
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>
    </div>,
    {
      ...ogSize,
      fonts: [
        {
          name: "Pixelify Sans",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
