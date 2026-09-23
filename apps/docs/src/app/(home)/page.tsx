import { ArrowRight01Icon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { CopyCommand } from "@/components/copy-command";
import { Community } from "@/components/site-community";
import { SiteHeader } from "@/components/site-header";
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
            <h1>Create an Expo app with your stack.</h1>
            <p>
              Choose navigation, styling, authentication, and backend. Expojet writes an Expo SDK 57
              project with those pieces configured.
            </p>
            <div className="home-command">
              <CopyCommand />
            </div>
            <div className="home-actions">
              <Link className="home-primary" href="/builder">
                Build your stack{" "}
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={17} aria-hidden="true" />
              </Link>
              <Link className="home-secondary" href="/docs">
                Read the docs <HugeiconsIcon icon={ArrowRight01Icon} size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="home-output">
            <h2>What Expojet writes</h2>
            <dl>
              <div>
                <dt>Mobile</dt>
                <dd>An Expo app with your navigation and styling choices.</dd>
              </div>
              <div>
                <dt>API</dt>
                <dd>In a monorepo, backend code and secrets stay outside the mobile app.</dd>
              </div>
              <div>
                <dt>Manifest</dt>
                <dd>
                  <code>expojet.jsonc</code> records the choices that created the project.
                </dd>
              </div>
            </dl>
            <Link href="/docs/quick-start">
              Start with the guide{" "}
              <HugeiconsIcon icon={ArrowRight01Icon} size={17} aria-hidden="true" />
            </Link>
          </div>
        </section>
        <Community data={community} />
      </main>
    </div>
  );
}
