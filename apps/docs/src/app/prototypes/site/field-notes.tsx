import Link from "next/link";
import { CopyCommand, DocsLinks, Mark, PreviewNav, type PreviewProps } from "./shared";

export function FieldNotes(props: PreviewProps) {
  return (
    <div className="direction direction-fieldnotes">
      <header className="site-header notes-header">
        <button type="button" className="site-brand" onClick={() => props.setView("landing")}>
          <Mark size={28} /> expojet<span>.dev</span>
        </button>
        <PreviewNav {...props} />
      </header>
      {props.view === "landing" ? (
        <main className="notes-main">
          <div className="notes-lead">
            <h1>
              Create an Expo app.
              <br />
              Keep your stack.
            </h1>
            <p>
              Expojet connects the libraries you choose. The output is normal project code you can
              edit.
            </p>
            <div className="notes-actions">
              <Link href="/builder">Build an app ↗</Link>
              <button type="button" onClick={() => props.setView("docs")}>
                See how it works →
              </button>
            </div>
          </div>
          <div className="notes-receipt">
            <div className="notes-receipt-head">
              <span>create-expojet</span>
              <span>my-app</span>
            </div>
            <div className="notes-receipt-body">
              <p>
                <span>01</span> Choose Expo Router
              </p>
              <p>
                <span>02</span> Add NativeWind
              </p>
              <p>
                <span>03</span> Include Clerk
              </p>
              <p className="notes-receipt-done">
                <span>✓</span> Project ready
              </p>
            </div>
            <div className="notes-receipt-foot">The app and its configuration are ready.</div>
          </div>
          <div className="notes-command">
            <CopyCommand />
            <span>Works with npm, pnpm, bun and yarn.</span>
          </div>
        </main>
      ) : (
        <main className="notes-docs">
          <aside>
            <button type="button" onClick={() => props.setView("landing")}>
              ← Home
            </button>
            <h1>Documentation</h1>
            <DocsLinks />
          </aside>
          <article>
            <div className="notes-doc-overline">GETTING STARTED / 5 MIN</div>
            <h2>Your first Expojet app</h2>
            <p>
              Run the generator and choose the parts your app needs. Expojet checks the combination,
              writes the project and leaves you with setup instructions for any external service.
            </p>
            <CopyCommand />
            <h3>Choose a starting point</h3>
            <p>
              Use the defaults for a standalone Expo app. If you need a backend, choose a monorepo
              and keep server code in <code>apps/api</code>.
            </p>
            <h3>Open the result</h3>
            <p>
              The generated README tells you which keys to add and which command starts your app.
            </p>
            <Link href="/docs/quick-start">Read the full quick start →</Link>
          </article>
        </main>
      )}
    </div>
  );
}
