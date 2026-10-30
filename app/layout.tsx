import type { Metadata } from "next";
import {
  Caveat,
  Geist,
  Geist_Mono,
  Indie_Flower,
  Kalam,
  Patrick_Hand,
  Shadows_Into_Light,
} from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The five pre-loaded handwriting fonts required by PRD Module 2.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const indieFlower = Indie_Flower({
  variable: "--font-indie-flower",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const shadowsIntoLight = Shadows_Into_Light({
  variable: "--font-shadows-into-light",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const patrickHand = Patrick_Hand({
  variable: "--font-patrick-hand",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

/** Applied before first paint so the page never flashes the wrong theme. */
const themeBootScript = `(function(){try{var t=localStorage.getItem("inkflow-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark");}}catch(e){}})();`;

export const metadata: Metadata = {
  title: "InkFlow — Text to Handwriting",
  description:
    "Turn typed text into realistic handwritten pages. Everything runs in the browser.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The boot script adds the `dark` class before hydration, so the class list
    // intentionally differs from the server render; React must not treat that as
    // a hydration error.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} ${kalam.variable} ${indieFlower.variable} ${shadowsIntoLight.variable} ${patrickHand.variable} h-full`}
    >
      <body className="h-full font-sans text-slate-900 antialiased dark:text-slate-100">
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        {children}
      </body>
    </html>
  );
}
