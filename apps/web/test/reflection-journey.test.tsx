import { afterEach, describe, expect, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SessionView } from "@wtfiwant/shared";
import { ReflectionJourney } from "../src/components/reflection/reflection-journey";
import type { ReflectionClient } from "../src/lib/api";

afterEach(cleanup);

function session(overrides: Partial<SessionView> = {}): SessionView {
  return {
    session: {
      id: "a36ca7ae-35bf-4dd8-82fc-3eebf3e9d842",
      status: "in_progress",
      currentChapter: "you",
      currentQuestionId: "life.energy",
      createdAt: "2026-08-08T10:00:00.000Z",
      updatedAt: "2026-08-08T10:00:00.000Z",
      completedAt: null,
    },
    answers: {},
    followUps: [],
    analysis: null,
    actionPlan: null,
    entitlements: ["assessment", "full_analysis"],
    ...overrides,
  };
}

describe("reflection journey", () => {
  test("restores the saved screen, requires an answer, then saves before navigating", async () => {
    const saves: Array<[string, unknown]> = [];
    const client: ReflectionClient = {
      async getSession() {
        return session({
          session: { ...session().session, currentQuestionId: "life.chosen" },
          answers: { "life.chosen": "I chose the people around me." },
        });
      },
      async saveAnswer(_id, questionId, value) {
        saves.push([questionId, value]);
      },
      async updateProgress() {},
      async createFollowUp() {
        throw new Error("not used");
      },
      async saveFollowUpResponse() {},
    };

    render(
      <ReflectionJourney sessionId={session().session.id} client={client} />,
    );
    const restored = await screen.findByDisplayValue(
      "I chose the people around me.",
    );
    await userEvent.clear(restored);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      await screen.findByText(
        "Give this one an honest answer before moving on.",
      ),
    ).toBeTruthy();

    await userEvent.type(
      restored,
      "I chose to build things with people I respect.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() =>
      expect(saves).toEqual([
        ["life.chosen", "I chose to build things with people I respect."],
      ]),
    );
    expect(
      await screen.findByText(
        "What part feels like you somehow just ended up there?",
      ),
    ).toBeTruthy();
  });
});
