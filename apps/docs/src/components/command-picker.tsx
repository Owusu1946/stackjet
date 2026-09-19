"use client";

import Image from "next/image";
import { useState } from "react";

const commands = {
  pnpm: "pnpm create expojet@latest",
  npm: "npx create-expojet@latest",
  bun: "bun create expojet@latest",
  yarn: "yarn create expojet",
} as const;

type PackageManager = keyof typeof commands;

function ManagerIcon({ name }: { name: PackageManager }) {
  if (name === "yarn")
    return (
      <Image
        className="manager-icon yarn-icon"
        src="/icons/yarn.svg"
        alt=""
        width={18}
        height={18}
      />
    );
  if (name === "npm")
    return (
      <svg className="manager-icon svg-manager-icon npm-svg" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" />
      </svg>
    );
  if (name === "pnpm")
    return (
      <svg
        className="manager-icon svg-manager-icon pnpm-svg"
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <path d="M30 10.75h-8.75V2H30zM20.374 10.75h-8.75V2h8.75zM10.749 10.75H2V2h8.749zM30 20.375h-8.75v-8.75H30z" />
        <path
          d="M20.374 20.375h-8.75v-8.75h8.75zM20.374 30h-8.75v-8.75h8.75zM30 30h-8.75v-8.75H30zM10.749 30H2v-8.75h8.749z"
          opacity=".95"
        />
      </svg>
    );
  if (name === "bun") {
    return (
      <Image className="manager-icon bun-svg" src="/icons/bun.svg" alt="" width={18} height={18} />
    );
  }
  return (
    <span className="manager-icon pnpm-icon" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function CommandPicker() {
  const [manager, setManager] = useState<PackageManager>("pnpm");
  const [copied, setCopied] = useState(false);

  async function copyCommand() {
    await navigator.clipboard.writeText(commands[manager]);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  }

  return (
    <div className="install-workflow">
      <div className="group-label">
        <span>PACKAGE MANAGER</span>
        <i />
      </div>
      <fieldset className="manager-list" aria-label="Package manager">
        {(Object.keys(commands) as PackageManager[]).map((name) => (
          <button
            key={name}
            type="button"
            data-active={manager === name}
            onClick={() => setManager(name)}
          >
            <ManagerIcon name={name} /> {name}
          </button>
        ))}
      </fieldset>
      <div className="group-label">
        <span>COMMAND</span>
        <i />
      </div>
      <div className="command-line">
        <span className="prompt">$</span>
        <code>{commands[manager]}</code>
        <button type="button" onClick={copyCommand} className="copy-command" aria-live="polite">
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span className="sr-only">{copied ? "Copied" : "Copy command"}</span>
        </button>
      </div>
    </div>
  );
}
