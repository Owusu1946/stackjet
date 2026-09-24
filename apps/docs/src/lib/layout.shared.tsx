import { GithubIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";
import { DocsThemeSwitch } from "@/components/docs-theme-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { appName, gitConfig } from "./shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image src="/brand/expojet-mark.svg" alt="" width={24} height={24} priority />
          <span className="font-bold">{appName}</span>
        </>
      ),
      children: <ThemeToggle />,
    },
    links: [
      {
        text: "Builder",
        url: "/builder",
      },
      {
        text: "Documentation",
        url: "/docs",
      },
      {
        text: "Quick Start",
        url: "/docs/quick-start",
      },
      {
        text: "CLI",
        url: "/docs/cli/create",
      },
      {
        text: "AI Agents",
        url: "/docs/ai-agents",
      },
      {
        text: "Changelog",
        url: "/changelog",
      },
      {
        type: "icon",
        text: "GitHub",
        label: "GitHub",
        icon: <HugeiconsIcon icon={GithubIcon} size={19} aria-hidden="true" />,
        url: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
        external: true,
      },
    ],
    themeSwitch: { enabled: true },
    slots: { themeSwitch: DocsThemeSwitch },
  };
}
