"use client";

import Link from "next/link";
import { useState } from "react";
import { Community, CopyCommand, Mark, type PreviewProps } from "./shared";

type Structure = "standalone" | "monorepo";
type Navigation = "router" | "react-navigation";
type Styling = "stylesheet" | "nativewind";

export function Compose({ view, setView, community }: PreviewProps) {
  const [structure, setStructure] = useState<Structure>("standalone");
  const [navigation, setNavigation] = useState<Navigation>("router");
  const [styling, setStyling] = useState<Styling>("stylesheet");
  const value = `npx create-expojet@latest my-app --yes --structure ${structure} --navigation ${navigation} --style ${styling}`;

  return (
    <div className="direction compose-direction">
      <header className="compose-header">
        <button type="button" className="compose-brand" onClick={() => setView("landing")}>
          <Mark size={30} /> expojet
        </button>
        <nav aria-label="Site">
          <button
            type="button"
            onClick={() => setView("landing")}
            aria-current={view === "landing" ? "page" : undefined}
          >
            Build
          </button>
          <button
            type="button"
            onClick={() => setView("docs")}
            aria-current={view === "docs" ? "page" : undefined}
          >
            Docs
          </button>
          <Link href="/builder">Full builder ↗</Link>
        </nav>
      </header>

      {view === "landing" ? (
        <>
          <main className="compose-layout">
            <section className="compose-config">
              <h1>Configure an Expo project</h1>
              <p>Choose a few starting options. The command updates as you go.</p>
              <fieldset>
                <legend>Structure</legend>
                <div className="compose-options">
                  <button
                    type="button"
                    aria-pressed={structure === "standalone"}
                    onClick={() => setStructure("standalone")}
                  >
                    Standalone
                  </button>
                  <button
                    type="button"
                    aria-pressed={structure === "monorepo"}
                    onClick={() => setStructure("monorepo")}
                  >
                    Monorepo
                  </button>
                </div>
                <p>Monorepo adds a separate API and shared package.</p>
              </fieldset>
              <fieldset>
                <legend>Navigation</legend>
                <div className="compose-options">
                  <button
                    type="button"
                    aria-pressed={navigation === "router"}
                    onClick={() => setNavigation("router")}
                  >
                    Expo Router
                  </button>
                  <button
                    type="button"
                    aria-pressed={navigation === "react-navigation"}
                    onClick={() => setNavigation("react-navigation")}
                  >
                    React Navigation
                  </button>
                </div>
              </fieldset>
              <fieldset>
                <legend>Styling</legend>
                <div className="compose-options">
                  <button
                    type="button"
                    aria-pressed={styling === "stylesheet"}
                    onClick={() => setStyling("stylesheet")}
                  >
                    StyleSheet
                  </button>
                  <button
                    type="button"
                    aria-pressed={styling === "nativewind"}
                    onClick={() => setStyling("nativewind")}
                  >
                    NativeWind
                  </button>
                </div>
              </fieldset>
              <div className="compose-config-footer">
                <Link href="/builder">Open the full builder ↗</Link>
                <button type="button" onClick={() => setView("docs")}>
                  Read setup guide →
                </button>
              </div>
            </section>
            <section className="compose-output">
              <div className="compose-output-top">
                <span>my-app</span>
                <span>Expo SDK 57</span>
              </div>
              <h2>Ready to generate</h2>
              <p>Run this command in your terminal. It uses the options selected on the left.</p>
              <div className="compose-command">
                <CopyCommand value={value} />
              </div>
              <div className="compose-tree">
                <span>Project structure</span>
                <pre>
                  {structure === "standalone"
                    ? "my-app/\n├─ app/\n├─ src/\n├─ expojet.jsonc\n└─ package.json"
                    : "my-app/\n├─ apps/mobile/\n├─ apps/api/\n├─ packages/shared/\n└─ expojet.jsonc"}
                </pre>
              </div>
            </section>
          </main>
          <Community data={community} />
        </>
      ) : (
        <main className="compose-docs">
          <aside>
            <button type="button" onClick={() => setView("landing")}>
              ← Configure a project
            </button>
            <nav aria-label="Documentation">
              <a href="#generate">Generate</a>
              <a href="#structure">Structure</a>
              <a href="#next">Next steps</a>
              <Link href="/docs/cli/flags">All CLI flags ↗</Link>
            </nav>
          </aside>
          <article>
            <span className="compose-crumb">Docs / Quick start</span>
            <h1>Run the generator</h1>
            <p className="compose-doc-lead">
              Expojet checks your choices and writes the project only after the plan is valid.
            </p>
            <section id="generate">
              <h2>Generate</h2>
              <p>Use the interactive command to choose your stack in the terminal.</p>
              <div className="compose-command">
                <CopyCommand />
              </div>
            </section>
            <section id="structure">
              <h2>Choose a structure</h2>
              <div className="compose-doc-row">
                <strong>Standalone</strong>
                <p>One Expo app. A good place to start when you do not need an API.</p>
              </div>
              <div className="compose-doc-row">
                <strong>Monorepo</strong>
                <p>
                  Mobile, API and shared types in separate workspaces. Server secrets stay in{" "}
                  <code>apps/api</code>.
                </p>
              </div>
            </section>
            <section id="next">
              <h2>Next steps</h2>
              <p>
                Open the generated README. It lists the environment variables and commands for the
                stack you selected.
              </p>
              <Link href="/docs/quick-start">Read the full quick start →</Link>
            </section>
          </article>
        </main>
      )}
    </div>
  );
}
