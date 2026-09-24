"use client";

import { Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SidebarTrigger } from "fumadocs-ui/layouts/docs/slots/sidebar";
import type { ComponentProps } from "react";

// Docs sidebar trigger with a HugeIcons menu icon instead of the default.
export function DocsSidebarTrigger(props: ComponentProps<"button">) {
  return (
    <SidebarTrigger {...props}>
      <HugeiconsIcon icon={Menu01Icon} size={18} aria-hidden="true" />
    </SidebarTrigger>
  );
}
