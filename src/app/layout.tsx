import "../styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

export const metadata: Metadata = {
  title: "Benas Unguraitis",
  description: "The personal website of BitBeans.",
  icons: [{ rel: "icon", url: "/favicon.ico?v=2" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="bg-black">{children}</body>
    </html>
  );
}
