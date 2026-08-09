/**
 * @deprecated Import hero slides and timing from `@/lib/public/homepage-images`.
 * Kept as a thin re-export so existing imports keep working during the asset refactor.
 */

export {
  homepageHeroSlides as publicHeroSlides,
  HERO_CROSSFADE_MS,
  HERO_SLIDE_DURATION_MS,
  type HomepageHeroSlide as PublicHeroSlide,
} from "@/lib/public/homepage-images";
