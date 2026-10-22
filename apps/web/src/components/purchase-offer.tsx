"use client";

import { type PurchaseOffer, purchaseOfferSchema } from "@wtfiwant/shared";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

export function usePurchaseOffer() {
  const [offer, setOffer] = useState<PurchaseOffer | null>(null);
  useEffect(() => {
    let active = true;
    void fetch("/api/commerce/offer")
      .then((response) => response.json())
      .then((body) => {
        const parsed = purchaseOfferSchema.safeParse(body.offer);
        if (active && parsed.success) setOffer(parsed.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return offer;
}
export function formatOffer(offer: PurchaseOffer, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: offer.currency,
  }).format(
    offer.amount /
      10 **
        (new Intl.NumberFormat("en", {
          style: "currency",
          currency: offer.currency,
        }).resolvedOptions().maximumFractionDigits ?? 2),
  );
}
export function PurchaseOfferNotice() {
  const locale = useLocale();
  const offer = usePurchaseOffer();
  return (
    <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted">
      {locale === "de"
        ? `Deine Reflexion und dein Zwischenstand sind kostenlos. Ein persönlicher KI-Kompass mit bis zu fünf Rückfragen und PDF ist optional${offer ? ` für einmalig ${formatOffer(offer, locale)}` : " kostenpflichtig"}. Kein Abo.${offer && !offer.taxIncluded ? " Der endgültige Gesamtpreis wird vor der Zahlung angezeigt." : ""}`
        : `Your reflection and checkpoint are free. A personal AI Compass with up to five follow-up questions and a PDF is optional${offer ? ` for ${formatOffer(offer, locale)} once` : " and paid"}. No subscription.${offer && !offer.taxIncluded ? " The final total is shown before payment." : ""}`}
    </p>
  );
}
