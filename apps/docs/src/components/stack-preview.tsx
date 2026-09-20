"use client";

import { useEffect, useMemo, useState } from "react";

export type PreviewFile = { path: string; content: string };

type TreeNode = {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  file?: PreviewFile;
};

function buildTree(files: PreviewFile[]) {
  const root: TreeNode = { name: "", path: "", children: new Map() };
  for (const file of files) {
    let node = root;
    for (const [index, part] of file.path.split("/").entries()) {
      const path = node.path ? `${node.path}/${part}` : part;
      const child = node.children.get(part) ?? { name: part, path, children: new Map() };
      node.children.set(part, child);
      node = child;
      if (index === file.path.split("/").length - 1) node.file = file;
    }
  }
  return root;
}

function countFolders(node: TreeNode): number {
  return [...node.children.values()].reduce(
    (count, child) => count + (child.file ? 0 : 1) + countFolders(child),
    0,
  );
}

function numberedLines(content: string) {
  const occurrences = new Map<string, number>();
  return content.split("\n").map((line) => {
    const occurrence = (occurrences.get(line) ?? 0) + 1;
    occurrences.set(line, occurrence);
    return { id: `${line}:${occurrence}`, line };
  });
}

function FileTreeNode({
  node,
  depth,
  expanded,
  selectedPath,
  onToggle,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  selectedPath?: string;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
}) {
  const isFolder = !node.file;
  const isExpanded = expanded.has(node.path);
  return (
    <li>
      <button
        type="button"
        className="preview-tree-row"
        data-active={selectedPath === node.path}
        style={{ paddingLeft: `${0.7 + depth * 0.9}rem` }}
        onClick={() => (isFolder ? onToggle(node.path) : onSelect(node.path))}
      >
        <span aria-hidden="true">{isFolder ? (isExpanded ? "▾" : "▸") : "◇"}</span>
        {node.name}
      </button>
      {isFolder && isExpanded ? (
        <ul>
          {[...node.children.values()]
            .sort((left, right) => {
              if (Boolean(left.file) !== Boolean(right.file)) return left.file ? 1 : -1;
              return left.name.localeCompare(right.name);
            })
            .map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                selectedPath={selectedPath}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ))}
        </ul>
      ) : null}
    </li>
  );
}

export function StackPreview({
  projectName,
  files,
  loading,
  error,
}: {
  projectName: string;
  files: PreviewFile[];
  loading: boolean;
  error?: string;
}) {
  const tree = useMemo(() => buildTree(files), [files]);
  const [selectedPath, setSelectedPath] = useState<string>();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!files.length) return;
    setSelectedPath((current) =>
      current && files.some((file) => file.path === current) ? current : files[0]?.path,
    );
    setExpanded(
      new Set([...tree.children.values()].filter((node) => !node.file).map((node) => node.path)),
    );
  }, [files, tree]);

  const selected = files.find((file) => file.path === selectedPath);

  async function copyFile() {
    if (!selected) return;
    await navigator.clipboard.writeText(selected.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  if (loading && files.length === 0) {
    return <div className="preview-state">Rendering the real generation plan…</div>;
  }
  if (error) {
    return <div className="preview-state preview-state-error">{error}</div>;
  }

  return (
    <section className="builder-preview" aria-label="Generated project preview">
      <header className="preview-toolbar">
        <span>{countFolders(tree)} FOLDERS</span>
        <span>{files.length} FILES</span>
        {loading ? <span className="preview-refreshing">UPDATING…</span> : null}
        <strong>REAL PLAN PREVIEW</strong>
      </header>
      <div className="preview-workspace">
        <aside className="preview-tree">
          <div className="preview-root">▱ {projectName}</div>
          <ul>
            {[...tree.children.values()]
              .sort((left, right) => {
                if (Boolean(left.file) !== Boolean(right.file)) return left.file ? 1 : -1;
                return left.name.localeCompare(right.name);
              })
              .map((node) => (
                <FileTreeNode
                  key={node.path}
                  node={node}
                  depth={0}
                  expanded={expanded}
                  selectedPath={selectedPath}
                  onToggle={(path) =>
                    setExpanded((current) => {
                      const next = new Set(current);
                      if (next.has(path)) next.delete(path);
                      else next.add(path);
                      return next;
                    })
                  }
                  onSelect={setSelectedPath}
                />
              ))}
          </ul>
        </aside>
        <div className="preview-code-pane">
          <header>
            <span>{selected?.path ?? "Select a file"}</span>
            <button type="button" disabled={!selected} onClick={copyFile}>
              {copied ? "COPIED ✓" : "COPY FILE"}
            </button>
          </header>
          <pre>
            <code>
              {numberedLines(selected?.content ?? "").map(({ id, line }, index) => (
                <span key={id}>
                  <i>{index + 1}</i>
                  <b>{line || " "}</b>
                </span>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}
