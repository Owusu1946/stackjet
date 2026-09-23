import Link from "next/link";
import { CopyCommand, DocsLinks, Mark, PreviewNav, type PreviewProps } from "./shared";

export function Flightpath(props: PreviewProps) {
  return (
    <div className="direction direction-flightpath">
      <header className="site-header flight-header">
        <button type="button" className="site-brand" onClick={() => props.setView("landing")}>
          <Mark /> expojet
        </button>
        <PreviewNav {...props} />
      </header>
      {props.view === "landing" ? (
        <main className="flight-main">
          <div className="flight-intro">
            <h1>
              Your choices become
              <br />
              <em>an Expo app.</em>
            </h1>
            <p>
              Pick the pieces you need. Expojet assembles an Expo SDK 57 project you can open and
              build on.
            </p>
            <div className="flight-actions">
              <Link href="/builder">
                Build your stack <span>↗</span>
              </Link>
              <button type="button" onClick={() => props.setView("docs")}>
                Read the docs →
              </button>
            </div>
          </div>
          <div
            className="flight-diagram"
            role="img"
            aria-label="Configuration becomes an Expo project"
          >
            <div className="flight-diagram-head">
              <span>YOUR CHOICES</span>
              <span>GENERATED PROJECT</span>
            </div>
            <div className="flight-tracks">
              <span>Router</span>
              <span>Clerk</span>
              <span>NativeWind</span>
              <span>Hono</span>
            </div>
            <div className="flight-route">
              <span className="flight-dot" />
              <span className="flight-line" />
              <span className="flight-mark">
                <Mark size={62} />
              </span>
            </div>
            <div className="flight-output">
              <span>my-app/</span>
              <code>apps/mobile</code>
              <code>apps/api</code>
              <code>packages/shared</code>
            </div>
          </div>
          <div className="flight-bottom">
            <CopyCommand />
            <span>Expo SDK 57 · standalone or monorepo</span>
          </div>
        </main>
      ) : (
        <main className="flight-docs">
          <aside>
            <span className="flight-docs-title">Documentation</span>
            <DocsLinks />
          </aside>
          <article>
            <span className="flight-doc-marker">01 / GET STARTED</span>
            <h1>Generate the project. See every choice.</h1>
            <p>
              Expojet creates a validated Expo project from the options you choose. Start with the
              defaults, then add services when your app needs them.
            </p>
            <CopyCommand />
            <h2>What you get</h2>
            <div className="flight-doc-row">
              <span>Mobile</span>
              <p>An Expo SDK 57 app with your navigation and styling choices.</p>
            </div>
            <div className="flight-doc-row">
              <span>Server</span>
              <p>For monorepos, API code and secrets stay outside the mobile app.</p>
            </div>
            <div className="flight-doc-row">
              <span>Manifest</span>
              <p>
                <code>expojet.jsonc</code> records the choices used to generate the project.
              </p>
            </div>
          </article>
        </main>
      )}
    </div>
  );
}
