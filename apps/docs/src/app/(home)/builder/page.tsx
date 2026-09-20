import { productName } from "@expojet/brand";
import type { Metadata } from "next";
import Link from "next/link";
import { StackBuilder } from "@/components/stack-builder";

export const metadata: Metadata = {
  title: "Stack Builder",
  description: `Configure a production-ready ${productName} app and copy the exact CLI command.`,
};

export default function BuilderPage() {
  return (
    <main className="builder-page">
      <div className="builder-page-bar">
        <Link href="/">← Back home</Link>
        <span>Configure once. Generate exactly.</span>
        <Link href="/docs/cli/create">CLI reference →</Link>
      </div>
      <StackBuilder />
    </main>
  );
}
