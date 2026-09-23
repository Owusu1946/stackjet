import maintainers from "@/data/maintainers.json";
import { createPackageName } from "@/lib/shared";

const repository = "https://github.com/Owusu1946/stackjet";
const githubApi = "https://api.github.com/repos/Owusu1946/stackjet";
const npmApi = "https://api.npmjs.org/downloads/point";
const revalidate = 21_600;

type Contributor = {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
};

export type CommunityData = {
  repository: string;
  packageName: string;
  stars: number | null;
  forks: number | null;
  contributors: Contributor[];
  contributorCount: number | null;
  weeklyDownloads: number | null;
  totalDownloads: number | null;
  maintainers: typeof maintainers;
};

async function getJson<T>(url: string, headers?: HeadersInit): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers,
      next: { revalidate },
      signal: AbortSignal.timeout(3_000),
    });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

function dateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function getTotalDownloads(createdAt: string | undefined): Promise<number | null> {
  if (!createdAt) return null;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return null;

  // The npm downloads API caps a point request at 18 months. Yearly slices keep this all-time.
  const now = new Date();
  const ranges: string[] = [];
  for (let start = created; start <= now; ) {
    const end = new Date(start);
    end.setUTCFullYear(end.getUTCFullYear() + 1);
    end.setUTCDate(end.getUTCDate() - 1);
    if (end > now) end.setTime(now.getTime());
    ranges.push(`${dateString(start)}:${dateString(end)}`);
    start = new Date(end);
    start.setUTCDate(start.getUTCDate() + 1);
  }

  const results = await Promise.all(
    ranges.map((range) =>
      getJson<{ downloads?: number }>(`${npmApi}/${range}/${createPackageName}`),
    ),
  );
  if (results.some((result) => typeof result?.downloads !== "number")) return null;
  return results.reduce((sum, result) => sum + (result?.downloads ?? 0), 0);
}

export async function getCommunityData(): Promise<CommunityData> {
  const githubHeaders = { Accept: "application/vnd.github+json" };
  const [repo, people, weekly, registry] = await Promise.all([
    getJson<{ stargazers_count?: number; forks_count?: number }>(githubApi, githubHeaders),
    getJson<Contributor[]>(`${githubApi}/contributors?per_page=100`, githubHeaders),
    getJson<{ downloads?: number }>(`${npmApi}/last-week/${createPackageName}`),
    getJson<{ time?: { created?: string } }>(`https://registry.npmjs.org/${createPackageName}`),
  ]);

  return {
    repository,
    packageName: createPackageName,
    stars: repo?.stargazers_count ?? null,
    forks: repo?.forks_count ?? null,
    contributors: people?.slice(0, 8) ?? [],
    contributorCount: people?.length ?? null,
    weeklyDownloads: weekly?.downloads ?? null,
    totalDownloads: await getTotalDownloads(registry?.time?.created),
    maintainers,
  };
}
