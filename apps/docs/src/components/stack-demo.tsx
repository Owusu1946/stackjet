"use client";

import { useState } from "react";

const choices = {
  NativeWind: ["global.css", "Utility-first styling"],
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
      <div className="demo-choices" role="group" aria-label="Styling approach">
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
      </div>
      <div className="demo-output" aria-live="polite" aria-atomic="true">
        <div className="demo-caption">
          <span>02 / YOUR PROJECT</span>
          <span>↘</span>
        </div>
        <div className="demo-root">
          my-app <span>/</span>
        </div>
        <dl>
          <div>
            <dt>app/</dt>
            <dd>Expo Router</dd>
          </div>
          <div>
            <dt>src/components/</dt>
            <dd>Your building blocks</dd>
          </div>
          <div className="demo-selected">
            <dt>{choices[style][0]}</dt>
            <dd>{choices[style][1]}</dd>
          </div>
          <div>
            <dt>expojet.jsonc</dt>
            <dd>Your stack, recorded</dd>
          </div>
        </dl>
      </div>
      <div className="demo-footnote">
        <span aria-hidden="true">↗</span> Your code. Ready to make your own.
      </div>
    </section>
  );
}
