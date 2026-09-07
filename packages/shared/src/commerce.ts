import { z } from "zod";

export const digitalPurchaseAgreementSchema = z
  .object({
    version: z.string().min(1),
    locale: z.enum(["en", "de"]),
    statement: z.string().min(1),
    terms: z.string().min(1),
    refundPolicy: z.string().min(1),
  })
  .strict();

export type DigitalPurchaseAgreement = z.infer<
  typeof digitalPurchaseAgreementSchema
>;

export const withdrawalInputSchema = z
  .object({
    requestId: z.uuid(),
    name: z.string().trim().min(1).max(200),
    email: z.email().max(254),
    contractReference: z.string().trim().min(1).max(500),
    locale: z.enum(["en", "de"]),
  })
  .strict();

export const withdrawalReceiptSchema = withdrawalInputSchema.extend({
  receivedAt: z.iso.datetime(),
});
export const withdrawalResponseSchema = z
  .object({
    receivedAt: z.iso.datetime(),
    confirmationSent: z.boolean(),
  })
  .strict();
export type WithdrawalInput = z.infer<typeof withdrawalInputSchema>;
export type WithdrawalReceipt = z.infer<typeof withdrawalReceiptSchema>;
