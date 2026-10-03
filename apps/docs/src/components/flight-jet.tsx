import { productName } from "@expojet/brand";

/**
 * The jet from the Variant D design. To redraw it, keep the 380 by 123.5 box and the
 * `data-flight-layer` hooks the scene animates: flame, glow and landing gear.
 */
export function FlightJet() {
  return (
    <>
      <span className="flight-jet-glow" data-flight-layer="jet-glow" />
      <span className="flight-jet-flame" data-flight-layer="jet-flame" />
      <svg viewBox="0 0 380 123.5" width="380" height="123.5" fill="none" aria-hidden="true">
        <defs>
          <linearGradient
            id="flight-jet-hull"
            x1="0"
            y1="38"
            x2="0"
            y2="81.7"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#F3F0EA" />
            <stop offset="1" stopColor="#AAB2C3" />
          </linearGradient>
        </defs>
        <g data-flight-layer="jet-gear">
          <path d="M302.1 76V106.4M115.9 77.9V102.6" stroke="#AAB2C3" strokeWidth="3.8" />
          <circle
            cx="302.1"
            cy="111.15"
            r="8.55"
            fill="#161B2A"
            stroke="#AAB2C3"
            strokeWidth="1.9"
          />
          <circle
            cx="106.4"
            cy="109.25"
            r="10.45"
            fill="#161B2A"
            stroke="#AAB2C3"
            strokeWidth="1.9"
          />
          <circle
            cx="129.2"
            cy="109.25"
            r="10.45"
            fill="#161B2A"
            stroke="#AAB2C3"
            strokeWidth="1.9"
          />
        </g>
        <path d="M55.1 43.7L32.3 5.7H68.4L125.4 38.95L55.1 43.7Z" fill="#AAB2C3" />
        <path d="M38 15.2H83.6L92.15 20.9H41.8L38 15.2Z" fill="#FF7A3D" />
        <path d="M24.7 49.4L9.5 45.6V76L24.7 72.2V49.4Z" fill="#161B2A" />
        <path d="M9.5 51.3L4.75 52.25V69.35L9.5 70.3V51.3Z" fill="#FF7A3D" />
        <path
          d="M376.2 62.7C361 53.2 334.4 44.65 302.1 41.8L114 38C91.2 38 66.5 41.8 41.8 47.5L24.7 51.3V70.3L49.4 76C114 81.7 266 81.7 313.5 77.9C342 75.05 364.8 69.35 376.2 62.7Z"
          fill="url(#flight-jet-hull)"
        />
        <path
          d="M376.2 62.7C364.8 69.35 342 75.05 313.5 77.9C266 81.7 114 81.7 49.4 76L24.7 70.3V65.55C104.5 71.25 285 71.25 376.2 62.7Z"
          fill="#161B2A"
        />
        <path d="M106.4 67.45L258.4 65.55L201.4 76L87.4 79.8L106.4 67.45Z" fill="#AAB2C3" />
        <path d="M304 47.5L336.3 54.15L328.7 57.95L300.2 53.2L304 47.5Z" fill="#161B2A" />
        <path d="M66.5 57.95H285V59.85H66.5V57.95Z" fill="#FF7A3D" fillOpacity="0.85" />
        {/* The site header's mark, so the livery follows any logo change. */}
        <image href="/brand/expojet-mark.svg" x="130" y="44.3" width="9" height="9" />
        <text
          x="142"
          y="52"
          fill="#161B2A"
          fillOpacity="0.7"
          fontFamily="var(--font-geist-mono), monospace"
          fontSize="8.5"
          fontWeight="500"
          letterSpacing="2.3"
        >
          {productName.toUpperCase()}
        </text>
      </svg>
    </>
  );
}
