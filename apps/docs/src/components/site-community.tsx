import {
  ArrowUpRight01Icon,
  Calendar03Icon,
  Download04Icon,
  GitForkIcon,
  StarIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import type { CommunityData } from "@/lib/community";

export function Community({ data }: { data: CommunityData }) {
  const metrics = [
    { label: "Stars", value: data.stars, icon: StarIcon, href: data.repository },
    { label: "Forks", value: data.forks, icon: GitForkIcon, href: `${data.repository}/forks` },
    {
      label: "Contributors",
      value: data.contributorCount,
      icon: UserGroupIcon,
      href: `${data.repository}/graphs/contributors`,
    },
    {
      label: "Weekly installs",
      value: data.weeklyDownloads,
      icon: Calendar03Icon,
      href: `https://www.npmjs.com/package/${data.packageName}`,
    },
    {
      label: "Total installs",
      value: data.totalDownloads,
      icon: Download04Icon,
      href: `https://www.npmjs.com/package/${data.packageName}`,
    },
  ];

  return (
    <section className="site-community" aria-labelledby="community-title">
      <div className="site-community-heading">
        <h2 id="community-title">Project activity</h2>
        <a href={data.repository} target="_blank" rel="noreferrer">
          GitHub <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} aria-hidden="true" />
        </a>
      </div>
      <div className="site-metrics">
        {metrics.map(({ label, value, icon, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="site-metric"
            key={label}
            title={label.includes("installs") ? "Measured by npm downloads" : undefined}
          >
            <span className="site-metric-label">
              <HugeiconsIcon icon={icon} size={17} strokeWidth={1.8} aria-hidden="true" /> {label}
            </span>
            <strong>{value === null ? "n/a" : value.toLocaleString()}</strong>
          </a>
        ))}
      </div>
      <div className="site-people">
        <div className="site-people-group">
          <div className="site-people-heading">
            <h3>Maintainers</h3>
            <span>{data.maintainers.length}</span>
          </div>
          <div className="site-person-list">
            {data.maintainers.map((person) => (
              <a href={person.html_url} target="_blank" rel="noreferrer" key={person.login}>
                <Image src={person.avatar_url} alt="" width={34} height={34} />
                <span>{person.name}</span>
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
        <div className="site-people-group site-contributor-group">
          <div className="site-people-heading">
            <h3>Contributors</h3>
            <a href={`${data.repository}/graphs/contributors`} target="_blank" rel="noreferrer">
              View all <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} aria-hidden="true" />
            </a>
          </div>
          {data.contributors.length > 0 ? (
            <div className="site-avatar-list">
              {data.contributors.map((person) => (
                <a
                  href={person.html_url}
                  target="_blank"
                  rel="noreferrer"
                  key={person.id}
                  aria-label={`${person.login}, ${person.contributions} contributions`}
                  title={person.login}
                >
                  <Image src={person.avatar_url} alt="" width={40} height={40} />
                </a>
              ))}
            </div>
          ) : (
            <p>Contributor data is unavailable right now.</p>
          )}
          <a
            className="site-contribute-link"
            href={`${data.repository}/blob/main/CONTRIBUTING.md`}
            target="_blank"
            rel="noreferrer"
          >
            Contribute to Expojet{" "}
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
