"use client";

import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSearchContext } from "fumadocs-ui/contexts/search";

export function SiteSearch() {
  const { hotKey, setOpenSearch } = useSearchContext();

  return (
    <button
      type="button"
      className="site-header-search"
      aria-label="Search documentation"
      onClick={() => setOpenSearch(true)}
    >
      <HugeiconsIcon icon={Search01Icon} size={17} aria-hidden="true" />
      <span>Search</span>
      <span className="site-header-shortcut" aria-hidden="true">
        {hotKey.map((key) => (
          <kbd key={String(key.key)}>{key.display}</kbd>
        ))}
      </span>
    </button>
  );
}
