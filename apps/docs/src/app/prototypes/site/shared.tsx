"use client";

import Image from "next/image";
import type { CommunityData } from "@/lib/community";

export type PreviewProps = {
  view: "landing" | "docs";
  setView: (view: "landing" | "docs") => void;
  community: CommunityData;
};

export function Mark({ size = 34 }: { size?: number }) {
  return <Image src="/brand/expojet-mark.svg" alt="" width={size} height={size} priority />;
}

export { CopyCommand } from "@/components/copy-command";
export { Community } from "@/components/site-community";
