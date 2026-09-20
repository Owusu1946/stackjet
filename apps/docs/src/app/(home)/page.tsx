import Image from "next/image";
import Link from "next/link";
import { CommandPicker } from "@/components/command-picker";
import { createPackageName, productName, releaseVersion } from "@/lib/shared";

const repositoryUrl = "https://github.com/Owusu1946/stackjet";
const asciiLogo = `████████████    ███████╗ ██╗  ██╗ ██████╗   ██████╗       ██╗ ███████╗ ████████╗
██████████◤     ██╔════╝ ╚██╗██╔╝ ██╔══██╗ ██╔═══██╗      ██║ ██╔════╝ ╚══██╔══╝
█████   ████◣   █████╗    ╚███╔╝  ██████╔╝ ██║   ██║      ██║ █████╗      ██║
█████   ████◤   ██╔══╝    ██╔██╗  ██╔═══╝  ██║   ██║ ██   ██║ ██╔══╝      ██║
██████████◣     ███████╗ ██╔╝ ██╗ ██║      ╚██████╔╝ ╚█████╔╝ ███████╗    ██║
████████████    ╚══════╝ ╚═╝  ╚═╝ ╚═╝       ╚═════╝   ╚════╝  ╚══════╝    ╚═╝`;

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
                Choose your stack. {productName} connects the pieces and hands you a clean project ready
                for Expo Go, a full-stack monorepo, or whatever comes next.
              </p>
            </div>

            <CommandPicker />

            <div className="console-actions">
              <Link href="/docs/quick-start" className="console-primary">
                create your app <Arrow />
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

          <aside className="contributors-panel">
            <header className="panel-heading">
              <div>
                <span className="panel-kicker">OPEN SOURCE</span>
                <h1>Built by people who ship.</h1>
              </div>
              <a href={`${repositoryUrl}/graphs/contributors`} target="_blank" rel="noreferrer">
                view all <Arrow />
              </a>
            </header>

            <div className="contributor-list">
              <div className="group-label contributor-label">
                <span>CONTRIBUTORS</span>
                <i />
                <b>{contributors.length}</b>
              </div>
              <div className="contributor-grid">
                {contributors.length > 0 ? (
                  contributors.map((person) => (
                    <a
                      key={person.id}
                      href={person.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="contributor-row"
                    >
                      <Image
                        src={person.avatar_url}
                        alt=""
                        width={44}
                        height={44}
                        className="contributor-avatar"
                      />
                      <span className="contributor-name">
                        <strong>{person.login}</strong>
                        <small>@{person.login}</small>
                      </span>
                      <span className="contribution-count">
                        {person.contributions}
                        <small>commits</small>
                      </span>
                    </a>
                  ))
                ) : (
                  <div className="contributors-empty">
                    <span>GitHub is taking a breath.</span>
                    <small>The contributor list will refresh automatically.</small>
                  </div>
                )}
                <a
                  href={`${repositoryUrl}/blob/main/CONTRIBUTING.md`}
                  target="_blank"
                  rel="noreferrer"
                  className="contributor-row contributor-invite"
                >
                  <span className="invite-mark">+</span>
                  <span className="contributor-name">
                    <strong>You, perhaps?</strong>
                    <small>First PRs are welcome.</small>
                  </span>
                  <Arrow />
                </a>
              </div>
            </div>

            <a
              href={`${repositoryUrl}/blob/main/CONTRIBUTING.md`}
              target="_blank"
              rel="noreferrer"
              className="join-row"
            >
              <span>
                <strong>Your name could be here.</strong>
                <small>Code, docs, ideas—all contributions count.</small>
              </span>
              <span>contribute →</span>
            </a>
          </aside>
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
