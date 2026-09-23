import { ArrowRight01Icon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Community, CopyCommand, Mark, type PreviewProps } from "./shared";

export function Index({ view, setView, community }: PreviewProps) {
  return (
    <div className="direction index-direction">
      <header className="index-header">
        <button type="button" className="index-brand" onClick={() => setView("landing")}>
          <Mark size={27} />
          <span>expojet</span>
          <span className="index-brand-divider">/</span>
          <span className="index-brand-docs">Docs</span>
        </button>
        <nav aria-label="Site">
          <button
            type="button"
            onClick={() => setView("landing")}
            aria-current={view === "landing" ? "page" : undefined}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setView("docs")}
            aria-current={view === "docs" ? "page" : undefined}
          >
            Quick start
          </button>
          <Link href="/builder">
            Builder <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <div className="index-layout">
        <aside className="index-sidebar" aria-label="Documentation navigation">
          <Link className="index-search" href="/docs">
            Open full documentation
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} aria-hidden="true" />
          </Link>
          <div className="index-nav-group">
            <span>Start</span>
            <button
              type="button"
              className={view === "landing" ? "selected" : ""}
              onClick={() => setView("landing")}
            >
              Overview
            </button>
            <button
              type="button"
              className={view === "docs" ? "selected" : ""}
              onClick={() => setView("docs")}
            >
              Quick start
            </button>
            <Link href="/docs/installation">Installation</Link>
            <Link href="/docs/folder-structure">Project structure</Link>
          </div>
          <div className="index-nav-group">
            <span>Choose your stack</span>
            <Link href="/docs/guides/navigation/expo-router">Navigation</Link>
            <Link href="/docs/guides/styling/options">Styling</Link>
            <Link href="/docs/guides/authentication/providers">Authentication</Link>
            <Link href="/docs/guides/backend/frameworks">Backend</Link>
          </div>
          <div className="index-nav-group">
            <span>Reference</span>
            <Link href="/docs/cli/flags">CLI flags</Link>
            <Link href="/docs/cli/doctor">Doctor</Link>
          </div>
        </aside>

        <main className="index-content">
          {view === "landing" ? (
            <article>
              <h1>Create an Expo project</h1>
              <p className="index-lead">
                Choose navigation, styling, authentication, and backend. Expojet writes an Expo SDK
                57 project with those pieces connected.
              </p>
              <div className="index-command">
                <div>
                  <span>Run in your terminal</span>
                  <span>npm</span>
                </div>
                <CopyCommand />
              </div>
              <p className="index-under-command">
                The command opens an interactive setup. You can also{" "}
                <Link href="/builder">choose options in the browser</Link>.
              </p>
              <section className="index-section">
                <h2>Pick a starting point</h2>
                <div className="index-link-row">
                  <button type="button" onClick={() => setView("docs")}>
                    <strong>Follow the quick start</strong>
                    <span>Create a standalone Expo app, then add services later.</span>
                    <b>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={17} aria-hidden="true" />
                    </b>
                  </button>
                  <Link href="/builder">
                    <strong>Configure the stack</strong>
                    <span>Choose the integrations before generating the project.</span>
                    <b>
                      <HugeiconsIcon icon={ArrowUpRight01Icon} size={17} aria-hidden="true" />
                    </b>
                  </Link>
                </div>
              </section>
              <section className="index-section">
                <h2>What Expojet writes</h2>
                <div className="index-fact">
                  <span>Mobile</span>
                  <p>An Expo app with the navigation and styling you selected.</p>
                </div>
                <div className="index-fact">
                  <span>API</span>
                  <p>In a monorepo, backend code and secrets live outside the mobile app.</p>
                </div>
                <div className="index-fact">
                  <span>Manifest</span>
                  <p>
                    <code>expojet.jsonc</code> records the choices used to create the project.
                  </p>
                </div>
              </section>
              <Community data={community} />
            </article>
          ) : (
            <article>
              <div className="index-breadcrumb">
                Docs <span>/</span> Quick start
              </div>
              <h1>Quick start</h1>
              <p className="index-lead">
                Create a project, open the generated directory, and follow its README for any
                service keys.
              </p>
              <section className="index-section index-doc-section">
                <h2>Generate</h2>
                <p>
                  Run the generator and answer the prompts. The default is a standalone Expo app.
                </p>
                <div className="index-command">
                  <div>
                    <span>Terminal</span>
                    <span>Copy the command below</span>
                  </div>
                  <CopyCommand />
                </div>
              </section>
              <section className="index-section index-doc-section">
                <h2>Open the project</h2>
                <p>
                  Expojet writes the app into a new <code>my-app</code> directory. Read the
                  generated README before starting the app, especially if you selected auth or a
                  database.
                </p>
                <pre>
                  cd my-app{"\n"}pnpm install{"\n"}pnpm start --lan
                </pre>
              </section>
              <section className="index-section index-doc-section">
                <h2>Need an API?</h2>
                <p>
                  Choose a monorepo in the builder. It separates <code>apps/mobile</code>,{" "}
                  <code>apps/api</code>, and shared types.
                </p>
                <Link className="index-next" href="/builder">
                  Open the builder{" "}
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
                </Link>
              </section>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}
