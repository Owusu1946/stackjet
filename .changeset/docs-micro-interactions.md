---
"@expojet/docs": patch
---

Add reduced-motion-safe micro-interactions and scroll reveals

The home page had one animation, the pulsing activity dot, and one hover rule
(`.site-avatar-list a:hover { transform: translateY(-2px) }`) with no transition, so the avatar
jumped instead of easing. The sticky header gave no feedback when the page scrolled, and content
below the fold simply appeared with nothing to mark the boundary.

Added, all on one duration scale and one easing curve:

- Scroll reveals for the hero, the demo panel, the community section and its three metric cards,
  staggered. The hidden state is CSS, so the content is in the DOM and readable first; JavaScript
  only adds `data-revealed`.
- Hover feedback on the primary and secondary actions, the arrow icons inside them, the command
  block, the demo panel and choices, and the metric cards.
- A shadow and border on the sticky header once the page has scrolled.

`RevealOnScroll` reveals anything already in the viewport synchronously on mount and has a
three-second failsafe, so a browser that never fires the observer's callback cannot leave content
invisible.

`prefers-reduced-motion` needs no per-rule media query: the global `*` override in `global.css`
switches off every transition and animation in one place.
