"use client";

import { manifestFileName } from "@expojet/brand";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { createContext, type ReactNode, use, useState } from "react";
import { CopyCommand } from "@/components/copy-command";
import {
  createCommand,
  type PackageManager,
  packageManagers,
  supportsPackageManager,
} from "@/lib/create-command";

const projectName = "my-app";
const sdks = [
  { value: 57, label: "SDK 57" },
  { value: 58, label: "SDK 58 beta" },
] as const;
const auths = [
  { value: "clerk", label: "Clerk" },
  { value: "supabase", label: "Supabase Auth" },
  { value: "firebase", label: "Firebase Auth" },
  { value: "none", label: "No auth" },
] as const;
const styles = [
  { value: "uniwind", label: "Uniwind" },
  { value: "nativewind", label: "NativeWind" },
  { value: "unistyles", label: "Unistyles" },
  { value: "stylesheet", label: "StyleSheet" },
] as const;

type Launch = {
  packageManager: PackageManager;
  sdk: (typeof sdks)[number]["value"];
  auth: (typeof auths)[number]["value"];
  style: (typeof styles)[number]["value"];
};

const defaults: Launch = { packageManager: "pnpm", sdk: 57, auth: "clerk", style: "uniwind" };

const LaunchContext = createContext<{
  launch: Launch;
  setLaunch: (next: Launch) => void;
}>({ launch: defaults, setLaunch: () => {} });

function commandFor({ packageManager, sdk, auth, style }: Launch) {
  return createCommand(packageManager, projectName, [
    `--sdk ${sdk}`,
    `--auth ${auth}`,
    `--style ${style}`,
    "--yes",
  ]);
}

/** Shares the takeoff switchboard's choices with the sections that echo them. */
export function LaunchProvider({ children }: { children: ReactNode }) {
  const [launch, setLaunch] = useState(defaults);
  return <LaunchContext value={{ launch, setLaunch }}>{children}</LaunchContext>;
}

function SwitchRow<T extends string | number>({
  label,
  options,
  value,
  onSelect,
  isDisabled,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onSelect: (value: T) => void;
  isDisabled?: (value: T) => boolean;
}) {
  return (
    <fieldset className="launch-row">
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            disabled={isDisabled?.(option.value)}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function LaunchSwitchboard() {
  const { launch, setLaunch } = use(LaunchContext);
  return (
    <div className="launch-board home-glass">
      <div className="launch-switches">
        <SwitchRow
          label="Package"
          options={packageManagers.map((manager) => ({ value: manager, label: manager }))}
          value={launch.packageManager}
          onSelect={(packageManager) => setLaunch({ ...launch, packageManager })}
          isDisabled={(manager) => !supportsPackageManager(launch.sdk, manager)}
        />
        <SwitchRow
          label="Expo SDK"
          options={sdks}
          value={launch.sdk}
          onSelect={(sdk) =>
            setLaunch({
              ...launch,
              sdk,
              // Matches the Stack Builder: the SDK 58 beta pack has no Yarn support.
              packageManager: supportsPackageManager(sdk, launch.packageManager)
                ? launch.packageManager
                : "pnpm",
            })
          }
        />
        <SwitchRow
          label="Auth"
          options={auths}
          value={launch.auth}
          onSelect={(auth) => setLaunch({ ...launch, auth })}
        />
        <SwitchRow
          label="Styling"
          options={styles}
          value={launch.style}
          onSelect={(style) => setLaunch({ ...launch, style })}
        />
      </div>
      <div className="launch-output">
        <p className="launch-caption">
          <span>Your command</span>
          <span>All systems go</span>
        </p>
        <div className="launch-command">
          <CopyCommand value={commandFor(launch)} />
        </div>
        <p className="launch-note">
          Four of the switches. Navigation, backend, database and the rest are in the{" "}
          <Link href="/builder">full builder</Link>.
        </p>
      </div>
    </div>
  );
}

/** Lines the CLI prints for this command, abridged where the output is machine specific. */
export function LaunchTerminal() {
  const { launch } = use(LaunchContext);
  const { packageManager, sdk, auth, style } = launch;
  return (
    <div className="launch-terminal home-glass">
      <div className="launch-terminal-bar" aria-hidden="true">
        <span className="launch-dot" />
        <span className="launch-dot" />
        <span className="launch-dot" />
        {projectName}
      </div>
      <pre>
        <code>
          <span className="launch-prompt">$ </span>
          {commandFor(launch)}
          {"\n"}
          <span className="launch-step">◇ </span>Files generated atomically{"\n"}
          <span className="launch-step">◇ </span>Git repository initialized{"\n"}
          <span className="launch-step">◇ </span>Dependencies installed with {packageManager}
          {"\n"}
          <span className="launch-ok">✓ </span>Project generated atomically{"\n"}
          <span className="launch-dim">
            {"  "}Structure: standalone{"\n"}
            {"  "}Package manager: {packageManager}
            {"\n"}
            {"  "}…{"\n"}
            {"  "}Authentication: {auth}
            {"\n"}
            {"  "}Styling: {style}
            {"\n"}
            {"  "}…{"\n"}
            {"  "}Foundation: Expo SDK {sdk}, Expo Router, strict TypeScript, tests{"\n"}
          </span>
          <strong>
            └{" "}
            <HugeiconsIcon
              icon={SparklesIcon}
              size={14}
              strokeWidth={1.8}
              className="launch-icon"
              aria-hidden="true"
            />{" "}
            Project {projectName} is ready!
          </strong>
          {"\n"}
          <span className="launch-prompt">$ </span>cd {projectName} && {packageManager} run dev
        </code>
      </pre>
    </div>
  );
}

/** The opening of the manifest this command writes, abridged. */
export function LaunchRecord() {
  const { packageManager, sdk, auth, style } = use(LaunchContext).launch;
  return (
    <pre className="home-code">
      <code>
        <span className="launch-dim">{`// ${manifestFileName}`}</span>
        {"\n{\n"}
        <span className="launch-dim">{"  …\n"}</span>
        {`  "sdk": ${sdk},\n  "structure": "standalone",\n  "packageManager": "${packageManager}",\n  "adapters": {\n    "auth": "${auth}",\n    "style": "${style}",\n`}
        <span className="launch-dim">{"    …\n"}</span>
        {"  }\n}"}
      </code>
    </pre>
  );
}

export function LaunchCommand() {
  return (
    <div className="home-command home-command-wide">
      <CopyCommand value={commandFor(use(LaunchContext).launch)} />
    </div>
  );
}
