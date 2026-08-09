type Props = {
  className?: string;
};

/** Consistent dark gradient so hero copy stays readable on any slide. */
export function HeroOverlay({ className }: Props) {
  return (
    <div
      className={
        className ??
        "pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-navy/75 via-brand-navy/40 to-brand-navy/20"
      }
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/50 via-transparent to-brand-navy/25" />
    </div>
  );
}
