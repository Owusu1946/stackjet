import type { Metadata } from "next";
import { SitePrototype } from "./prototype";

export const metadata: Metadata = {
  title: "Site directions | Expojet",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SitePrototype />;
}
