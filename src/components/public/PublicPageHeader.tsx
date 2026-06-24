import { publicImages } from "@/lib/public/images";

type Props = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  /** Maps to a local background under public/images/backgrounds/ */
  background?: "pageHeader" | "galleryHeader";
};

export function PublicPageHeader({
  title,
  subtitle,
  eyebrow,
  background = "pageHeader",
}: Props) {
  const image =
    background === "galleryHeader"
      ? publicImages.backgrounds.galleryHeader
      : publicImages.backgrounds.pageHeader;

  return (
    <section className="relative flex min-h-[38vh] items-center justify-center overflow-hidden bg-brand-navy sm:min-h-[42vh]">
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="public-page-header-ken-burns absolute inset-0 bg-cover bg-center brightness-[1.05] contrast-[1.03] saturate-[1.04]"
          style={{ backgroundImage: `url(${image})` }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/75 via-brand-navy/45 to-brand-navy/25" />
      <div className="relative px-4 py-16 text-center sm:px-6 sm:py-20">
        <div className="public-page-header-glass mx-auto inline-block max-w-3xl rounded-2xl border border-white/10 px-6 py-6 sm:rounded-3xl sm:px-10 sm:py-8">
          {eyebrow ? (
            <div className="mb-5">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-brand-gold sm:text-sm">
                {eyebrow}
              </p>
              <div className="mx-auto mt-4 h-0.5 w-20 bg-brand-gold" aria-hidden />
            </div>
          ) : null}
          <h1 className="public-page-header-shadow font-serif text-4xl font-bold text-white sm:text-5xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="public-page-header-shadow mx-auto mt-4 max-w-2xl text-lg text-white/90">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
