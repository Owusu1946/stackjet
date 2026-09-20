import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import type { Metadata } from "next";
import { productName, tagline } from "@expojet/brand";

export const metadata: Metadata = {
  title: {
    default: `${productName} — ${tagline}`,
    template: `%s | ${productName} Docs`,
  },
  description: `${productName} is the most configurable way to create a production-ready Expo SDK 57 mobile app with authentication, database, styling, navigation, and backend — all in one command.`,
  metadataBase: new URL("https://expojet.dev"),
  openGraph: {
    type: "website",
    siteName: productName,
    title: `${productName} — ${tagline}`,
    description:
      "Generate production-ready Expo SDK 57 apps with Clerk, Better Auth, NativeWind, Drizzle, Hono, and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: productName,
    description: tagline,
  },
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
