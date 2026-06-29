import { ScrollReveal } from "@/components/public/ScrollReveal";
import { hotelAmenities } from "@/config/hotel-amenities";

export function AmenitiesSection() {
  return (
    <section className="bg-muted/40 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-brand-gold">
              Amenities
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">
              Thoughtful Comforts
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Designed to make every stay relaxing, convenient and memorable.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {hotelAmenities.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="public-card-hover rounded-2xl border bg-card p-6 shadow-sm"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
