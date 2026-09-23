import Link from "next/link";
import { CopyCommand, DocsLinks, Mark, PreviewNav, type PreviewProps } from "./shared";

export function Blueprint(props: PreviewProps) {
  return (
    <div className="direction direction-blueprint">
      <header className="site-header blueprint-header">
        <button type="button" className="site-brand" onClick={() => props.setView("landing")}>
          <Mark /> expojet
        </button>
        <PreviewNav {...props} />
      </header>
      {props.view === "landing" ? (
        <main className="blueprint-main">
          <div className="blueprint-top">
            <span>EXPO SDK 57 / PROJECT GENERATOR</span>
            <span>CONFIG → PROJECT</span>
          </div>
          <div className="blueprint-hero">
            <h1>
              Specify the stack.
              <br />
              Generate the app.
            </h1>
            <div className="blueprint-cross" aria-hidden="true">
              +
            </div>
            <p>
              Choose the stack. Expojet generates the app and keeps server code where it belongs.
            </p>
          </div>
          <div className="blueprint-actions">
            <Link href="/builder">Configure project ↗</Link>
            <button type="button" onClick={() => props.setView("docs")}>
              Read the manual →
            </button>
          </div>
          <div className="blueprint-strip">
            <span>
              01 <b>Define</b> your choices
            </span>
            <span>
              02 <b>Generate</b> the project
            </span>
            <span>
              03 <b>Build</b> the app
            </span>
          </div>
          <div className="blueprint-command">
            <CopyCommand />
          </div>
        </main>
      ) : (
        <main className="blueprint-docs">
          <div className="blueprint-doc-rail">
            <span>EXPOJET / MANUAL</span>
            <DocsLinks />
          </div>
          <article>
            <div className="blueprint-doc-meta">
              <span>GUIDE 001</span>
              <span>EXPO SDK 57</span>
            </div>
            <h1>Generate a project</h1>
            <p>
              Expojet turns your selected integrations into a complete Expo app. You can generate a
              standalone mobile project or a monorepo with an API.
            </p>
            <CopyCommand />
            <div className="blueprint-doc-spec">
              <div>
                <span>INPUT</span>
                <strong>Project name and stack choices</strong>
              </div>
              <div>
                <span>OUTPUT</span>
                <strong>Expo app and manifest</strong>
              </div>
              <div>
                <span>CHECK</span>
                <strong>Run expojet doctor</strong>
              </div>
            </div>
            <Link href="/docs/quick-start">Continue to quick start ↗</Link>
          </article>
        </main>
      )}
    </div>
  );
}
