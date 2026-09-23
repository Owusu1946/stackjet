import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";
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
        text: "Home",
        url: "/",
      },
      {
        text: "Builder",
        url: "/builder",
      },
      {
        text: "Docs",
        url: "/docs",
        active: "nested-url",
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
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    themeSwitch: { enabled: false },
  };
}
