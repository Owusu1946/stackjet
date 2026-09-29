---
"@expojet/docs": patch
---

Put the Stack Builder's configurator first on a phone

Below 850px the sidebar rendered before the configurator, so a visitor on a phone scrolled past
roughly 950px of project name, command block, preset picker, package manager and a 14-chip summary
before reaching the first option card. The column now leads and the command and summary follow it.

Also fixed on small screens:

- The Configure/Preview switch was pinned `top: 60px` while the nearest scrollport was
  `.builder-main`, leaving a 60px band of content visible above the bar. It is now `top: 0` with the
  category strip at `top: 2.8rem`, because the page is the scrollport there.
- The 15-pill category strip hid its scrollbar with no other affordance, so most of it looked
  absent. It now fades on the overflowing edge, driven by a `ResizeObserver`.
- `.builder-main[data-view="configure"]` kept `max-height: calc(100dvh - 5rem); overflow-y: auto`
  on phones, making the page scroll inside the page. One scrollport now.
