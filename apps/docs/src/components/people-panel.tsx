"use client";

import Image from "next/image";
import { useState } from "react";

type Person = {
  login: string;
  name?: string;
  avatar_url: string;
  html_url: string;
  contributions?: number;
  role?: string;
  bio?: string;
};

export function PeoplePanel({
  contributors,
  maintainers,
  repositoryUrl,
}: {
  contributors: Person[];
  maintainers: Person[];
  repositoryUrl: string;
}) {
  const [view, setView] = useState<"maintainers" | "contributors">("maintainers");
  const people = view === "maintainers" ? maintainers : contributors;
  return (
    <aside className="contributors-panel">
      <header className="panel-heading">
        <div>
          <span className="panel-kicker">OPEN SOURCE</span>
          <h1>{view === "maintainers" ? "The people behind Expojet." : "Built in public."}</h1>
        </div>
        <a href={`${repositoryUrl}/graphs/contributors`} target="_blank" rel="noreferrer">
          view all <span aria-hidden="true">↗</span>
        </a>
      </header>
      <div className="people-switch" role="tablist" aria-label="Project people">
        <button
          type="button"
          role="tab"
          aria-selected={view === "maintainers"}
          onClick={() => setView("maintainers")}
        >
          MAINTAINERS <b>{maintainers.length}</b>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "contributors"}
          onClick={() => setView("contributors")}
        >
          CONTRIBUTORS <b>{contributors.length}</b>
        </button>
      </div>
      <div className="contributor-list">
        <div className="contributor-grid">
          {people.length > 0 ? (
            people.map((person) => (
              <a
                key={person.login}
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
                  <strong>{person.name ?? person.login}</strong>
                  <small>
                    @{person.login} ·{" "}
                    {view === "maintainers" ? person.role : `${person.contributions ?? 0} commits`}
                  </small>
                </span>
                <span aria-hidden="true">↗</span>
              </a>
            ))
          ) : (
            <div className="contributors-empty">
              <span>GitHub is taking a breath.</span>
            </div>
          )}
          {view === "contributors" ? (
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
              <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </div>
      </div>
      <a
        href={`${repositoryUrl}/blob/main/CONTRIBUTING.md`}
        target="_blank"
        rel="noreferrer"
        className="join-row"
      >
        <span>
          <strong>
            {view === "maintainers" ? "Want to help shape it?" : "Your name could be here."}
          </strong>
          <small>Code, docs, ideas—all contributions count.</small>
        </span>
        <span>contribute →</span>
      </a>
    </aside>
  );
}
