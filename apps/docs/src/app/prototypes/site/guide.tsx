import Link from "next/link";
import { Community, CopyCommand, Mark, type PreviewProps } from "./shared";

export function Guide({ view, setView, community }: PreviewProps) {
  return (
    <div className={`direction guide-direction${view === "docs" ? " guide-docs-view" : ""}`}>
      <header className="guide-header">
        <button type="button" className="guide-brand" onClick={() => setView("landing")}>
          <Mark size={29} /> expojet
        </button>
        <nav aria-label="Site">
          <button
            type="button"
            onClick={() => setView("landing")}
            aria-current={view === "landing" ? "page" : undefined}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => setView("docs")}
            aria-current={view === "docs" ? "page" : undefined}
          >
            Learn
          </button>
          <Link href="/builder">Builder ↗</Link>
        </nav>
      </header>
      {view === "landing" ? (
        <main className="guide-home">
          <div className="guide-home-head">
            <div>
              <h1>Make your first Expojet project</h1>
              <p>
                Start with an Expo app. Add auth, styling, a database or an API when you need them.
              </p>
            </div>
            <Link href="/builder">Choose your stack ↗</Link>
          </div>
          <div className="guide-steps">
            <section>
              <span className="guide-number">1</span>
              <div>
                <h2>Create</h2>
                <p>Run Expojet and choose the parts of your app.</p>
                <div className="guide-command">
                  <CopyCommand />
                </div>
              </div>
            </section>
            <section>
              <span className="guide-number">2</span>
              <div>
                <h2>Configure</h2>
                <p>
                  The generated README lists any service keys you need to add. Mobile values use{" "}
                  <code>EXPO_PUBLIC_</code>.
                </p>
              </div>
            </section>
            <section>
              <span className="guide-number">3</span>
              <div>
                <h2>Run</h2>
                <p>
                  Start the app and open it in Expo Go. A monorepo can run the API alongside it.
                </p>
                <button type="button" onClick={() => setView("docs")}>
                  Read the quick start →
                </button>
              </div>
            </section>
          </div>
          <div className="guide-foot">
            <span>Expo SDK 57</span>
            <Link href="/docs/folder-structure">See the generated files →</Link>
          </div>
          <Community data={community} />
        </main>
      ) : (
        <main className="guide-docs">
          <div className="guide-doc-title">
            <span>Learn / Getting started</span>
            <h1>Create a project</h1>
            <p>
              Follow these steps for a standalone Expo app. Choose a monorepo if your project also
              needs an API.
            </p>
          </div>
          <div className="guide-doc-body">
            <nav aria-label="On this page">
              <a href="#guide-generate">Generate</a>
              <a href="#guide-configure">Configure</a>
              <a href="#guide-start">Start the app</a>
              <Link href="/docs/quick-start">Full guide ↗</Link>
            </nav>
            <article>
              <section id="guide-generate">
                <h2>1. Generate</h2>
                <p>
                  Run the command and answer the prompts. Expojet validates the combination before
                  it writes the project.
                </p>
                <div className="guide-command">
                  <CopyCommand />
                </div>
              </section>
              <section id="guide-configure">
                <h2>2. Configure services</h2>
                <p>
                  If you selected auth or a database, copy the generated environment example and add
                  your keys. Keep server credentials out of the mobile app.
                </p>
                <pre>cd my-app{"\n"}cp .env.example .env</pre>
              </section>
              <section id="guide-start">
                <h2>3. Start the app</h2>
                <p>
                  Install dependencies, then start Expo. Scan the QR code to open the app on your
                  device.
                </p>
                <pre>pnpm install{"\n"}pnpm start --lan</pre>
                <Link href="/docs/quick-start">Continue in the full guide →</Link>
              </section>
            </article>
          </div>
        </main>
      )}
    </div>
  );
}
