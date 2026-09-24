import type { Folder, Item, Node, Root } from "fumadocs-core/page-tree";

function folder(id: string, name: string, children: Node[]): Folder {
  return {
    $id: `expojet-docs-${id}`,
    type: "folder",
    name,
    collapsible: true,
    defaultOpen: false,
    children,
  };
}

export function organizeDocsSidebar(root: Root): Root {
  const pages = root.children.filter((node): node is Item => node.type === "page");
  const used = new Set<Item>();

  function take(url: string) {
    const page = pages.find((item) => item.url === url);
    if (page) used.add(page);
    return page ? [page] : [];
  }

  function takePrefix(prefix: string) {
    const matches = pages.filter((item) => item.url.startsWith(prefix));
    for (const page of matches) used.add(page);
    return matches;
  }

  const groups = [
    folder("get-started", "Get started", [
      ...take("/docs"),
      ...take("/docs/installation"),
      ...take("/docs/quick-start"),
      ...take("/docs/folder-structure"),
    ]),
    folder("build-your-app", "Build your app", [
      folder("styling", "Styling", takePrefix("/docs/guides/styling/")),
      folder("navigation", "Navigation", takePrefix("/docs/guides/navigation/")),
      ...take("/docs/guides/icons"),
      ...take("/docs/guides/state"),
      ...take("/docs/guides/liquid-glass"),
      ...take("/docs/guides/haptics"),
      ...take("/docs/guides/presets"),
    ]),
    folder("connect-services", "Connect services", [
      folder("authentication", "Authentication", takePrefix("/docs/guides/authentication/")),
      folder("backend", "Backend", takePrefix("/docs/guides/backend/")),
      folder("database", "Database", takePrefix("/docs/guides/database/")),
      folder("managed-cloud", "Managed Cloud", takePrefix("/docs/guides/managed-cloud/")),
      ...take("/docs/guides/analytics"),
      ...take("/docs/guides/monitoring"),
    ]),
    folder("tooling-release", "Tooling & release", [
      folder("cli", "CLI", takePrefix("/docs/cli/")),
      ...take("/docs/ai-agents"),
      ...take("/docs/guides/eas"),
    ]),
  ];

  const remaining = pages.filter((page) => !used.has(page));
  return {
    ...root,
    children: [
      ...groups,
      ...(remaining.length > 0 ? [folder("more-docs", "More docs", remaining)] : []),
    ],
  };
}
