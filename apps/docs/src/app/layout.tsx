import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import { productName, releaseVersion, tagline } from "@expojet/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: `${productName} — ${tagline}`,
    template: `%s | ${productName} Docs`,
  },
  description: `${productName} is the most configurable way to create a production-ready Expo SDK 57 mobile app with authentication, database, styling, navigation, and backend — all in one command.`,
  metadataBase: new URL("https://www.expojet.dev"),
  alternates: { canonical: "/" },
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
    icon: "/brand/favicon.svg",
    shortcut: "/brand/favicon.svg",
    apple: "/brand/site-icon.svg",
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
    title: productName,
    description: tagline,
    images: ["/og/expojet-og.png"],
  },
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
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is serialized from static constants.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
