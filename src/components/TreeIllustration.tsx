/**
 * Line-drawn branch mark — no fill, a single delicate branch structure with
 * bud-marks at each tip. Chosen over a filled/blobbed canopy after a design
 * pass (see the "Grovi Tree Marks" exploration artifact) specifically for
 * reading as a botanical plate rather than an app icon.
 */
export function TreeIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 400" className={className} role="img" aria-label="Grovi">
      <g fill="none" stroke="#cfead9" strokeWidth="1.6" strokeLinecap="round">
        <path d="M150 380 L150 210" strokeWidth="4" stroke="#e7d9b8" />
        <path d="M150 260 C 130 240, 118 210, 122 178" />
        <path d="M150 250 C 172 232, 186 202, 182 170" />
        <path d="M150 230 C 138 205, 138 178, 150 152" />
        <path d="M150 225 C 163 202, 165 176, 154 150" />
        <path d="M122 178 C 108 168, 92 168, 80 178" />
        <path d="M122 178 C 112 158, 116 140, 132 128" />
        <path d="M182 170 C 196 160, 212 160, 224 172" />
        <path d="M182 170 C 190 150, 186 132, 170 122" />
        <path d="M150 152 C 150 128, 140 108, 150 88" />
        <path d="M150 152 C 152 130, 164 114, 154 92" />
      </g>
      <g fill="#e7d9b8">
        <circle cx="80" cy="178" r="4" />
        <circle cx="132" cy="128" r="4" />
        <circle cx="224" cy="172" r="4" />
        <circle cx="170" cy="122" r="4" />
        <circle cx="150" cy="88" r="5" />
        <circle cx="154" cy="92" r="3.5" opacity="0.7" />
      </g>
    </svg>
  );
}
