import { describe, expect, test } from "bun:test";
import { createApp } from "../src/app";
import { InMemoryAssessmentRepository } from "../src/repositories/in-memory";

describe("private Compass PDF", () => {
  test("requires a paid, safe reflection; validates locale and returns a downloadable PDF", async () => {
    const repository = new InMemoryAssessmentRepository();
    const app = createApp({ repository });
    const seeded = await app.request("/dev/seed/burned_out", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: "de" }),
    });
    const view = await seeded.json();
    const path = `/sessions/${view.session.id}/report.pdf`;
    expect((await app.request(path)).status).toBe(402);
    const checkout = await repository.saveCheckout(view.session.id, {
      id: "cs_test_pdf",
      url: "https://example.test",
    });
    await repository.markPurchasePaid({
      checkoutSessionId: checkout.checkoutSessionId,
      paymentIntentId: "pi_pdf",
      recipientEmail: "test@example.test",
      currency: "eur",
      amountTotal: 1900,
      consentRecordedAt: null,
    });
    expect((await app.request(`${path}?locale=fr`)).status).toBe(400);
    const pdf = await app.request(`${path}?locale=de`);
    expect(pdf.status).toBe(200);
    expect(pdf.headers.get("content-type")).toBe("application/pdf");
    expect(pdf.headers.get("content-disposition")).toContain("compass-de.pdf");
    expect(pdf.headers.get("cache-control")).toContain("no-store");
    const bytes = await pdf.arrayBuffer();
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(10000);
    await repository.setStatus(view.session.id, "safety_paused");
    expect((await app.request(path)).status).toBe(409);
    await repository.deleteSession(view.session.id);
    expect((await app.request(path)).status).toBe(404);
  });
});
