import { productName } from "@expojet/brand";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { StackBuilder } from "@/components/stack-builder";

export const metadata: Metadata = {
  title: "Stack Builder",
  description: `Configure a production-ready ${productName} app and copy the exact CLI command.`,
};

export default function BuilderPage() {
  return (
    <>
      <SiteHeader active="builder" />
      <main className="builder-page">
        <StackBuilder />
      </main>
    </>
  );
}
