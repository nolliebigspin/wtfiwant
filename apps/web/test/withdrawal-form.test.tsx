import { afterEach, expect, mock, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { WithdrawalInput } from "@wtfiwant/shared";
import { WithdrawalForm } from "../src/components/legal/withdrawal-form";

afterEach(cleanup);

test("requires review and explicit confirmation, then retries email with the same declaration", async () => {
  const submit = mock(async (_input: WithdrawalInput) => ({
    receivedAt: "2026-09-07T12:00:00.000Z",
    confirmationSent: false,
  }));
  render(<WithdrawalForm locale="de" submit={submit} />);
  fireEvent.change(screen.getByLabelText("Vollständiger Name"), {
    target: { value: "Test Customer" },
  });
  fireEvent.change(
    screen.getByLabelText("E-Mail-Adresse für die Eingangsbestätigung"),
    { target: { value: "test@example.com" } },
  );
  fireEvent.change(
    screen.getByLabelText("Welchen Vertrag möchtest du widerrufen?"),
    { target: { value: "Full Compass bought 2026-09-07" } },
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Weiter zur Bestätigung" }),
  );
  expect(submit).not.toHaveBeenCalled();
  expect(screen.getByText("Test Customer")).toBeTruthy();
  const confirm = screen.getByRole("button", { name: "Widerruf bestätigen" });
  fireEvent.click(confirm);
  fireEvent.click(confirm);
  await waitFor(() =>
    expect(screen.getByText("Widerruf eingegangen")).toBeTruthy(),
  );
  expect(submit).toHaveBeenCalledTimes(1);
  fireEvent.click(
    screen.getByRole("button", { name: "Bestätigung erneut senden" }),
  );
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
  expect(submit.mock.calls[1][0]).toEqual(submit.mock.calls[0][0]);
});
