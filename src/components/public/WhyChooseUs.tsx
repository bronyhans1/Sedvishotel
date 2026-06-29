import { Gem, MapPin, ShieldCheck, Sparkles } from "lucide-react";

import { ScrollReveal } from "@/components/public/ScrollReveal";

const items = [
  {
    icon: Gem,
    title: "Luxury Experience",
    description:
      "Refined interiors, premium linens, and attentive service at every touchpoint.",
  },
  {
    icon: MapPin,
    title: "Prime Location",
    description:
      "In the heart of Ho, Volta Region — convenient access to local business and cultural landmarks.",
  },
  {
    icon: Sparkles,
    title: "Exceptional Service",
    description:
      "A dedicated team committed to making every stay memorable.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Reservations",
    description:
      "Confidential booking and verified guest communications.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-brand-gold">
              Why Choose Us
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">
              The SEDVIS Difference
            </h2>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {items.map(({ icon: Icon, title, description }) => (
              <div key={title} className="public-card-hover text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-navy text-brand-gold">
                  <Icon className="h-7 w-7" />
                </span>
                <h3 className="mt-4 font-serif text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
