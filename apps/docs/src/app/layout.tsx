import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import { productName, releaseVersion, tagline } from "@expojet/brand";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";

const siteUrl = new URL("https://www.expojet.dev");

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${productName} — ${tagline}`,
    template: `%s | ${productName} Docs`,
  },
  description: `${productName} is the most configurable way to create a production-ready Expo SDK 57 mobile app with authentication, database, styling, navigation, and backend — all in one command.`,
  metadataBase: siteUrl,
  // No root `alternates.canonical`. Next resolves a relative canonical against `metadataBase`,
  // and a hardcoded `"/"` here was inherited by every route that did not override it, so all 30+
  // doc pages and /builder declared the site root as their canonical URL. Routes that care set
  // their own; the rest now canonicalise to themselves.
  keywords: [
    "Expo app generator",
    "Expo SDK 57",
    "React Native app generator",
    "Expo starter",
    "full-stack Expo monorepo",
    "Clerk",
    "Supabase",
    "Convex",
    "Hono",
    "Neon",
    "Drizzle",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/brand/favicon.svg",
    // iOS ignores SVG for a home-screen icon, so the touch icon has to be a real PNG.
    apple: "/brand/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: productName,
    title: `${productName} — ${tagline}`,
    description:
      "Generate production-ready Expo SDK 57 apps with Clerk, Better Auth, NativeWind, Drizzle, Hono, and more.",
    images: [
      {
        url: "/og/expojet-og.png",
        width: 1200,
        height: 630,
        alt: "Expojet — Build the Expo app you meant to build.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: `${productName} — ${tagline}`,
      // Without a template every doc page inherited the flat root title in the X/T card.
      template: `%s | ${productName}`,
    },
    description: tagline,
    images: ["/og/expojet-og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d0c" },
  ],
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: productName,
      url: "https://www.expojet.dev",
      logo: "https://www.expojet.dev/brand/site-icon.svg",
    },
    {
      "@type": "SoftwareApplication",
      name: productName,
      description: `${productName} generates production-ready Expo SDK 57 applications and full-stack monorepos.`,
      url: "https://www.expojet.dev",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Cross-platform",
      softwareVersion: releaseVersion,
      publisher: { "@type": "Organization", name: productName },
    },
  ],
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is serialized from static constants.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <RootProvider>
          {children}
          <Analytics />
        </RootProvider>
      </body>
    </html>
  );
}
