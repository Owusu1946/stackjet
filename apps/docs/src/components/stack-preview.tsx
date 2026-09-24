"use client";

import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Copy01Icon,
  FileCodeIcon,
  Folder01Icon,
  FolderTreeIcon,
  InformationCircleIcon,
  TextWrapIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { useEffect, useMemo, useState } from "react";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";

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

function languageForFile(path: string) {
  const name = path.split("/").at(-1) ?? "";
  if (name.startsWith(".env")) return "dotenv";
  if (name === "Dockerfile") return "dockerfile";

  const extension = name.split(".").at(-1)?.toLowerCase();
  const languages: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    mjs: "javascript",
    cjs: "javascript",
    json: "json",
    jsonc: "jsonc",
    css: "css",
    scss: "scss",
    md: "markdown",
    mdx: "mdx",
    yml: "yaml",
    yaml: "yaml",
    toml: "toml",
    sh: "bash",
    sql: "sql",
    graphql: "graphql",
    prisma: "prisma",
    xml: "xml",
  };
  return languages[extension ?? ""] ?? "text";
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
        {isFolder ? (
          isExpanded ? (
            <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" size={13} />
          ) : (
            <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" size={13} />
          )
        ) : (
          <HugeiconsIcon icon={FileCodeIcon} aria-hidden="true" size={13} />
        )}
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
  const [wrapLines, setWrapLines] = useState(false);
  const [mobilePane, setMobilePane] = useState<"files" | "code">("code");
  const { status: copyStatus, copy: copyFile } = useCopyFeedback(
    files.find((file) => file.path === selectedPath)?.content ?? "",
    1500,
  );

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

  if (loading && files.length === 0) {
    return <div className="preview-state">Rendering the real generation plan…</div>;
  }
  if (error) {
    return <div className="preview-state preview-state-error">{error}</div>;
  }

  return (
    <section className="builder-preview" aria-label="Generated project preview">
      <header className="preview-toolbar">
        <span className="preview-toolbar-stat">
          <HugeiconsIcon icon={FolderTreeIcon} aria-hidden="true" size={14} />
          {countFolders(tree)} FOLDERS
        </span>
        <span className="preview-toolbar-stat">
          <HugeiconsIcon icon={FileCodeIcon} aria-hidden="true" size={14} />
          {files.length} FILES
        </span>
        {loading ? <span className="preview-refreshing">UPDATING…</span> : null}
        <strong>
          <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" size={14} /> Real plan
          preview
        </strong>
      </header>
      <div className="preview-pane-tabs" role="tablist" aria-label="Preview panes">
        <button
          type="button"
          role="tab"
          aria-selected={mobilePane === "files"}
          onClick={() => setMobilePane("files")}
        >
          <HugeiconsIcon icon={FolderTreeIcon} aria-hidden="true" size={14} />
          Files
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobilePane === "code"}
          onClick={() => setMobilePane("code")}
        >
          <HugeiconsIcon icon={FileCodeIcon} aria-hidden="true" size={14} />
          {selected?.path.split("/").at(-1) ?? "Code"}
        </button>
      </div>
      <div className="preview-workspace" data-mobile-pane={mobilePane}>
        <aside className="preview-tree">
          <div className="preview-root">
            <HugeiconsIcon icon={Folder01Icon} aria-hidden="true" size={15} /> {projectName}
          </div>
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
                  onSelect={(path) => {
                    setSelectedPath(path);
                    setMobilePane("code");
                  }}
                />
              ))}
          </ul>
        </aside>
        <div className="preview-code-pane" data-wrap-lines={wrapLines}>
          <header>
            <span className="preview-code-path">{selected?.path ?? "Select a file"}</span>
            <div className="preview-code-actions">
              <button
                type="button"
                aria-pressed={wrapLines}
                disabled={!selected}
                onClick={() => setWrapLines((current) => !current)}
              >
                <HugeiconsIcon icon={TextWrapIcon} aria-hidden="true" size={14} />
                {wrapLines ? "Unwrap lines" : "Wrap lines"}
              </button>
              <button
                type="button"
                title="Copy file contents"
                disabled={!selected}
                onClick={copyFile}
              >
                {copyStatus === "copied" ? (
                  <>
                    <HugeiconsIcon icon={Tick02Icon} aria-hidden="true" size={13} /> Copied
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" size={13} />{" "}
                    {copyStatus === "failed" ? "Try again" : "Copy file"}
                  </>
                )}
              </button>
            </div>
          </header>
          {selected ? (
            <DynamicCodeBlock
              key={selected.path}
              lang={languageForFile(selected.path)}
              code={selected.content}
              codeblock={{
                allowCopy: false,
                className: "builder-preview-code",
                "data-line-numbers": true,
                viewportProps: { className: "preview-code-scroll" },
              }}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
