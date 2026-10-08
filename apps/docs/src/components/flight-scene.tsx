"use client";

import { type CSSProperties, useRef } from "react";
import { useFlightProgress } from "@/hooks/use-flight-progress";
import { FlightJet } from "./flight-jet";

/** One value per stage: runway, takeoff roll, liftoff, climb, orbit, go for launch. */
type Track = readonly [number, number, number, number, number, number];
type Motion = {
  x?: Track;
  y?: Track;
  rotate?: Track;
  scale?: Track;
  scaleX?: Track;
  opacity?: Track;
  /** Front-loads movement within each stage, so the jet clears the content column early. */
  easeOut?: boolean;
};

const ground = [0, 0, 0, 855, 855, 855] as const;
const cloudOpacity = [1, 1, 1, 1, 0, 0] as const;
const cloudPath = (dx: number, dy: number): Motion => ({
  x: [0, dx, dx * 2, dx * 3, dx * 4, dx * 5],
  y: [0, dy, dy * 2, dy * 3, dy * 4, dy * 5],
  opacity: cloudOpacity,
});

/**
 * Offsets from each layer's stage 0 position in the 1440 by 900 design frame, taken from the
 * six Variant D key frames. Between stages every value is interpolated linearly.
 */
const motions: Record<string, Motion> = {
  "sky-dawn": { opacity: [1, 1, 1, 0, 0, 0] },
  "sky-day": { opacity: [1, 1, 1, 1, 0, 0] },
  "sky-stratosphere": { opacity: [1, 1, 1, 1, 1, 0] },
  stars: { opacity: [0, 0, 0, 0, 1, 1] },
  sun: {
    x: [0, 230.4, 230.4, 230.4, 230.4, 230.4],
    y: [0, -31.5, -63, 193.5, 193.5, 193.5],
    opacity: [1, 1, 1, 0, 0, 0],
  },
  "orbital-sunrise": { y: [0, 0, 0, 0, -15.4, -450], opacity: [0, 0, 0, 0, 0, 1] },
  earth: { y: [0, 0, 0, 0, -15.4, -450], opacity: [0, 0, 0, 0, 1, 1] },
  "cloud-1": cloudPath(-360, 1350),
  "cloud-2": cloudPath(-288, 1080),
  "cloud-3": cloudPath(-432, 1620),
  "cloud-4": cloudPath(-324, 1215),
  "cloud-5": cloudPath(-396, 1485),
  "cloud-6": cloudPath(-252, 945),
  "ridge-far": { x: [0, -29.2, -134.4, -260, -260, -260], y: [0, 0, 0, 359.1, 359.1, 359.1] },
  mist: { y: [0, 0, 0, 427.5, 427.5, 427.5] },
  "ridge-near": { x: [0, -70.2, -322.4, -624, -624, -624], y: [0, 0, 0, 530.1, 530.1, 530.1] },
  ground: { y: ground },
  "runway-lights": { x: [0, -584.8, -2687, -5200, -5200, -5200], y: ground },
  "runway-dashes": { x: [0, -672.5, -3090.1, -5980, -5980, -5980], y: ground },
  "jet-shadow": {
    x: [0, 325.1, 345.6, 360, 374.4, 489.6],
    y: ground,
    scaleX: [1, 1, 0.96, 0.5, 0.5, 0.5],
    opacity: [1, 1, 1, 0, 0, 0],
    easeOut: true,
  },
  jet: {
    x: [0, 325, 347, 360, 378, 485],
    y: [0, 0, -11, -247, -306, -486],
    rotate: [0, 0, -9, -22, -14, -3],
    scale: [1, 1, 1, 1, 0.86, 0.44],
    easeOut: true,
  },
  "jet-gear": { opacity: [1, 1, 1, 0, 0, 0] },
  "jet-flame": { scaleX: [0.12, 1, 1, 1, 0.71, 0.23] },
  "jet-glow": { opacity: [0.12, 0.9, 1, 1, 0.9, 0.8] },
  scrim: { opacity: [0, 1, 1, 1, 1, 0] },
};

const designWidth = 1440;
const designHeight = 900;
const jetHalfWidth = 190;

function sample(track: Track | undefined, stage: number, fallback: number, easeOut = false) {
  if (!track) return fallback;
  const index = Math.min(Math.max(Math.floor(stage), 0), track.length - 2);
  const linear = Math.min(Math.max(stage - index, 0), 1);
  const t = easeOut ? 1 - (1 - linear) ** 3 : linear;
  const from = track[index] ?? fallback;
  const to = track[index + 1] ?? from;
  return from + (to - from) * t;
}

function styleAt(motion: Motion, stage: number, shiftX = 0) {
  const at = (track: Track | undefined, fallback: number) =>
    sample(track, stage, fallback, motion.easeOut);
  const parts: string[] = [];
  if (motion.x || motion.y || shiftX) {
    const x = at(motion.x, 0) + shiftX;
    parts.push(`translate3d(${x.toFixed(2)}px, ${at(motion.y, 0).toFixed(2)}px, 0)`);
  }
  if (motion.rotate) parts.push(`rotate(${at(motion.rotate, 0).toFixed(2)}deg)`);
  if (motion.scale) parts.push(`scale(${at(motion.scale, 1).toFixed(3)})`);
  if (motion.scaleX) parts.push(`scaleX(${at(motion.scaleX, 1).toFixed(3)})`);
  return {
    transform: parts.length ? parts.join(" ") : undefined,
    opacity: motion.opacity ? at(motion.opacity, 1).toFixed(3) : undefined,
  };
}

/** Keeps the jet inside narrow viewports, where the cover-scaled frame crops its right side. */
function jetShift(stage: number) {
  const scale = Math.max(window.innerWidth / designWidth, window.innerHeight / designHeight);
  const visibleRight = designWidth / 2 + window.innerWidth / 2 / scale;
  const jet = motions.jet;
  if (!jet) return 0;
  const right =
    designWidth / 2 +
    sample(jet.x, stage, 0, jet.easeOut) +
    jetHalfWidth * sample(jet.scale, stage, 1, jet.easeOut);
  return Math.min(0, visibleRight - 16 / scale - right);
}

const phoneQuery = "(max-width: 850px)";
const jetBox = { top: 599.35, width: 380, height: 123.5 };
/** Phone drift and climb in design pixels, small enough to stay inside the bottom band. */
const phoneTrack = {
  x: [0, 30, 45, 55, 60, 60],
  y: [0, 0, -8, -26, -34, -40],
} as const satisfies Record<string, Track>;

/**
 * On phones the content spans the screen, so the jet flies low in a band along the bottom of the
 * viewport and content scrolling into that band is blurred away (`.flight-band`). The jet keeps
 * the same continuous path through the stages; the scenery dropping away carries the climb.
 */
function phoneFlight(stage: number, rootHeight: number) {
  const width = window.innerWidth;
  const scale = Math.max(width / designWidth, rootHeight / designHeight);
  const fit = Math.min(1, Math.min(240, width * 0.6) / (jetBox.width * scale));
  const jet = motions.jet ?? {};
  const shadow = motions["jet-shadow"] ?? {};
  const rotate = sample(jet.rotate, stage, 0, true);
  const size = sample(jet.scale, stage, 1, true) * fit;
  const dx = sample(phoneTrack.x, stage, 0, true);
  // Shrinking around the centre lifts the wheels, so drop the jet back onto the runway.
  const dy = (jetBox.height / 2) * (1 - fit) + sample(phoneTrack.y, stage, 0, true);
  const center = rootHeight / 2 + (jetBox.top + jetBox.height / 2 + dy - designHeight / 2) * scale;
  // Leave room for the steepest pose, 22 degrees nose up.
  const halfHeight = ((jetBox.width * 0.375 + jetBox.height) / 2) * fit * scale;
  return {
    jet: `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${rotate.toFixed(2)}deg) scale(${size.toFixed(3)})`,
    shadow: `translate3d(${dx.toFixed(2)}px, ${sample(shadow.y, stage, 0).toFixed(2)}px, 0) scaleX(${(fit * sample(shadow.scaleX, stage, 1)).toFixed(3)})`,
    bandTop: center - halfHeight - 24,
    bandOpacity: Math.min(Math.max((stage - 0.1) * 4, 0), 1),
  };
}

/** Server-rendered at stage 0 so the runway shows without JavaScript. */
function initial(name: string): CSSProperties | undefined {
  const motion = motions[name];
  if (!motion) return undefined;
  const { transform, opacity } = styleAt(motion, 0);
  return { transform, opacity };
}

function Layer({ name, className }: { name: string; className?: string }) {
  return (
    <div className={`flight-${className ?? name}`} data-flight-layer={name} style={initial(name)} />
  );
}

export function FlightScene() {
  const root = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const band = useRef<HTMLDivElement>(null);

  useFlightProgress((stage) => {
    if (!root.current || !overlay.current) return;
    const phone = window.matchMedia(phoneQuery).matches
      ? phoneFlight(stage, root.current.clientHeight)
      : null;
    const shift = phone ? 0 : jetShift(stage);
    for (const container of [root.current, overlay.current]) {
      for (const layer of container.querySelectorAll<HTMLElement | SVGElement>(
        "[data-flight-layer]",
      )) {
        const name = layer.dataset.flightLayer ?? "";
        const motion = motions[name];
        if (!motion) continue;
        const followsJet = name === "jet" || name === "jet-shadow";
        let { transform, opacity } = styleAt(motion, stage, followsJet ? shift : 0);
        if (phone && name === "jet") transform = phone.jet;
        if (phone && name === "jet-shadow") transform = phone.shadow;
        // Clearing unset values undoes the phone placement after a resize to desktop.
        layer.style.transform = transform ?? "";
        layer.style.opacity = opacity ?? "";
      }
    }
    if (band.current) {
      band.current.style.top = phone ? `${phone.bandTop.toFixed(1)}px` : "";
      band.current.style.opacity = phone ? phone.bandOpacity.toFixed(3) : "";
    }
  });

  return (
    <>
      <div className="flight-scene" ref={root} aria-hidden="true">
        <div className="flight-frame">
          <Layer name="sky-stratosphere" />
          <Layer name="sky-day" />
          <Layer name="sky-dawn" />
          <Layer name="stars" />
          <Layer name="sun" />
          <Layer name="orbital-sunrise" />
          <div className="flight-earth" data-flight-layer="earth" style={initial("earth")}>
            <span className="flight-earth-atmosphere" />
            <span className="flight-earth-planet" />
          </div>
          {[1, 2, 3, 4, 5, 6].map((cloud) => (
            <Layer key={cloud} name={`cloud-${cloud}`} className={`cloud flight-cloud-${cloud}`} />
          ))}
          <svg
            aria-hidden="true"
            className="flight-ridge-far"
            data-flight-layer="ridge-far"
            style={initial("ridge-far")}
            viewBox="0 0 2400 1110"
            width="2400"
            height="1110"
          >
            <path
              d="M0 70L50 58L110 64L180 36L250 54L330 22L410 50L480 40L560 62L650 30L730 56L800 70L850 58L910 64L980 36L1050 54L1130 22L1210 50L1280 40L1360 62L1450 30L1530 56L1600 70L1650 58L1710 64L1780 36L1850 54L1930 22L2010 50L2080 40L2160 62L2250 30L2330 56L2400 70V1110H0V70Z"
              fill="#4A2F55"
            />
          </svg>
          <Layer name="mist" />
          <svg
            aria-hidden="true"
            className="flight-ridge-near"
            data-flight-layer="ridge-near"
            style={initial("ridge-near")}
            viewBox="0 0 2560 1064"
            width="2560"
            height="1064"
          >
            <path
              d="M0 40L70 24L150 36L240 12L330 34L420 20L520 42L600 30L640 40L710 24L790 36L880 12L970 34L1060 20L1160 42L1240 30L1280 40L1350 24L1430 36L1520 12L1610 34L1700 20L1800 42L1880 30L1920 40L1990 24L2070 36L2160 12L2250 34L2340 20L2440 42L2520 30L2560 40V1064H0V40Z"
              fill="#1D1730"
            />
          </svg>
          <Layer name="ground" />
          <Layer name="runway-lights" />
          <Layer name="runway-dashes" />
          <Layer name="scrim" />
          <Layer name="jet-shadow" />
          <div className="flight-bottom-fade" />
        </div>
      </div>
      {/* Above the page content, so the jet stays sharp over the phone band. */}
      <div className="flight-overlay" ref={overlay} aria-hidden="true">
        <div className="flight-band" ref={band} />
        <div className="flight-frame">
          <div className="flight-jet" data-flight-layer="jet" style={initial("jet")}>
            <FlightJet />
          </div>
        </div>
      </div>
    </>
  );
}
