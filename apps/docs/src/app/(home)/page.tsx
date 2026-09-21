import Link from "next/link";
import { CommandPicker } from "@/components/command-picker";
import { PeoplePanel } from "@/components/people-panel";
import maintainers from "@/data/maintainers.json";
import { createPackageName, productName, releaseVersion } from "@/lib/shared";

const repositoryUrl = "https://github.com/Owusu1946/stackjet";
const asciiLogo = `███████╗ ██╗  ██╗ ██████╗   ██████╗       ██╗ ███████╗ ████████╗
██╔════╝ ╚██╗██╔╝ ██╔══██╗ ██╔═══██╗      ██║ ██╔════╝ ╚══██╔══╝
█████╗    ╚███╔╝  ██████╔╝ ██║   ██║      ██║ █████╗      ██║
██╔══╝    ██╔██╗  ██╔═══╝  ██║   ██║ ██   ██║ ██╔══╝      ██║
███████╗ ██╔╝ ██╗ ██║      ╚██████╔╝ ╚█████╔╝ ███████╗    ██║
╚══════╝ ╚═╝  ╚═╝ ╚═╝       ╚═════╝   ╚════╝  ╚══════╝    ╚═╝`;

type Contributor = {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
};
type RepoStats = { stars: number; forks: number; downloads: number };

async function getContributors(): Promise<Contributor[]> {
  try {
    const apiUrl = repositoryUrl.replace("github.com", "api.github.com/repos");
    const response = await fetch(`${apiUrl}/contributors?per_page=8`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 21_600 },
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return [];
    return (await response.json()) as Contributor[];
  } catch {
    return [];
  }
}

async function getRepoStats(): Promise<RepoStats> {
  try {
    const [repoResponse, downloadsResponse] = await Promise.all([
      fetch("https://api.github.com/repos/Owusu1946/stackjet", {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 21_600 },
        signal: AbortSignal.timeout(3_000),
      }),
      fetch(`https://api.npmjs.org/downloads/point/last-week/${createPackageName}`, {
        next: { revalidate: 21_600 },
        signal: AbortSignal.timeout(3_000),
      }),
    ]);
    const repo = repoResponse.ok
      ? ((await repoResponse.json()) as { stargazers_count?: number; forks_count?: number })
      : {};
    const downloads = downloadsResponse.ok
      ? ((await downloadsResponse.json()) as { downloads?: number })
      : {};
    return {
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      downloads: downloads.downloads ?? 0,
    };
  } catch {
    return { stars: 0, forks: 0, downloads: 0 };
  }
}

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export default async function HomePage() {
  const [contributors, stats] = await Promise.all([getContributors(), getRepoStats()]);
  return (
    <main className="console-page">
      <div className="console-shell">
        <div className="console-tabs">
          <span className="console-tab console-tab-active">
            <i /> INIT <b>01</b>
          </span>
          <span className="console-tab">
            <i /> CONTRIBUTORS <b>02</b>
          </span>
        </div>

        <div className="console-grid">
          <section className="console-hero">
            <div>
              <pre className="ascii-logo">{asciiLogo}</pre>
              <p className="console-lede">
                Build the Expo app you meant to build; not the setup around it.
              </p>
              <p className="console-copy">
                Choose your stack. {productName} connects the pieces and hands you a clean project
                ready for Expo Go, a full-stack monorepo, or whatever comes next.
              </p>
            </div>

            <CommandPicker />

            <div className="console-actions">
              <Link href="/builder" className="console-primary">
                build your stack <Arrow />
              </Link>
              <Link href="/docs" className="console-link">
                read the docs →
              </Link>
              <Link href="/docs/ai-agents" className="console-link">
                give it to your agent →
              </Link>
              <Link href="/changelog" className="console-link">
                see what&apos;s new →
              </Link>
            </div>
          </section>

          <PeoplePanel
            contributors={contributors}
            maintainers={maintainers}
            repositoryUrl={repositoryUrl}
          />
        </div>

        <section className="stats-pane" aria-labelledby="stats-title">
          <div className="stats-heading group-label">
            <span id="stats-title">STATS</span>
            <i />
          </div>
          <div className="stats-grid">
            <div className="stat">
              <span>GITHUB</span>
              <strong>{stats.stars ? stats.stars.toLocaleString() : "—"}</strong>
              <small>
                STARS ·{" "}
                {stats.forks ? `${stats.forks.toLocaleString()} forks` : "growing in public"}
              </small>
            </div>
            <div className="stat">
              <span>COMMUNITY</span>
              <strong>{contributors.length || "—"}</strong>
              <small>CONTRIBUTORS · refreshed every 6h</small>
            </div>
            <div className="stat">
              <span>NPM</span>
              <strong>{stats.downloads ? stats.downloads.toLocaleString() : "—"}</strong>
              <small>WEEKLY DOWNLOADS · {createPackageName}</small>
            </div>
          </div>
        </section>

        <footer className="console-status">
          <span>
            <i /> {productName.toUpperCase()}
          </span>
          <span>EXPO-FIRST</span>
          <span>CLERK · HONO · NEON · DRIZZLE</span>
          <span>AI-READY DOCS</span>
          <span className="status-version">V{releaseVersion}</span>
        </footer>
      </div>
    </main>
  );
}
