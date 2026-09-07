import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { CheckoutResponse } from "@wtfiwant/shared";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "../messages/en.json";
import { PaymentTestForm } from "../src/components/payment-test-form";

afterEach(cleanup);

function setup({ available = true, failOnce = false, paid = false } = {}) {
  const seed = mock(async (_persona: string) => ({
    session: { id: "sample-session" },
    checkoutAvailable: available,
  }));
  const createCheckout = mock(async (): Promise<CheckoutResponse> => {
    if (failOnce) {
      failOnce = false;
      throw new Error("Temporary provider failure");
    }
    return paid
      ? { status: "paid" }
      : {
          status: "checkout_open",
          checkoutSessionId: "cs_test_sample",
          url: "https://checkout.stripe.test/sample",
        };
  });
  const navigate = mock((_url: string) => {});
  render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <PaymentTestForm client={{ seed, createCheckout }} navigate={navigate} />
    </NextIntlClientProvider>,
  );
  return { seed, createCheckout, navigate };
}

describe("instant payment test form", () => {
  test("seeds the chosen persona and opens normal Checkout without visiting the preview", async () => {
    const { seed, createCheckout, navigate } = setup();
    expect(seed).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "stable_adventure" },
    });
    const form = screen.getByRole("form", { name: "Test payment" });
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        "https://checkout.stripe.test/sample",
      ),
    );
    expect(seed).toHaveBeenCalledTimes(1);
    expect(seed).toHaveBeenCalledWith("stable_adventure");
    expect(createCheckout).toHaveBeenCalledTimes(1);
    expect(createCheckout).toHaveBeenCalledWith("sample-session", "en");
  });

  test("shows configuration guidance when purchases are disabled", async () => {
    const { createCheckout, navigate } = setup({ available: false });
    fireEvent.submit(screen.getByRole("form", { name: "Test payment" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "PAYMENTS_ENABLED",
      ),
    );
    expect(createCheckout).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  test("retries a failed Checkout on the same session", async () => {
    const { seed, createCheckout, navigate } = setup({ failOnce: true });
    const form = screen.getByRole("form", { name: "Test payment" });
    fireEvent.submit(form);
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Could not open Checkout",
      ),
    );
    fireEvent.submit(form);
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    expect(seed).toHaveBeenCalledTimes(1);
    expect(createCheckout).toHaveBeenCalledTimes(2);
  });

  test("returns to the report when the purchase is already paid", async () => {
    const { navigate } = setup({ paid: true });
    fireEvent.submit(screen.getByRole("form", { name: "Test payment" }));
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith("/en/result/sample-session"),
    );
  });
});
