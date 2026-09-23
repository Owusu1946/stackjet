"use client";

import { commandName, createPackageName } from "@expojet/brand";
import {
  Cancel01Icon,
  CodeIcon,
  Copy01Icon,
  GlassWaterIcon,
  Layers01Icon,
  LayoutBottomIcon,
  LayoutDashboardIcon,
  Moon02Icon,
  PlusSignIcon,
  Rocket01Icon,
  Settings02Icon,
  SidebarLeftIcon,
  Tick02Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";
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
      {
        value: "tabs",
        label: "Bottom tabs",
        description: "Primary tab navigation",
        icon: "layout-tabs",
      },
      {
        value: "drawer",
        label: "Drawer",
        description: "Side navigation drawer",
        icon: "layout-drawer",
      },
      {
        value: "both",
        label: "Tabs + drawer",
        description: "Combined navigation shell",
        icon: "layout-both",
      },
      {
        value: "stack",
        label: "Stack",
        description: "Focused push navigation",
        icon: "layout-stack",
      },
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
      {
        value: "better-auth",
        label: "Better Auth (experimental)",
        description: "Self-hosted auth for monorepos (requires --experimental)",
        icon: "better-auth",
      },
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
        icon: "uniwind",
      },
      {
        value: "nativewind",
        label: "NativeWind",
        description: "Tailwind CSS for React Native",
        icon: "nativewind",
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
      {
        value: "hugeicons",
        label: "Hugeicons",
        description: "Large modern icon collection",
        icon: "hugeicons",
      },
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
      {
        value: "zustand",
        label: "Zustand",
        description: "Small hook-based stores",
        icon: "zustand",
      },
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
      {
        value: "aptabase",
        label: "Aptabase",
        description: "Privacy-first app analytics",
        icon: "aptabase",
      },
    ],
  },
];

const socialOptions: Option[] = [
  { value: "google", label: "Google", description: "Google OAuth", icon: "google" },
  { value: "apple", label: "Apple", description: "Sign in with Apple", icon: "apple" },
  { value: "facebook", label: "Facebook", description: "Facebook Login", icon: "facebook" },
  { value: "microsoft", label: "Microsoft", description: "Microsoft identity", icon: "microsoft" },
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

const presets: Array<{ id: string; label: string; description: string; config: Config }> = [
  {
    id: "mvp",
    label: "Expo MVP",
    description: "Tabs, dark mode, onboarding, and EAS",
    config: defaults,
  },
  {
    id: "full-stack",
    label: "Full-stack Expo",
    description: "Mobile + API with Convex and Clerk",
    config: {
      ...defaults,
      structure: "monorepo",
      backend: "convex",
      database: "none",
      orm: "none",
    },
  },
  {
    id: "minimal",
    label: "Minimal app",
    description: "A focused client-only Expo app",
    config: {
      ...defaults,
      navigationType: "stack",
      auth: "none",
      socials: [],
      style: "stylesheet",
      state: "none",
      backend: "none",
      database: "none",
      orm: "none",
      analytics: "none",
      liquidGlass: false,
      onboarding: false,
      darkMode: false,
      eas: false,
    },
  },
];

const featureOptions = [
  {
    key: "liquidGlass",
    label: "Liquid Glass",
    description: "Native glass navigation in Expo Go",
    icon: "feature-glass",
  },
  {
    key: "onboarding",
    label: "Onboarding",
    description: "Multi-step first-run experience",
    icon: "feature-onboarding",
  },
  {
    key: "darkMode",
    label: "Dark mode",
    description: "Persistent theme switching",
    icon: "feature-dark-mode",
  },
  {
    key: "eas",
    label: "EAS",
    description: "Development, preview, and production profiles",
    icon: "feature-eas",
  },
] as const;

const categories: Array<{ key: CategoryKey; label: string }> = [
  ...groups.map(({ key, label }) => ({ key, label })),
  { key: "socials", label: "Socials" },
  { key: "features", label: "Features" },
];
const requiredChoices = new Set<keyof Config>([
  "structure",
  "navigation",
  "navigationType",
  "style",
  "icons",
]);

function iconPath(icon: string) {
  return `/stack-icons/${icon}.svg`;
}

const uiIcons = {
  "layout-tabs": LayoutBottomIcon,
  "layout-drawer": SidebarLeftIcon,
  "layout-both": LayoutDashboardIcon,
  "layout-stack": Layers01Icon,
  "feature-glass": GlassWaterIcon,
  "feature-onboarding": UserAdd01Icon,
  "feature-dark-mode": Moon02Icon,
  "feature-eas": Rocket01Icon,
};
const themeIcons = new Set([
  "apple",
  "better-auth",
  "clerk",
  "drizzle",
  "hugeicons",
  "nativewind",
  "prisma",
  "uniwind",
]);
const monochromeIcons = new Set(["aptabase", "express", "zustand"]);

function BuilderChoiceIcon({ icon, size }: { icon: string; size: number }) {
  if (icon in uiIcons) {
    return (
      <HugeiconsIcon
        icon={uiIcons[icon as keyof typeof uiIcons]}
        size={size}
        strokeWidth={1.8}
        aria-hidden="true"
      />
    );
  }
  if (themeIcons.has(icon)) {
    return (
      <span className="builder-theme-icon" style={{ width: size, height: size }} aria-hidden="true">
        <Image
          className="builder-icon-light"
          src={iconPath(icon)}
          alt=""
          width={size}
          height={size}
        />
        <Image
          className="builder-icon-dark"
          src={iconPath(`${icon}-dark`)}
          alt=""
          width={size}
          height={size}
        />
      </span>
    );
  }
  return (
    <Image
      src={iconPath(icon)}
      alt=""
      width={size}
      height={size}
      className={
        icon === "expo"
          ? "builder-expo-icon"
          : monochromeIcons.has(icon)
            ? "builder-monochrome-icon"
            : undefined
      }
    />
  );
}

export function StackBuilder() {
  const [projectName, setProjectName] = useState("my-expojet-app");
  const [packageManager, setPackageManager] = useState<PackageManager>("pnpm");
  const [config, setConfig] = useState<Config>(defaults);
  const [activeGroup, setActiveGroup] = useState<CategoryKey>("structure");
  const [view, setView] = useState<"configure" | "preview">("configure");
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string>();
  const [preset, setPreset] = useState("");

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
    if (config.auth === "better-auth") flags.push("--experimental");
    if (config.auth === "clerk" && config.socials.length)
      flags.push(`--socials ${config.socials.join(" ")}`);
    return `${starters[packageManager]} ${safeName} ${flags.join(" ")}`;
  }, [config, packageManager, projectName]);
  const { status: copyStatus, copy: copyCommand } = useCopyFeedback(command);

  useEffect(() => {
    if (view !== "configure") return;
    const sections = categories
      .map((category) => document.getElementById(`builder-section-${category.key}`))
      .filter((section): section is HTMLElement => section !== null);
    const observer = new IntersectionObserver(
      () => {
        const marker = Math.min(window.innerHeight * 0.45, 380);
        let current: CategoryKey = "structure";
        for (const section of sections) {
          if (section.getBoundingClientRect().top <= marker) {
            current = section.id.replace("builder-section-", "") as CategoryKey;
          }
        }
        setActiveGroup(current);
      },
      { rootMargin: "-80px 0px -45% 0px" },
    );
    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [view]);

  useEffect(() => {
    if (view !== "configure") return;
    const pill = document.querySelector<HTMLButtonElement>(
      `.builder-tabs button[data-section="${activeGroup}"]`,
    );
    const nav = pill?.parentElement;
    if (!pill || !nav) return;
    nav.scrollTo({
      left: pill.offsetLeft - nav.offsetLeft - nav.clientWidth / 2 + pill.clientWidth / 2,
      behavior: "auto",
    });
  }, [activeGroup, view]);

  function jumpToSection(key: CategoryKey) {
    setActiveGroup(key);
    document.getElementById(`builder-section-${key}`)?.scrollIntoView({
      behavior: "auto",
      block: "start",
    });
  }

  const safeProjectName =
    projectName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-") || "my-expojet-app";
  const selected = groups
    .map((group) => {
      const option = group.options.find((item) => item.value === config[group.key]);
      return option && option.value !== "none" ? { ...option, key: group.key } : null;
    })
    .filter((item): item is Option & { key: keyof Config } => item !== null);

  function canRemoveChoice(key: keyof Config) {
    if (requiredChoices.has(key)) return false;
    if (key === "backend" && config.structure !== "standalone") return false;
    if ((key === "database" || key === "orm") && config.auth === "better-auth") return false;
    return true;
  }

  function removeChoice(key: keyof Config) {
    setConfig((current) => {
      if (key === "auth") return { ...current, auth: "none", socials: [] };
      if (key === "backend") {
        return { ...current, backend: "none", database: "none", orm: "none" };
      }
      if (key === "database") return { ...current, database: "none", orm: "none" };
      if (key === "orm") return { ...current, orm: "none" };
      if (key === "state") return { ...current, state: "none" };
      if (key === "analytics") return { ...current, analytics: "none" };
      return current;
    });
  }

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

  function resetBuilder() {
    setProjectName("my-expojet-app");
    setPackageManager("pnpm");
    setConfig(defaults);
    setActiveGroup("structure");
    setPreset("");
  }

  function applyPreset(id: string) {
    const selectedPreset = presets.find((item) => item.id === id);
    if (!selectedPreset) return;
    setConfig({ ...selectedPreset.config, socials: [...selectedPreset.config.socials] });
    setPreset(id);
    setActiveGroup("structure");
  }

  return (
    <section className="stack-builder" id="builder" aria-label="Expo app stack builder">
      <div className="builder-layout">
        <aside className="builder-sidebar">
          <div className="builder-sidebar-content">
            <label className="builder-field">
              <span>Project name</span>
              <input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                spellCheck={false}
                aria-describedby="project-name-hint"
              />
              <small id="project-name-hint">Folder: {safeProjectName}</small>
            </label>
            <div className="builder-command-heading">
              <span>CLI command</span>
              <button
                type="button"
                onClick={copyCommand}
                aria-label={
                  copyStatus === "copied"
                    ? "Command copied"
                    : copyStatus === "failed"
                      ? "Copy failed. Try again"
                      : "Copy command"
                }
                title={copyStatus === "copied" ? "Copied" : "Copy command"}
              >
                <HugeiconsIcon
                  icon={copyStatus === "copied" ? Tick02Icon : Copy01Icon}
                  size={17}
                  aria-hidden="true"
                />
              </button>
            </div>
            <button
              className="builder-command"
              type="button"
              onClick={copyCommand}
              data-copy-status={copyStatus}
              aria-label={
                copyStatus === "copied"
                  ? "CLI command copied"
                  : copyStatus === "failed"
                    ? "Copy failed. Try again"
                    : "Copy CLI command"
              }
              title={copyStatus === "copied" ? "Copied" : "Click to copy"}
            >
              <code>
                <span>$</span>
                {command}
              </code>
              <span className="builder-command-hint" aria-hidden="true">
                {copyStatus === "copied"
                  ? "Copied"
                  : copyStatus === "failed"
                    ? "Copy failed"
                    : "Click to copy"}
              </span>
            </button>
            <label className="builder-preset">
              <span className="builder-preset-label">Preset</span>
              <select value={preset} onChange={(event) => applyPreset(event.target.value)}>
                <option value="">Choose a starting point</option>
                {presets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <small>
                {presets.find((item) => item.id === preset)?.description ??
                  "Apply a validated configuration"}
              </small>
            </label>
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
              <span>Selected stack</span>
              <b>
                {selected.length +
                  (config.auth === "clerk" ? config.socials.length : 0) +
                  featureOptions.filter((item) => config[item.key]).length}{" "}
                picks
              </b>
            </div>
            <div className="builder-chips">
              {selected.map((item) => (
                <span className="builder-chip" key={item.key}>
                  {item.icon ? <BuilderChoiceIcon icon={item.icon} size={15} /> : null}
                  {item.label}
                  {canRemoveChoice(item.key) ? (
                    <button
                      type="button"
                      aria-label={`Remove ${item.label}`}
                      title={`Remove ${item.label}`}
                      onClick={() => removeChoice(item.key)}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={13} aria-hidden="true" />
                    </button>
                  ) : null}
                </span>
              ))}
              {config.auth === "clerk"
                ? config.socials.map((social) => {
                    const option = socialOptions.find((item) => item.value === social);
                    return (
                      <span className="builder-chip" key={social}>
                        {option?.icon ? <BuilderChoiceIcon icon={option.icon} size={15} /> : null}
                        {option?.label ?? social}
                        <button
                          type="button"
                          aria-label={`Remove ${option?.label ?? social}`}
                          title={`Remove ${option?.label ?? social}`}
                          onClick={() =>
                            setConfig((current) => ({
                              ...current,
                              socials: current.socials.filter((item) => item !== social),
                            }))
                          }
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={13} aria-hidden="true" />
                        </button>
                      </span>
                    );
                  })
                : null}
              {featureOptions
                .filter((option) => config[option.key])
                .map((option) => (
                  <span className="builder-chip" key={option.key}>
                    <BuilderChoiceIcon icon={option.icon} size={15} />
                    {option.label}
                    <button
                      type="button"
                      aria-label={`Remove ${option.label}`}
                      title={`Remove ${option.label}`}
                      onClick={() => toggleFeature(option.key)}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={13} aria-hidden="true" />
                    </button>
                  </span>
                ))}
            </div>
            <button className="builder-reset" type="button" onClick={resetBuilder}>
              Reset choices
            </button>
          </div>
        </aside>
        <div className="builder-main">
          <div className="builder-view-tabs" role="tablist" aria-label="Builder view">
            <button
              type="button"
              role="tab"
              aria-selected={view === "configure"}
              onClick={() => setView("configure")}
            >
              <HugeiconsIcon icon={Settings02Icon} aria-hidden="true" size={16} />
              Configure
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "preview"}
              onClick={() => setView("preview")}
            >
              <HugeiconsIcon icon={CodeIcon} aria-hidden="true" size={16} />
              Preview
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
                    data-section={group.key}
                    data-active={activeGroup === group.key}
                    aria-current={activeGroup === group.key ? "location" : undefined}
                    onClick={() => jumpToSection(group.key)}
                  >
                    {group.label}
                  </button>
                ))}
              </nav>
              <div className="builder-sections">
                {categories.map((category) => {
                  const group = groups.find((item) => item.key === category.key);
                  return (
                    <section
                      className="builder-section"
                      id={`builder-section-${category.key}`}
                      aria-labelledby={`builder-heading-${category.key}`}
                      key={category.key}
                    >
                      <h2 id={`builder-heading-${category.key}`}>{category.label}</h2>
                      {category.key === "socials" && config.auth !== "clerk" ? (
                        <p className="builder-note">Select Clerk to use social sign-in.</p>
                      ) : null}
                      <div className="builder-options">
                        {category.key === "socials"
                          ? socialOptions.map((option) => (
                              <button
                                type="button"
                                key={option.value}
                                disabled={config.auth !== "clerk"}
                                data-active={config.socials.includes(option.value)}
                                aria-pressed={config.socials.includes(option.value)}
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
                                  <BuilderChoiceIcon icon={option.icon} size={24} />
                                ) : null}
                                <span className="builder-option-copy">
                                  <strong>{option.label}</strong>
                                  <small>{option.description}</small>
                                </span>
                                <i>
                                  <HugeiconsIcon
                                    icon={
                                      config.socials.includes(option.value)
                                        ? Tick02Icon
                                        : PlusSignIcon
                                    }
                                    size={17}
                                    aria-hidden="true"
                                  />
                                </i>
                              </button>
                            ))
                          : category.key === "features"
                            ? featureOptions.map((option) => (
                                <button
                                  type="button"
                                  key={option.key}
                                  data-active={config[option.key]}
                                  aria-pressed={config[option.key]}
                                  onClick={() => toggleFeature(option.key)}
                                >
                                  <BuilderChoiceIcon icon={option.icon} size={24} />
                                  <span className="builder-option-copy">
                                    <strong>{option.label}</strong>
                                    <small>{option.description}</small>
                                  </span>
                                  <i>{config[option.key] ? "On" : "Off"}</i>
                                </button>
                              ))
                            : group?.options.map((option) => {
                                const disabled =
                                  (group.key === "backend" &&
                                    config.structure === "standalone" &&
                                    !["none", "convex"].includes(option.value)) ||
                                  (group.key === "backend" &&
                                    config.structure !== "standalone" &&
                                    option.value === "none") ||
                                  (group.key === "database" &&
                                    config.backend === "convex" &&
                                    option.value !== "none") ||
                                  (group.key === "database" &&
                                    config.auth === "better-auth" &&
                                    option.value === "none") ||
                                  (group.key === "orm" &&
                                    (config.database === "none" || config.backend === "convex") &&
                                    option.value !== "none") ||
                                  (group.key === "orm" &&
                                    config.auth === "better-auth" &&
                                    option.value !== "drizzle");
                                return (
                                  <button
                                    type="button"
                                    key={option.value}
                                    disabled={disabled}
                                    data-active={config[group.key] === option.value}
                                    aria-pressed={config[group.key] === option.value}
                                    onClick={() => select(group.key, option.value)}
                                  >
                                    {option.icon ? (
                                      <BuilderChoiceIcon icon={option.icon} size={24} />
                                    ) : (
                                      <span className="builder-placeholder">
                                        {option.label.slice(0, 1)}
                                      </span>
                                    )}
                                    <span className="builder-option-copy">
                                      <strong>{option.label}</strong>
                                      <small>{option.description}</small>
                                    </span>
                                    <i>
                                      <HugeiconsIcon
                                        icon={
                                          config[group.key] === option.value
                                            ? Tick02Icon
                                            : PlusSignIcon
                                        }
                                        size={17}
                                        aria-hidden="true"
                                      />
                                    </i>
                                  </button>
                                );
                              })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
