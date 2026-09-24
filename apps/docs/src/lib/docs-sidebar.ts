import type { Folder, Item, Node, Root } from "fumadocs-core/page-tree";

const docsPages = {
  overview: "/docs",
  installation: "/docs/installation",
  quickStart: "/docs/quick-start",
  structure: "/docs/folder-structure",
  aiAgents: "/docs/ai-agents",
  icons: "/docs/guides/icons",
  state: "/docs/guides/state",
  liquidGlass: "/docs/guides/liquid-glass",
  haptics: "/docs/guides/haptics",
  analytics: "/docs/guides/analytics",
  monitoring: "/docs/guides/monitoring",
  presets: "/docs/guides/presets",
  eas: "/docs/guides/eas",
} as const;

function normalizePath(path: string) {
  return path.replaceAll("\\", "/").replace(/\/+$/, "");
}

function makeFolder(id: string, name: string, children: Node[]): Folder {
  return {
    $id: `expojet-docs-${id}`,
    type: "folder",
    name,
    collapsible: true,
    defaultOpen: false,
    children,
  };
}

function findPage(nodes: Node[], url: string): Item | undefined {
  for (const node of nodes) {
    if (node.type === "page" && node.url === url) return node;
    if (node.type === "folder") {
      const page = findPage(node.children, url);
      if (page) return page;
    }
  }
}

function findFolder(nodes: Node[], name: string): Folder | undefined {
  for (const node of nodes) {
    if (
      node.type === "folder" &&
      normalizePath(node.$ref?.folder ?? "")
        .split("/")
        .at(-1) === name
    ) {
      return node;
    }
    if (node.type === "folder") {
      const folder = findFolder(node.children, name);
      if (folder) return folder;
    }
  }
}

function without(nodes: Node[], excluded: Set<Node>): Node[] {
  return nodes.filter((node) => node.type !== "separator" && !excluded.has(node));
}

function isDefined<T>(node: T | undefined): node is T {
  return node !== undefined;
}

export function organizeDocsSidebar(root: Root): Root {
  const guides = findFolder(root.children, "guides");
  const cli = findFolder(root.children, "cli");
  const guideChildren = guides?.children ?? [];
  const usedRootNodes = new Set<Node>([guides, cli].filter((node): node is Folder => !!node));
  const usedGuideNodes = new Set<Node>();

  function rootPage(url: string) {
    const page = findPage(root.children, url);
    if (page) usedRootNodes.add(page);
    return page;
  }

  function guidePage(url: string) {
    const page = findPage(guideChildren, url);
    if (page) usedGuideNodes.add(page);
    return page;
  }

  function guideFolder(name: string) {
    const folder = findFolder(guideChildren, name);
    if (folder) usedGuideNodes.add(folder);
    return folder;
  }

  const appPages = [
    guideFolder("styling"),
    guideFolder("navigation"),
    guidePage(docsPages.icons),
    guidePage(docsPages.state),
    guidePage(docsPages.liquidGlass),
    guidePage(docsPages.haptics),
    guidePage(docsPages.presets),
  ].filter(isDefined);

  const servicePages = [
    guideFolder("authentication"),
    guideFolder("backend"),
    guideFolder("database"),
    guideFolder("managed-cloud"),
    guidePage(docsPages.analytics),
    guidePage(docsPages.monitoring),
  ].filter(isDefined);

  const toolingPages = [cli, rootPage(docsPages.aiAgents), guidePage(docsPages.eas)].filter(
    isDefined,
  );

  const gettingStartedPages = [
    rootPage(docsPages.overview),
    rootPage(docsPages.installation),
    rootPage(docsPages.quickStart),
    rootPage(docsPages.structure),
  ].filter(isDefined);

  const remainingGuides = without(guideChildren, usedGuideNodes);
  const remainingRoot = without(root.children, usedRootNodes);

  return {
    ...root,
    children: [
      makeFolder("getting-started", "Get started", gettingStartedPages),
      makeFolder("build-your-app", "Build your app", [
        ...appPages,
        ...(remainingGuides.length > 0
          ? [makeFolder("more-guides", "More guides", remainingGuides)]
          : []),
      ]),
      makeFolder("connect-services", "Connect services", servicePages),
      makeFolder("tooling-release", "Tooling & release", toolingPages),
      ...(remainingRoot.length > 0 ? [makeFolder("more-docs", "More docs", remainingRoot)] : []),
    ],
  };
}
