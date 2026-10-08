import { commandName } from "@expojet/brand";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import Link from "next/link";
import { CopyCommand } from "@/components/copy-command";
import { FlightScene } from "@/components/flight-scene";
import { HomeCrew } from "@/components/home-crew";
import {
  LaunchCommand,
  LaunchProvider,
  LaunchRecord,
  LaunchSwitchboard,
  LaunchTerminal,
} from "@/components/home-launch";
import { SiteHeader } from "@/components/site-header";
import { getCommunityData } from "@/lib/community";
import "@/components/flight-scene.css";
import "./home.css";

// The landing page's own type, from the Variant D design. Docs keep the site fonts.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const body = Geist({ subsets: ["latin"], variable: "--font-body", display: "swap" });

const capabilities = [
  ["Nav", "Expo Router, React Navigation"],
  ["Auth", "Clerk, Supabase, Firebase, Better Auth"],
  ["Style", "Uniwind, NativeWind, Unistyles, StyleSheet"],
  ["Backend", "Hono, Express, NestJS, Convex"],
  ["Data", "Neon, PostgreSQL, SQLite, Supabase"],
  ["ORM", "Drizzle, Prisma"],
] as const;

// Names printed by `doctor` for a freshly generated project.
const doctorChecks = [
  "Node.js",
  "Expojet manifest",
  "Expo SDK pack",
  "Package manager lockfile",
  "Mobile secret boundary",
];

function Eyebrow({ stage, children }: { stage?: string; children: string }) {
  return (
    <p className="home-eyebrow">
      {stage ? <span className="home-eyebrow-stage">{stage}</span> : null}
      {children}
    </p>
  );
}

export default async function HomePage() {
  const community = await getCommunityData();

  return (
    <div className={`site-home ${display.variable} ${body.variable}`}>
      <FlightScene />
      <SiteHeader active="home" />
      <LaunchProvider>
        <main className="home-main">
          <section className="home-hero" data-flight-stage="0" aria-labelledby="home-title">
            <h1 id="home-title">Launch.</h1>
            <p>
              Every great app has a launch day.{" "}
              <span className="home-hero-accent">This is yours.</span>
            </p>
            <div className="home-command">
              <CopyCommand />
            </div>
          </section>

          <section className="home-stage" data-flight-stage="1" aria-labelledby="takeoff-title">
            <Eyebrow stage="02">Takeoff roll</Eyebrow>
            <h2 id="takeoff-title">Run the checklist.</h2>
            <p>
              Flip the switches. The command below rewrites itself, and so does the rest of this
              page.
            </p>
            <LaunchSwitchboard />
          </section>

          <section className="home-stage" data-flight-stage="2" aria-labelledby="liftoff-title">
            <Eyebrow stage="03">Liftoff</Eyebrow>
            <h2 id="liftoff-title">
              One command.
              <br />
              Wheels up.
            </h2>
            <p>
              Your project is generated in a staging directory and committed only after validation
              succeeds. A launch either completes or never leaves the runway.
            </p>
            <LaunchTerminal />
          </section>

          <section className="home-stage" data-flight-stage="3" aria-labelledby="climb-title">
            <Eyebrow stage="04">Climb</Eyebrow>
            <h2 id="climb-title">Keep climbing.</h2>
            <p>
              Everything you need is already on board. Your stack is on record, the checks are built
              in, and your agent gets clean context.
            </p>
            <div className="home-tiles">
              <div>
                <article className="home-tile home-glass">
                  <Eyebrow>Manifest</Eyebrow>
                  <h3>Everything on board</h3>
                  <dl className="home-capabilities">
                    {capabilities.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
                <article className="home-tile home-glass">
                  <Eyebrow>Flight recorder</Eyebrow>
                  <h3>Your stack, on record.</h3>
                  <LaunchRecord />
                </article>
              </div>
              <div>
                <article className="home-tile home-glass">
                  <Eyebrow>Autopilot</Eyebrow>
                  <h3>Hand the controls to your agent.</h3>
                  <p>
                    Point any coding agent at the docs. Plain text and Markdown, no proprietary
                    integration.
                  </p>
                  <ul className="home-endpoints">
                    <li>
                      <a href="/llms.txt">/llms.txt</a>
                    </li>
                    <li>
                      <a href="/llms-full.txt">/llms-full.txt</a>
                    </li>
                    <li>
                      <Link href="/docs/ai-agents">content.md</Link>
                    </li>
                  </ul>
                </article>
                <article className="home-tile home-glass">
                  <Eyebrow>Systems check</Eyebrow>
                  <h3>Checks that never touch your code.</h3>
                  <pre className="home-code">
                    <code>
                      $ npx {commandName} doctor
                      {doctorChecks.map((check) => (
                        <span key={check}>
                          {"\n"}
                          <span className="launch-ok">✓ </span>
                          {check}
                        </span>
                      ))}
                    </code>
                  </pre>
                </article>
              </div>
            </div>
          </section>

          <section className="home-stage" data-flight-stage="4" aria-labelledby="orbit-title">
            <Eyebrow stage="05">Orbit</Eyebrow>
            <h2 id="orbit-title">Built in the open.</h2>
            <p>A small crew. An open codebase. Room for your ideas.</p>
            <HomeCrew data={community} />
          </section>

          <section className="home-close" data-flight-stage="5" aria-labelledby="close-title">
            <Eyebrow>Go for launch</Eyebrow>
            <h2 id="close-title">Your turn.</h2>
            <p>Name your mission and run it.</p>
            <LaunchCommand />
            <div className="home-actions">
              <Link className="home-primary" href="/builder">
                Build your stack
              </Link>
              <Link className="home-secondary" href="/docs/quick-start">
                Quick start
              </Link>
            </div>
          </section>
        </main>
      </LaunchProvider>
    </div>
  );
}
