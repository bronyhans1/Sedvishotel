"use client";

import { useState } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { PublicBookButton, bookLabels } from "@/components/public/PublicBookButton";
import { PublicPageCTAs } from "@/components/public/PublicPageCTAs";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { hotelContact } from "@/config/hotel-contact";
import { hotelPolicies } from "@/config/hotel-policies";
import { useToast } from "@/hooks/use-toast";
import { publicImages } from "@/lib/public/images";

const CONTACT_SUCCESS_MESSAGE =
  "Thank you for contacting SEDVIS HOTEL. We have received your message and will respond shortly.";

export function ContactPageContent() {
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.success(CONTACT_SUCCESS_MESSAGE);
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  }

  return (
    <>
      <PublicPageHeader
        eyebrow="Contact Us"
        title="Contact Us"
        subtitle="We would be pleased to help with your stay, questions, and booking plans."
      />
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex justify-center">
            <PublicBookButton label={bookLabels.reserveRoom} size="lg" />
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <ScrollReveal className="space-y-6 lg:col-span-1">
              <div className="rounded-3xl border bg-card p-6 shadow-sm">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-gold">
                  Contact Information
                </p>
                <h3 className="mt-4 font-serif text-2xl font-bold">SEDVIS HOTEL</h3>
                <p className="mt-2 text-sm text-muted-foreground">Ho, Volta Region, Ghana</p>
                <ul className="mt-6 space-y-4 text-sm">
                  <li className="flex gap-3">
                    <MapPin className="h-5 w-5 shrink-0 text-brand-gold" />
                    <span>{hotelContact.address}</span>
                  </li>
                  <li className="flex gap-3">
                    <Phone className="h-5 w-5 shrink-0 text-brand-gold" />
                    <a href={`tel:${hotelContact.phoneTel}`} className="hover:text-brand-gold">
                      {hotelContact.phoneDisplay}
                    </a>
                  </li>
                  <li className="flex gap-3">
                    <Mail className="h-5 w-5 shrink-0 text-brand-gold" />
                    <a href={`mailto:${hotelContact.generalEmail}`} className="hover:text-brand-gold">
                      {hotelContact.generalEmail}
                    </a>
                  </li>
                </ul>
              </div>
              <div className="rounded-3xl border bg-card p-6 shadow-sm">
                <Clock className="h-6 w-6 text-brand-gold" />
                <h3 className="mt-3 font-semibold">Business Hours</h3>
                <p className="mt-2 text-sm text-muted-foreground">Reception available 24/7</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Check-in {hotelPolicies.checkInTime} · Check-out {hotelPolicies.checkOutTime}
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Response time:</span>{" "}
                  We aim to respond to enquiries as promptly as possible.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal className="lg:col-span-2">
              <div className="grid gap-8 lg:grid-cols-2">
                <div className="relative overflow-hidden rounded-3xl border shadow-sm lg:col-span-2">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${publicImages.about.hero})` }}
                    aria-hidden
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-navy/80 via-brand-navy/65 to-brand-navy/50" />
                  <div className="relative flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center sm:min-h-72">
                    <MapPin className="h-10 w-10 text-brand-gold" />
                    <h3 className="mt-4 font-serif text-2xl font-bold text-white sm:text-3xl">
                      SEDVIS HOTEL
                    </h3>
                    <p className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-brand-gold/90">
                      Ho, Volta Region, Ghana
                    </p>
                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
                      Conveniently located in the heart of Ho, offering comfortable accommodations
                      and warm hospitality.
                    </p>
                    <p className="mt-6 text-xs text-white/60">Map and directions coming soon.</p>
                  </div>
                </div>
                <div className="rounded-3xl border bg-card p-6 shadow-sm sm:col-span-2 lg:col-span-2">
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-gold">
                    Send Message
                  </p>
                  <h2 className="mt-2 font-serif text-2xl font-semibold">
                    We would love to hear from you.
                  </h2>
                  <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contact-name">Name</Label>
                        <Input
                          id="contact-name"
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-email">Email</Label>
                        <Input
                          id="contact-email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Phone</Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-subject">Subject</Label>
                      <Input
                        id="contact-subject"
                        value={form.subject}
                        onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-message">Message</Label>
                      <Textarea
                        id="contact-message"
                        rows={5}
                        value={form.message}
                        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full bg-brand-navy public-btn-lift">
                      Send Message
                    </Button>
                  </form>
                </div>
              </div>
            </ScrollReveal>
          </div>
          <div className="mt-16">
            <PublicPageCTAs primaryLabel={bookLabels.reserveRoom} />
          </div>
        </div>
      </section>
    </>
  );
}
