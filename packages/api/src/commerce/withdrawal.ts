import {
  withdrawalInputSchema,
  withdrawalResponseSchema,
} from "@wtfiwant/shared";
import { Hono } from "hono";
import type { EmailDeliveryProvider } from "../email/provider";
import type { AssessmentRepository } from "../repositories/types";

export function withdrawalRoutes(
  repository: AssessmentRepository,
  emailProvider?: EmailDeliveryProvider,
) {
  return new Hono().post("/", async (context) => {
    const input = withdrawalInputSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!input.success)
      return context.json({ error: "Invalid withdrawal declaration" }, 400);
    // Persist receipt before attempting email. Email failure must not lose or
    // change the arrival time of a declaration, including on retries.
    const receipt = await repository.saveWithdrawal(input.data);
    let confirmationSent = false;
    if (emailProvider) {
      try {
        await emailProvider.sendWithdrawalConfirmation(receipt);
        await repository.markWithdrawalConfirmationSent(receipt.requestId);
        confirmationSent = true;
      } catch {
        // Pending receipts are visible to the commerce reconciliation command.
      }
    }
    return context.json(
      withdrawalResponseSchema.parse({
        receivedAt: receipt.receivedAt,
        confirmationSent,
      }),
      201,
    );
  });
}
