"use client";

import Link from "next/link";
import { useState } from "react";
import { CopyCommand, DocsLinks, Mark, PreviewNav, type PreviewProps } from "./shared";

export function Assembly(props: PreviewProps) {
  const [structure, setStructure] = useState<"Standalone" | "Monorepo">("Standalone");

  return (
    <div className="direction direction-assembly">
      <header className="site-header assembly-header">
        <button type="button" className="site-brand" onClick={() => props.setView("landing")}>
          <Mark /> expojet
        </button>
        <PreviewNav {...props} />
      </header>
      {props.view === "landing" ? (
        <main className="assembly-main">
          <div className="assembly-left">
            <h1>
              Start with Expo.
              <br />
              Add what matters.
            </h1>
            <p>
              Choose your navigation, styling, auth and backend. Get one coherent project, with the
              setup already done.
            </p>
            <Link className="assembly-cta" href="/builder">
              Make an app <span>↗</span>
            </Link>
            <CopyCommand />
          </div>
          <div className="assembly-right">
            <div className="assembly-panel-top">
              <span>Preview a project</span>
              <span>SDK 57</span>
            </div>
            <div className="assembly-choice">
              <span>Structure</span>
              <div>
                <button
                  type="button"
                  data-selected={structure === "Standalone"}
                  onClick={() => setStructure("Standalone")}
                >
                  Standalone
                </button>
                <button
                  type="button"
                  data-selected={structure === "Monorepo"}
                  onClick={() => setStructure("Monorepo")}
                >
                  Monorepo
                </button>
              </div>
            </div>
            <div className="assembly-files">
              <strong>my-app</strong>
              <span>├─ {structure === "Standalone" ? "app/" : "apps/mobile/app/"}</span>
              <span>├─ {structure === "Standalone" ? "src/" : "apps/mobile/src/"}</span>
              {structure === "Monorepo" && (
                <>
                  <span>├─ apps/api/</span>
                  <span>├─ packages/shared/</span>
                </>
              )}
              <span>├─ expojet.jsonc</span>
              <span>└─ package.json</span>
            </div>
            <p>Change the structure. The project tree updates with it.</p>
          </div>
        </main>
      ) : (
        <main className="assembly-docs">
          <aside>
            <h1>Docs</h1>
            <DocsLinks />
          </aside>
          <article>
            <h2>Create your first app</h2>
            <p>
              Run the command, choose your stack, then open the generated project. You can start
              with a standalone Expo app or choose a monorepo when you need an API.
            </p>
            <CopyCommand />
            <div className="assembly-doc-step">
              <b>1</b>
              <div>
                <strong>Choose a structure</strong>
                <p>
                  Standalone keeps everything in one Expo app. Monorepo adds separate mobile, API
                  and shared workspaces.
                </p>
              </div>
            </div>
            <div className="assembly-doc-step">
              <b>2</b>
              <div>
                <strong>Select integrations</strong>
                <p>
                  Expojet wires your choices together and checks the combination before writing
                  files.
                </p>
              </div>
            </div>
            <div className="assembly-doc-step">
              <b>3</b>
              <div>
                <strong>Open the project</strong>
                <p>Follow the generated README for service keys and the first local run.</p>
              </div>
            </div>
          </article>
        </main>
      )}
    </div>
  );
}
