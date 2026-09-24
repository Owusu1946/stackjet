import { ArrowRight01Icon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { CopyCommand } from "@/components/copy-command";
import { Community } from "@/components/site-community";
import { SiteHeader } from "@/components/site-header";
import { StackDemo } from "@/components/stack-demo";
import { getCommunityData } from "@/lib/community";
import "@/components/site-community.css";
import "./home.css";

export default async function HomePage() {
  const community = await getCommunityData();

  return (
    <div className="site-home">
      <SiteHeader active="home" />
      <main className="home-main">
        <section className="home-hero">
          <div className="home-hero-content">
            <h1>
              Your stack.
              <br />
              <span>Ready to build.</span>
            </h1>
            <p>
              Generate an Expo app with your navigation, styling, auth, and backend already
              connected.
            </p>
            <div className="home-command">
              <CopyCommand />
            </div>
            <div className="home-actions">
              <Link className="home-primary" href="/builder">
                Build your stack{" "}
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={17} aria-hidden="true" />
              </Link>
              <Link className="home-secondary" href="/docs/quick-start">
                Quick start <HugeiconsIcon icon={ArrowRight01Icon} size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <StackDemo />
        </section>
        <Community data={community} />
      </main>
    </div>
  );
}
