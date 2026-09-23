import type { Metadata } from "next";
import { getCommunityData } from "@/lib/community";
import { SitePrototype } from "./prototype";

export const metadata: Metadata = {
  title: "Site directions | Expojet",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const community = await getCommunityData();
  return <SitePrototype community={community} />;
}
