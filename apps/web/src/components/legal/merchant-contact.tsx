import { type Locale, merchant } from "@wtfiwant/shared";

export function MerchantContact({ locale }: { locale: Locale }) {
  return (
    <address className="space-y-1 not-italic leading-relaxed">
      <p className="font-bold">{merchant.name}</p>
      <p>{locale === "de" ? "Einzelunternehmen" : "Sole proprietorship"}</p>
      <p>
        {merchant.street}
        <br />
        {merchant.postalCode} {merchant.city}
        <br />
        {merchant.country[locale]}
      </p>
      <p>
        <a href={merchant.telephoneHref}>{merchant.telephone}</a>
      </p>
      <p>
        <a className="break-all" href={`mailto:${merchant.email}`}>
          {merchant.email}
        </a>
      </p>
    </address>
  );
}
