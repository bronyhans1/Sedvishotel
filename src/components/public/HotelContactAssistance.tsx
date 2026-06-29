import { Mail, MapPin, Phone } from "lucide-react";

import { normalizePhone } from "@/lib/public/phone";
import type { PublicHotelContactSettings } from "@/types/public";

type Props = {
  contact: PublicHotelContactSettings;
};

export function HotelContactAssistance({ contact }: Props) {
  const { phone, email, address } = contact;
  const hasAny = phone || email || address;

  if (!hasAny) {
    return null;
  }

  return (
    <div className="mt-8 rounded-2xl border bg-muted/30 p-6 text-sm">
      <p className="font-medium text-brand-navy">Need assistance?</p>
      <ul className="mt-4 space-y-3">
        {phone ? (
          <li className="flex gap-3">
            <Phone className="h-5 w-5 shrink-0 text-brand-gold" aria-hidden />
            <div>
              <span className="text-muted-foreground">Call: </span>
              <a
                href={`tel:${normalizePhone(phone) || phone}`}
                className="font-medium text-brand-navy hover:text-brand-gold"
              >
                {phone}
              </a>
            </div>
          </li>
        ) : null}
        {email ? (
          <li className="flex gap-3">
            <Mail className="h-5 w-5 shrink-0 text-brand-gold" aria-hidden />
            <div>
              <span className="text-muted-foreground">Email: </span>
              <a
                href={`mailto:${email}`}
                className="font-medium text-brand-navy hover:text-brand-gold"
              >
                {email}
              </a>
            </div>
          </li>
        ) : null}
        {address ? (
          <li className="flex gap-3">
            <MapPin className="h-5 w-5 shrink-0 text-brand-gold" aria-hidden />
            <div>
              <span className="text-muted-foreground">Location: </span>
              <span className="font-medium text-brand-navy">{address}</span>
            </div>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
