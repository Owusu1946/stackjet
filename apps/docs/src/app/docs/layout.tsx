import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { organizeDocsSidebar } from "@/lib/docs-sidebar";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout
      tree={organizeDocsSidebar(source.getPageTree())}
      sidebar={{ collapsible: true }}
      {...baseOptions()}
    >
      {children}
    </DocsLayout>
  );
}
