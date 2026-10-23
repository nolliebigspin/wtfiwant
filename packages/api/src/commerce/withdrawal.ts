import {
  withdrawalInputSchema,
  withdrawalResponseSchema,
} from "@wtfiwant/shared";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { EmailDeliveryProvider } from "../email/provider";
import type { AssessmentRepository } from "../repositories/types";
import { deliverCommerceNotifications } from "./notifications";

export function withdrawalRoutes(
  repository: AssessmentRepository,
  emailProvider?: EmailDeliveryProvider,
) {
  return new Hono()
    .use("*", bodyLimit({ maxSize: 16_384 }))
    .post("/", async (context) => {
      const input = withdrawalInputSchema.safeParse(
        await context.req.json().catch(() => null),
      );
      if (!input.success)
        return context.json({ error: "Invalid withdrawal declaration" }, 400);
      // Persist receipt before attempting email. Email failure must not lose or
      // change the arrival time of a declaration, including on retries.
      const receipt = await repository.saveWithdrawal(input.data);
      await deliverCommerceNotifications(
        repository.commerce,
        emailProvider,
        receipt.requestId,
      );
      const confirmationSent = await repository.commerce.notificationSent(
        "withdrawal_confirmation",
        receipt.requestId,
      );
      return context.json(
        withdrawalResponseSchema.parse({
          receivedAt: receipt.receivedAt,
          confirmationSent,
        }),
        201,
      );
    });
}
