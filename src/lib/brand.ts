// White-label brand config — everything guests and staff see that names the
// brand comes from here. Colors live in app/globals.css (CSS variables);
// fonts in app/layout.tsx + globals.css. A rebrand touches those three
// places and drops the logo into /public/brand/.
//
// Colors and type were matched from shintamani.com; logo and hero photo
// are the client's own. Still a draft: the headline/tagline/intro copy.

export const BRAND = {
  name: "Shinta Mani Wild",
  /** Shorter form for tight spots (mobile header, email sender name). */
  shortName: "Shinta Mani Wild",
  /** Big display line in the hero panel — the brand writes these short ("NATURE UNTAMED"). DRAFT, needs client sign-off. */
  headline: "Rooted in the Wild",
  tagline: "A living forest, planted by our guests.",
  /** The guest-facing story on the home/grove page. */
  intro:
    "Every tree here was planted by someone who stayed with us — in the Cardamom Mountains, " +
    "inside a reserve we protect with our rangers. Each one has its own page, its own photos, " +
    "and its own story, growing long after the journey home.",
  // Official artwork in /public/brand/ — transparent cutouts made from the
  // client's logo PNG (white-on-grey). Replace with vector SVGs if supplied.
  /** Full stacked lockup (emblem over name), for light backgrounds. */
  logo: "/brand/logo-sage.png",
  /** Same, white — for dark/photo backgrounds. */
  logoOnDark: "/brand/logo-white.png",
  /** The square emblem alone, for compact headers. */
  emblem: "/brand/emblem-sage.png",
  emblemOnDark: "/brand/emblem-white.png",
  /** Full-bleed hero photo for the forest page. Falls back to the latest tree photo when null. */
  heroImage: "/brand/hero.jpg" as string | null,
  /** The property whose grove the home page shows. */
  homePropertySlug: "shinta-mani-wild",
  /** Leaflet draws on canvas/SVG and can't read CSS variables. Keep in sync with globals.css. */
  map: {
    pin: "#566f5e", // brand-800
    zoneStroke: "#f2ede9", // sand-50 — reads on satellite imagery
    zoneFill: "#8fa095", // brand-400
  },
} as const;
