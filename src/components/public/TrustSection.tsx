import { Check } from "lucide-react";

import { ScrollReveal } from "@/components/public/ScrollReveal";
import { trustSignals } from "@/config/hotel-amenities";

export function TrustSection() {
  return (
    <section className="border-y bg-muted/30 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-brand-gold">
              Your Peace of Mind
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">
              Book With Confidence
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {trustSignals.map((item) => (
              <div
                key={item.title}
                className="public-card-hover rounded-2xl border bg-card p-5 text-center shadow-sm"
              >
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                  <Check className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
