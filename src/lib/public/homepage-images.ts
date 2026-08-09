/**
 * Homepage image assets — single source of truth.
 *
 * Replace files under public/images/hero/ or public/images/featured/
 * to update the homepage. Do not edit React components for routine photo swaps.
 *
 * Structure:
 *   public/images/hero/hero-01.jpg … hero-06.jpg
 *   public/images/featured/standard-left.jpg
 *   public/images/featured/deluxe-center.jpg
 *   public/images/featured/standard-right.jpg
 */

export type HomepageHeroSlide = {
  id: string;
  /** Path under /public — keep filenames stable when replacing files. */
  src: string;
  alt: string;
  label?: string;
};

export type HomepageFeaturedSlot = {
  id: "standard-left" | "deluxe-center" | "standard-right";
  src: string;
  alt: string;
  /** Public room catalog slug this card represents. */
  roomSlug: "standard-room" | "deluxe-room";
  highlight?: boolean;
};

const HOMEPAGE_HERO_DIR = "/images/hero";
const HOMEPAGE_FEATURED_DIR = "/images/featured";

/**
 * Cinematic hero slideshow. Order = display order.
 * To change photos: replace hero-01.jpg … hero-06.jpg (same names).
 * To add/remove a slide: add/remove an entry here and the matching file.
 */
export const homepageHeroSlides: HomepageHeroSlide[] = [
  {
    id: "hero-01",
    src: `${HOMEPAGE_HERO_DIR}/hero-01.jpg`,
    alt: "Standard Room at SEDVIS HOTEL with refined bedding and warm lighting",
    label: "Standard Room",
  },
  {
    id: "hero-02",
    src: `${HOMEPAGE_HERO_DIR}/hero-02.jpg`,
    alt: "Deluxe Room at SEDVIS HOTEL with spacious seating and elegant finishes",
    label: "Deluxe Room",
  },
  {
    id: "hero-03",
    src: `${HOMEPAGE_HERO_DIR}/hero-03.jpg`,
    alt: "Executive-style suite interior at SEDVIS HOTEL",
    label: "Executive Suite",
  },
  {
    id: "hero-04",
    src: `${HOMEPAGE_HERO_DIR}/hero-04.jpg`,
    alt: "Family suite accommodation at SEDVIS HOTEL",
    label: "Family Suite",
  },
  {
    id: "hero-05",
    src: `${HOMEPAGE_HERO_DIR}/hero-05.jpg`,
    alt: "SEDVIS HOTEL exterior and evening hospitality atmosphere",
    label: "Hotel Exterior",
  },
  {
    id: "hero-06",
    src: `${HOMEPAGE_HERO_DIR}/hero-06.jpg`,
    alt: "Reception corridor and lobby atmosphere at SEDVIS HOTEL",
    label: "Reception / Lobby",
  },
];

/**
 * Featured Rooms strip: Standard | Deluxe (center) | Standard.
 * To change photos: replace the three files under featured/ (same names).
 */
export const homepageFeaturedImages = {
  standardLeft: {
    id: "standard-left",
    src: `${HOMEPAGE_FEATURED_DIR}/standard-left.jpg`,
    alt: "Standard Room at SEDVIS HOTEL",
    roomSlug: "standard-room",
  },
  deluxeCenter: {
    id: "deluxe-center",
    src: `${HOMEPAGE_FEATURED_DIR}/deluxe-center.jpg`,
    alt: "Deluxe Room at SEDVIS HOTEL",
    roomSlug: "deluxe-room",
    highlight: true,
  },
  standardRight: {
    id: "standard-right",
    src: `${HOMEPAGE_FEATURED_DIR}/standard-right.jpg`,
    alt: "Standard Room at SEDVIS HOTEL — alternate view",
    roomSlug: "standard-room",
  },
} as const satisfies Record<string, HomepageFeaturedSlot>;

/** Ordered slots for the homepage Featured Rooms grid. */
export const homepageFeaturedSlots: HomepageFeaturedSlot[] = [
  homepageFeaturedImages.standardLeft,
  homepageFeaturedImages.deluxeCenter,
  homepageFeaturedImages.standardRight,
];

/** Hold duration before crossfade (ms). */
export const HERO_SLIDE_DURATION_MS = 6500;
/** Crossfade duration (ms). */
export const HERO_CROSSFADE_MS = 1400;
