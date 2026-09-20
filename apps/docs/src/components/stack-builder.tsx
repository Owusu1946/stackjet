"use client";

import { commandName, createPackageName } from "@expojet/brand";
import { Code2, Settings2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { type PreviewFile, StackPreview } from "./stack-preview";

type PackageManager = "pnpm" | "npm" | "bun" | "yarn";
type CategoryKey = keyof Config | "features";
type Config = {
  structure: "standalone" | "monorepo" | "monorepo-web";
  navigation: "router" | "react-navigation";
  navigationType: "tabs" | "drawer" | "both" | "stack";
  auth: "clerk" | "better-auth" | "supabase" | "firebase" | "none";
  socials: string[];
  style: "uniwind" | "nativewind" | "unistyles" | "stylesheet";
  icons: "lucide" | "hugeicons" | "expo";
  state: "none" | "zustand" | "mobx";
  backend: "hono" | "express" | "nestjs" | "convex" | "none";
  database: "neon" | "postgres" | "sqlite" | "supabase" | "none";
  orm: "drizzle" | "prisma" | "none";
  analytics: "none" | "posthog" | "aptabase";
  liquidGlass: boolean;
  onboarding: boolean;
  darkMode: boolean;
  eas: boolean;
};

type Option = { value: string; label: string; description: string; icon?: string };

const groups: Array<{ key: keyof Config; label: string; options: Option[] }> = [
  {
    key: "structure",
    label: "Project",
    options: [
      {
        value: "standalone",
        label: "Standalone",
        description: "Expo app without an API workspace",
        icon: "expo",
      },
      {
        value: "monorepo",
        label: "Mobile + API",
        description: "Expo app with a backend workspace",
        icon: "typescript",
      },
      {
        value: "monorepo-web",
        label: "Mobile + Web + API",
        description: "Full product monorepo",
        icon: "react",
      },
    ],
  },
  {
    key: "navigation",
    label: "Navigation",
    options: [
      {
        value: "router",
        label: "Expo Router",
        description: "File-based routing and native layouts",
        icon: "expo",
      },
      {
        value: "react-navigation",
        label: "React Navigation",
        description: "Component-based navigation",
        icon: "react",
      },
    ],
  },
  {
    key: "navigationType",
    label: "Layout",
    options: [
      { value: "tabs", label: "Bottom tabs", description: "Primary tab navigation" },
      { value: "drawer", label: "Drawer", description: "Side navigation drawer" },
      { value: "both", label: "Tabs + drawer", description: "Combined navigation shell" },
      { value: "stack", label: "Stack", description: "Focused push navigation" },
    ],
  },
  {
    key: "auth",
    label: "Authentication",
    options: [
      {
        value: "clerk",
        label: "Clerk",
        description: "Custom email and hosted social auth",
        icon: "clerk",
      },
      { value: "better-auth", label: "Better Auth", description: "Self-hosted auth for monorepos" },
      {
        value: "supabase",
        label: "Supabase Auth",
        description: "Auth backed by Supabase",
        icon: "supabase",
      },
      {
        value: "firebase",
        label: "Firebase Auth",
        description: "Google Firebase identity",
        icon: "firebase",
      },
      { value: "none", label: "No auth", description: "Start without authentication" },
    ],
  },
  {
    key: "style",
    label: "Styling",
    options: [
      {
        value: "uniwind",
        label: "Uniwind",
        description: "Universal utility-first styling",
        icon: "tailwindcss",
      },
      {
        value: "nativewind",
        label: "NativeWind",
        description: "Tailwind CSS for React Native",
        icon: "tailwindcss",
      },
      {
        value: "unistyles",
        label: "Unistyles",
        description: "Runtime themes and breakpoints",
        icon: "react",
      },
      {
        value: "stylesheet",
        label: "StyleSheet",
        description: "React Native built-in styling",
        icon: "react",
      },
    ],
  },
  {
    key: "icons",
    label: "Icons",
    options: [
      {
        value: "lucide",
        label: "Lucide",
        description: "Clean, consistent outline icons",
        icon: "lucide",
      },
      { value: "hugeicons", label: "Hugeicons", description: "Large modern icon collection" },
      {
        value: "expo",
        label: "Expo Icons",
        description: "Expo vector icon families",
        icon: "expo",
      },
    ],
  },
  {
    key: "backend",
    label: "Backend",
    options: [
      { value: "hono", label: "Hono", description: "Lightweight typed API", icon: "hono" },
      {
        value: "express",
        label: "Express",
        description: "Classic Node.js REST API",
        icon: "express",
      },
      {
        value: "nestjs",
        label: "NestJS",
        description: "Modular enterprise backend",
        icon: "nestjs",
      },
      { value: "convex", label: "Convex", description: "Reactive cloud backend", icon: "convex" },
      { value: "none", label: "No backend", description: "Client-only Expo application" },
    ],
  },
  {
    key: "database",
    label: "Database",
    options: [
      { value: "neon", label: "Neon", description: "Serverless Postgres", icon: "neon" },
      {
        value: "postgres",
        label: "PostgreSQL",
        description: "Local or hosted Postgres",
        icon: "postgresql",
      },
      {
        value: "sqlite",
        label: "SQLite",
        description: "Local-first relational data",
        icon: "sqlite",
      },
      {
        value: "supabase",
        label: "Supabase",
        description: "Managed Postgres platform",
        icon: "supabase",
      },
      { value: "none", label: "No database", description: "No persistence adapter" },
    ],
  },
  {
    key: "orm",
    label: "ORM",
    options: [
      { value: "drizzle", label: "Drizzle", description: "Type-safe SQL toolkit", icon: "drizzle" },
      { value: "prisma", label: "Prisma", description: "Schema-first ORM", icon: "prisma" },
      { value: "none", label: "No ORM", description: "Use the database driver directly" },
    ],
  },
  {
    key: "state",
    label: "State",
    options: [
      {
        value: "none",
        label: "React state",
        description: "No external state manager",
        icon: "react",
      },
      { value: "zustand", label: "Zustand", description: "Small hook-based stores" },
      { value: "mobx", label: "MobX", description: "Reactive application state", icon: "mobx" },
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    options: [
      { value: "none", label: "No analytics", description: "No tracking adapter" },
      {
        value: "posthog",
        label: "PostHog",
        description: "Product analytics and events",
        icon: "posthog",
      },
      { value: "aptabase", label: "Aptabase", description: "Privacy-first app analytics" },
    ],
  },
];

const socialOptions: Option[] = [
  { value: "google", label: "Google", description: "Google OAuth", icon: "google" },
  { value: "apple", label: "Apple", description: "Sign in with Apple", icon: "apple" },
  { value: "facebook", label: "Facebook", description: "Facebook Login", icon: "facebook" },
  { value: "microsoft", label: "Microsoft", description: "Microsoft identity" },
];

const defaults: Config = {
  structure: "standalone",
  navigation: "router",
  navigationType: "tabs",
  auth: "clerk",
  socials: ["google", "apple"],
  style: "uniwind",
  icons: "lucide",
  state: "none",
  backend: "none",
  database: "none",
  orm: "none",
  analytics: "none",
  liquidGlass: true,
  onboarding: true,
  darkMode: true,
  eas: true,
};

const featureOptions = [
  { key: "liquidGlass", label: "Liquid Glass", description: "Native glass navigation in Expo Go" },
  { key: "onboarding", label: "Onboarding", description: "Multi-step first-run experience" },
  { key: "darkMode", label: "Dark mode", description: "Persistent theme switching" },
  { key: "eas", label: "EAS", description: "Development, preview, and production profiles" },
] as const;

const categories: Array<{ key: CategoryKey; label: string }> = [
  ...groups.map(({ key, label }) => ({ key, label })),
  { key: "socials", label: "Socials" },
  { key: "features", label: "Features" },
];

function iconPath(icon: string) {
  return `/stack-icons/${icon}.svg`;
}

export function StackBuilder() {
  const [projectName, setProjectName] = useState("my-expojet-app");
  const [packageManager, setPackageManager] = useState<PackageManager>("pnpm");
  const [config, setConfig] = useState<Config>(defaults);
  const [activeGroup, setActiveGroup] = useState<CategoryKey>("structure");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [view, setView] = useState<"configure" | "preview">("configure");
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string>();

  const select = (key: keyof Config, value: string) => {
    setConfig((current) => {
      const next = { ...current, [key]: value } as Config;
      if (key === "structure") {
        if (value === "standalone") {
          next.backend = next.backend === "convex" ? "convex" : "none";
          if (["neon", "postgres"].includes(next.database)) next.database = "none";
          if (next.orm === "prisma") next.orm = "none";
          if (next.auth === "better-auth") next.auth = "clerk";
        } else if (next.backend === "none") {
          next.backend = "hono";
          next.database = "neon";
          next.orm = "drizzle";
        }
      }
      if (key === "backend" && value === "convex") {
        next.database = "none";
        next.orm = "none";
        if (!["clerk", "none"].includes(next.auth)) next.auth = "clerk";
      }
      if (key === "database" && value === "none") next.orm = "none";
      if (key === "auth" && value === "better-auth") {
        next.structure = "monorepo";
        next.backend = next.backend === "none" ? "hono" : next.backend;
        next.database = next.database === "none" ? "neon" : next.database;
        next.orm = "drizzle";
      }
      if (key === "navigation" && value === "react-navigation") next.liquidGlass = false;
      return next;
    });
  };

  const toggleFeature = (key: (typeof featureOptions)[number]["key"]) => {
    setConfig((current) => {
      const enabled = !current[key];
      return {
        ...current,
        [key]: enabled,
        ...(key === "liquidGlass" && enabled ? { navigation: "router" as const } : {}),
      };
    });
  };

  const command = useMemo(() => {
    const safeName =
      projectName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, "-") || "my-expojet-app";
    const starters: Record<PackageManager, string> = {
      pnpm: `pnpm create ${commandName}@latest`,
      npm: `npx ${createPackageName}@latest`,
      bun: `bun create ${commandName}@latest`,
      yarn: `yarn create ${commandName}`,
    };
    const flags = [
      `--package-manager ${packageManager}`,
      `--structure ${config.structure}`,
      `--navigation ${config.navigation}`,
      `--navigation-type ${config.navigationType}`,
      `--auth ${config.auth}`,
      `--style ${config.style}`,
      `--icons ${config.icons}`,
      `--state ${config.state}`,
      `--backend ${config.backend}`,
      `--database ${config.database}`,
      `--orm ${config.orm}`,
      `--analytics ${config.analytics}`,
      config.liquidGlass ? "--liquid-glass" : "--no-liquid-glass",
      config.onboarding ? "--onboarding" : "--no-onboarding",
      config.darkMode ? "--dark-mode" : "--no-dark-mode",
      config.eas ? "--eas" : "--no-eas",
      "--yes",
    ];
    if (config.auth === "clerk" && config.socials.length)
      flags.push(`--socials ${config.socials.join(" ")}`);
    return `${starters[packageManager]} ${safeName} ${flags.join(" ")}`;
  }, [config, packageManager, projectName]);

  const active = groups.find((group) => group.key === activeGroup);
  const activeIndex = categories.findIndex((category) => category.key === activeGroup);
  const safeProjectName =
    projectName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-") || "my-expojet-app";
  const selected = groups
    .map((group) => {
      const option = group.options.find((item) => item.value === config[group.key]);
      return option ? { ...option, group: group.label } : null;
    })
    .filter(Boolean) as Array<Option & { group: string }>;

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setPreviewLoading(true);
      setPreviewError(undefined);
      try {
        const response = await fetch("/api/builder-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectName: safeProjectName,
            destination: `/preview/${safeProjectName}`,
            structure: config.structure,
            packageManager,
            navigation: config.navigation,
            navigationType: config.navigationType,
            typescript: true,
            icons: config.icons,
            state: config.state,
            liquidGlass: config.liquidGlass,
            analytics: config.analytics,
            backend: config.backend,
            auth: config.auth,
            socialProviders: config.auth === "clerk" ? config.socials : [],
            style: config.style,
            database: config.database,
            orm: config.orm,
            onboarding: config.onboarding,
            darkMode: config.darkMode,
            eas: config.eas,
            install: true,
            git: true,
            sdk: 57,
          }),
          signal: controller.signal,
        });
        const payload = (await response.json()) as { files?: PreviewFile[]; error?: string };
        if (!response.ok || !payload.files) throw new Error(payload.error ?? "Preview failed");
        setPreviewFiles(payload.files);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPreviewError(error instanceof Error ? error.message : "Unable to render preview");
      } finally {
        if (!controller.signal.aborted) setPreviewLoading(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [config, packageManager, safeProjectName]);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
    window.setTimeout(() => setCopyStatus("idle"), 1800);
  }

  function resetBuilder() {
    setProjectName("my-expojet-app");
    setPackageManager("pnpm");
    setConfig(defaults);
    setActiveGroup("structure");
  }

  function moveCategory(offset: number) {
    const next = categories[activeIndex + offset];
    if (next) setActiveGroup(next.key);
  }

  return (
    <section className="stack-builder" id="builder" aria-labelledby="builder-title">
      <header className="builder-heading">
        <div>
          <span className="panel-kicker">INTERACTIVE BUILDER</span>
          <h2 id="builder-title">Choose the stack. Copy the command.</h2>
        </div>
        <div className="builder-progress-copy">
          <p>Every option maps to the real Expojet CLI and compatibility schema.</p>
          <span>
            STEP {String(activeIndex + 1).padStart(2, "0")} / {categories.length}
          </span>
        </div>
      </header>
      <div className="builder-layout">
        <aside className="builder-sidebar">
          <label className="builder-field">
            <span>PROJECT NAME</span>
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              spellCheck={false}
              aria-describedby="project-name-hint"
            />
            <small id="project-name-hint">Folder: {safeProjectName}</small>
          </label>
          <div className="builder-command-heading">
            <span>CLI COMMAND</span>
            <button type="button" onClick={copyCommand}>
              {copyStatus === "copied"
                ? "COPIED ✓"
                : copyStatus === "failed"
                  ? "TRY AGAIN"
                  : "COPY"}
            </button>
          </div>
          <code className="builder-command">
            <span>$</span>
            {command}
          </code>
          <fieldset className="builder-manager" aria-label="Package manager">
            {(["pnpm", "npm", "bun", "yarn"] as const).map((manager) => (
              <button
                type="button"
                key={manager}
                data-active={packageManager === manager}
                onClick={() => setPackageManager(manager)}
              >
                <Image src={iconPath(manager)} alt="" width={16} height={16} />
                {manager}
              </button>
            ))}
          </fieldset>
          <div className="builder-selected-heading">
            <span>SELECTED STACK</span>
            <b>
              {selected.length +
                config.socials.length +
                featureOptions.filter((item) => config[item.key]).length}{" "}
              PICKS
            </b>
          </div>
          <div className="builder-chips">
            {selected.map((item) => (
              <span key={item.group}>
                {item.icon ? (
                  <Image src={iconPath(item.icon)} alt="" width={15} height={15} />
                ) : null}
                {item.label}
              </span>
            ))}
            {config.auth === "clerk"
              ? config.socials.map((social) => <span key={social}>{social}</span>)
              : null}
          </div>
          <button className="builder-reset" type="button" onClick={resetBuilder}>
            RESET CONFIGURATION
          </button>
        </aside>
        <div className="builder-main">
          <div className="builder-view-tabs" role="tablist" aria-label="Builder view">
            <button
              type="button"
              role="tab"
              aria-selected={view === "configure"}
              onClick={() => setView("configure")}
            >
              <Settings2 aria-hidden="true" size={15} />
              CONFIGURE
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "preview"}
              onClick={() => setView("preview")}
            >
              <Code2 aria-hidden="true" size={15} />
              PREVIEW
            </button>
          </div>
          {view === "preview" ? (
            <StackPreview
              projectName={safeProjectName}
              files={previewFiles}
              loading={previewLoading}
              error={previewError}
            />
          ) : (
            <>
              <nav className="builder-tabs" aria-label="Stack categories">
                {categories.map((group) => (
                  <button
                    type="button"
                    key={group.key}
                    data-active={activeGroup === group.key}
                    onClick={() => setActiveGroup(group.key)}
                  >
                    {group.label}
                  </button>
                ))}
              </nav>
              <div className="builder-stage-heading">
                <div>
                  <span>STEP {String(activeIndex + 1).padStart(2, "0")}</span>
                  <h2>{categories[activeIndex]?.label}</h2>
                </div>
                <div className="builder-progress-track" aria-hidden="true">
                  <i style={{ width: `${((activeIndex + 1) / categories.length) * 100}%` }} />
                </div>
              </div>
              <div className="builder-options">
                {activeGroup === "socials"
                  ? socialOptions.map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        disabled={config.auth !== "clerk"}
                        data-active={config.socials.includes(option.value)}
                        onClick={() =>
                          setConfig((current) => ({
                            ...current,
                            socials: current.socials.includes(option.value)
                              ? current.socials.filter((item) => item !== option.value)
                              : [...current.socials, option.value],
                          }))
                        }
                      >
                        {option.icon ? (
                          <Image src={iconPath(option.icon)} alt="" width={24} height={24} />
                        ) : null}
                        <span className="builder-option-copy">
                          <strong>{option.label}</strong>
                          <small>{option.description}</small>
                        </span>
                        <i>{config.socials.includes(option.value) ? "✓" : "+"}</i>
                      </button>
                    ))
                  : activeGroup === "features"
                    ? featureOptions.map((option) => (
                        <button
                          type="button"
                          key={option.key}
                          data-active={config[option.key]}
                          onClick={() => toggleFeature(option.key)}
                        >
                          <span className="builder-option-copy">
                            <strong>{option.label}</strong>
                            <small>{option.description}</small>
                          </span>
                          <i>{config[option.key] ? "ON" : "OFF"}</i>
                        </button>
                      ))
                    : active?.options.map((option) => {
                        const disabled =
                          (active.key === "backend" &&
                            config.structure === "standalone" &&
                            !["none", "convex"].includes(option.value)) ||
                          (active.key === "database" &&
                            config.backend === "convex" &&
                            option.value !== "none") ||
                          (active.key === "orm" &&
                            (config.database === "none" || config.backend === "convex") &&
                            option.value !== "none");
                        return (
                          <button
                            type="button"
                            key={option.value}
                            disabled={disabled}
                            data-active={config[active.key] === option.value}
                            onClick={() => select(active.key, option.value)}
                          >
                            {option.icon ? (
                              <Image src={iconPath(option.icon)} alt="" width={24} height={24} />
                            ) : (
                              <span className="builder-placeholder">
                                {option.label.slice(0, 1)}
                              </span>
                            )}
                            <span className="builder-option-copy">
                              <strong>{option.label}</strong>
                              <small>{option.description}</small>
                            </span>
                            <i>{config[active.key] === option.value ? "✓" : "+"}</i>
                          </button>
                        );
                      })}
              </div>
              <p className="builder-note">
                {activeGroup === "socials" && config.auth !== "clerk"
                  ? "Select Clerk authentication to configure hosted social sign-in."
                  : "Incompatible choices are disabled or normalized automatically."}
              </p>
              <div className="builder-step-actions">
                <button type="button" disabled={activeIndex === 0} onClick={() => moveCategory(-1)}>
                  ← Previous
                </button>
                <span>{categories[activeIndex]?.label}</span>
                <button
                  type="button"
                  disabled={activeIndex === categories.length - 1}
                  onClick={() => moveCategory(1)}
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
