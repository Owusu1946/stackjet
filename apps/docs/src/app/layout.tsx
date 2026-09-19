import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Expojet — A production-ready Expo stack in one command",
    template: "%s | Expojet Docs",
  },
  description:
    "Expojet is the most configurable way to create a production-ready Expo SDK 57 mobile app with authentication, database, styling, navigation, and backend — all in one command.",
  metadataBase: new URL("https://expojet.dev"),
  openGraph: {
    type: "website",
    siteName: "Expojet",
    title: "Expojet — A production-ready Expo stack in one command",
    description:
      "Generate production-ready Expo SDK 57 apps with Clerk, Better Auth, NativeWind, Drizzle, Hono, and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Expojet",
    description: "A production-ready Expo stack in one command.",
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
