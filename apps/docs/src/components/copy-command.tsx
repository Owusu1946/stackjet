"use client";

import { createPackageName } from "@expojet/brand";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Fragment } from "react";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";

const defaultCommand = `npx ${createPackageName}@latest my-app`;

export function CopyCommand({
  value = defaultCommand,
  label = "Copy",
}: {
  value?: string;
  label?: string;
}) {
  const { status, copy } = useCopyFeedback(value, 1600);
  // Each word is unbreakable so long commands wrap at spaces, not after the `-` of a flag.
  let offset = 0;
  const words = value.split(" ").map((word) => {
    const start = offset;
    offset += word.length + 1;
    return { word, start };
  });

  return (
    <button type="button" className="site-copy-command" onClick={copy} aria-live="polite">
      <code>
        {words.map(({ word, start }) => (
          <Fragment key={start}>
            {start > 0 ? " " : null}
            <span className="site-copy-word">{word}</span>
          </Fragment>
        ))}
      </code>
      <span>
        <HugeiconsIcon
          icon={status === "copied" ? Tick02Icon : Copy01Icon}
          size={15}
          strokeWidth={1.8}
          aria-hidden="true"
        />
        {status === "copied" ? "Copied" : status === "failed" ? "Try again" : label}
      </span>
    </button>
  );
}
