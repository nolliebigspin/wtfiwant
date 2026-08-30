import { LocalEmailDeliveryProvider } from "../email/local";
import { ResendEmailDeliveryProvider } from "../email/resend";
import { StripePaymentProvider } from "./stripe";

export function createCommerceProviders(env = process.env) {
  if (env.PAYMENTS_ENABLED !== "true")
    return { publicAppUrl: env.PUBLIC_APP_URL ?? "http://localhost:3000" };
  const required = (name: string) => {
    const value = env[name];
    if (!value)
      throw new Error(`${name} is required when payments are enabled`);
    return value;
  };
  return {
    paymentProvider: new StripePaymentProvider(
      required("STRIPE_SECRET_KEY"),
      required("STRIPE_PRICE_ID"),
      required("STRIPE_WEBHOOK_SECRET"),
      env.STRIPE_AUTOMATIC_TAX === "true",
    ),
    emailProvider:
      env.EMAIL_PROVIDER === "local" && env.NODE_ENV !== "production"
        ? new LocalEmailDeliveryProvider()
        : new ResendEmailDeliveryProvider(
            required("RESEND_API_KEY"),
            required("REPORT_EMAIL_FROM"),
          ),
    publicAppUrl: required("PUBLIC_APP_URL"),
    legalLinks: {
      termsUrl: required("TERMS_URL"),
      refundPolicyUrl: required("REFUND_POLICY_URL"),
    },
  };
}
