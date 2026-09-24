"use client";

import { FileCodeIcon, Folder01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

const choices = {
  NativeWind: ["src/global.css", "Utility-first styling"],
  StyleSheet: ["src/theme/tokens.ts", "Shared theme tokens"],
} as const;

export function StackDemo() {
  const [style, setStyle] = useState<keyof typeof choices>("NativeWind");
  return (
    <section className="stack-demo" aria-label="Example project structure">
      <div className="demo-caption">
        <span>01 / CONFIGURE</span>
        <span>EXAMPLE</span>
      </div>
      <h2>A few choices. A fresh start.</h2>
      <p>Pick a styling approach. See where it lands.</p>
      <fieldset className="demo-choices">
        <legend className="demo-sr-only">Styling approach</legend>
        {Object.keys(choices).map((choice) => (
          <button
            key={choice}
            type="button"
            aria-pressed={style === choice}
            onClick={() => setStyle(choice as keyof typeof choices)}
          >
            {choice}
          </button>
        ))}
      </fieldset>
      <div className="demo-output" aria-live="polite" aria-atomic="true">
        <div className="demo-caption">
          <span>02 / YOUR PROJECT</span>
          <span>↘</span>
        </div>
        <div className="demo-root">
          <HugeiconsIcon icon={Folder01Icon} size={16} aria-hidden="true" />
          <span>my-app</span>
          <span className="demo-root-slash">/</span>
        </div>
        <ul className="demo-file-tree" aria-label="Generated project files">
          <li>
            <div className="demo-tree-row">
              <HugeiconsIcon icon={Folder01Icon} size={15} aria-hidden="true" />
              <code>app/</code>
              <span>Expo Router</span>
            </div>
          </li>
          <li>
            <div className="demo-tree-row">
              <HugeiconsIcon icon={Folder01Icon} size={15} aria-hidden="true" />
              <code>src/</code>
              <span>Your source</span>
            </div>
            <ul>
              {style === "StyleSheet" ? (
                <li>
                  <div className="demo-tree-row demo-tree-nested">
                    <HugeiconsIcon icon={Folder01Icon} size={15} aria-hidden="true" />
                    <code>theme/</code>
                  </div>
                </li>
              ) : null}
              <li>
                <div className="demo-tree-row demo-tree-nested demo-selected">
                  <HugeiconsIcon icon={FileCodeIcon} size={15} aria-hidden="true" />
                  <code>{choices[style][0].split("/").at(-1)}</code>
                  <span>{choices[style][1]}</span>
                </div>
              </li>
            </ul>
          </li>
          <li>
            <div className="demo-tree-row">
              <HugeiconsIcon icon={FileCodeIcon} size={15} aria-hidden="true" />
              <code>expojet.jsonc</code>
              <span>Your stack, recorded</span>
            </div>
          </li>
        </ul>
      </div>
      <div className="demo-footnote">
        <span aria-hidden="true">↗</span> Your code. Ready to make your own.
      </div>
    </section>
  );
}
