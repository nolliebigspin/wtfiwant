import { afterEach, expect, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { DirectionReview } from "@wtfiwant/shared";
import { DirectionReviewForm } from "../src/components/results/direction-review";

afterEach(cleanup);
const draft = {
  northStar: "Make useful things with room for people",
  priority: "Test a bounded technical role",
  why: "Your chosen activities and relationships recur in your answers.",
  evidenceQuestionIds: ["life.chosen"],
  uncertainty: "Whether a management title helps is unclear.",
};

test("requires an active choice and preserves edited direction instead of accepting the draft silently", async () => {
  let saved: DirectionReview | undefined;
  render(
    <DirectionReviewForm
      draft={draft}
      locale="en"
      onSubmit={async (input) => {
        saved = input;
      }}
    />,
  );
  const submit = screen.getByRole("button", {
    name: "Use this direction to build my plan",
  });
  expect(submit.hasAttribute("disabled")).toBe(true);
  fireEvent.click(screen.getByRole("radio", { name: "This fits me." }));
  expect(submit.hasAttribute("disabled")).toBe(false);
  fireEvent.change(screen.getByLabelText("Your most important change now"), {
    target: { value: "Protect time for friends first" },
  });
  expect(
    screen
      .getByRole("radio", { name: "This fits me." })
      .hasAttribute("disabled"),
  ).toBe(true);
  expect(submit.hasAttribute("disabled")).toBe(true);
  fireEvent.change(
    screen.getByLabelText("What is missing or still uncertain?"),
    { target: { value: "A promotion is not my priority right now." } },
  );
  fireEvent.click(submit);
  await waitFor(() => expect(saved?.alignment).toBe("adjusted"));
  expect(saved?.priority).toBe("Protect time for friends first");
});

test("lets uncertain users proceed with an exploration direction in German", async () => {
  let saved: DirectionReview | undefined;
  render(
    <DirectionReviewForm
      draft={draft}
      locale="de"
      onSubmit={async (input) => {
        saved = input;
      }}
    />,
  );
  fireEvent.click(
    screen.getByRole("radio", {
      name: "Ich bin noch unsicher. Ich möchte diese Richtung erst erkunden.",
    }),
  );
  fireEvent.change(screen.getByLabelText("Was fehlt oder ist noch unklar?"), {
    target: {
      value: "Ich weiß noch nicht, ob das auch außerhalb der Arbeit passt.",
    },
  });
  fireEvent.click(
    screen.getByRole("button", {
      name: "Diese Richtung für meinen Plan verwenden",
    }),
  );
  await waitFor(() => expect(saved?.alignment).toBe("unsure"));
});
