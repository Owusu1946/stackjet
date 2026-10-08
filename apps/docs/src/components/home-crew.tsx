import Image from "next/image";
import Link from "next/link";
import type { CommunityData } from "@/lib/community";
import { releases } from "@/lib/releases";

/** The orbit section's crew, live repository numbers, and the latest release. */
export function HomeCrew({ data }: { data: CommunityData }) {
  const stats = [
    { label: "GitHub stars", value: data.stars, href: data.repository },
    {
      label: "Contributors",
      value: data.contributorCount,
      href: `${data.repository}/graphs/contributors`,
    },
    { label: "Forks", value: data.forks, href: `${data.repository}/forks` },
    {
      label: "npm downloads",
      value: data.totalDownloads,
      href: `https://www.npmjs.com/package/${data.packageName}`,
    },
  ];
  const latest = releases[0];

  return (
    <>
      <div className="home-people">
        <h3>Maintainers</h3>
        <ul className="home-crew">
          {data.maintainers.map((person) => (
            <li key={person.login}>
              <a href={person.html_url} target="_blank" rel="noreferrer">
                <Image src={person.avatar_url} alt="" width={40} height={40} />
                {person.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="home-people">
        <h3>Contributors</h3>
        {data.contributors.length > 0 ? (
          <ul className="home-contributors">
            {data.contributors.map((person) => (
              <li key={person.id}>
                <a
                  href={person.html_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${person.login}, ${person.contributions} contributions`}
                  title={person.login}
                >
                  <Image src={person.avatar_url} alt="" width={36} height={36} />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            Contributor data is unavailable right now.{" "}
            <a
              className="home-people-link"
              href={`${data.repository}/graphs/contributors`}
              target="_blank"
              rel="noreferrer"
            >
              See them on GitHub
            </a>
            .
          </p>
        )}
      </div>
      <ul className="home-stats">
        {stats.map((stat) => (
          <li key={stat.label}>
            <a href={stat.href} target="_blank" rel="noreferrer">
              <strong className="home-stat-value">
                {stat.value === null ? "n/a" : stat.value.toLocaleString("en")}
              </strong>
              <span className="home-stat-label">{stat.label}</span>
            </a>
          </li>
        ))}
      </ul>
      {latest ? (
        <p className="home-release">
          <Link href="/changelog">v{latest.version}</Link> {latest.summary}
        </p>
      ) : null}
    </>
  );
}
