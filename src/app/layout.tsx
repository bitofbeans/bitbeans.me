import "../styles/globals.css";

import { type Metadata } from "next";
import localFont from "next/font/local";
import { siteDescription, siteTitle, siteUrl } from "./sections";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s · ${siteTitle}`,
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: siteTitle,
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  icons: [{ rel: "icon", url: "/favicon.ico?v=3" }],
};

const pixelifySans = localFont({
  src: "../../public/fonts/pixelify-sans.ttf",
  variable: "--font-pixelify-sans",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={pixelifySans.variable}>
      <body className="bg-black">{children}</body>
    </html>
  );
}
