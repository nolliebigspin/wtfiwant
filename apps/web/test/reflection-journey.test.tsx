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
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import deMessages from "../messages/de.json";
import enMessages from "../messages/en.json";
import { ReflectionJourney } from "../src/components/reflection/reflection-journey";
import type { ReflectionClient } from "../src/lib/api";

afterEach(cleanup);

function renderJourney(ui: ReactElement, locale: "en" | "de" = "en") {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "de" ? deMessages : enMessages}
    >
      {ui}
    </NextIntlClientProvider>,
  );
}

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
    coachPrompts: [],
    preview: null,
    actionPlan: null,
    entitlements: ["assessment"],
    checkoutAvailable: false,
    legalLinks: null,
    ...overrides,
  };
}

describe("reflection journey", () => {
  test("offers and resolves an optional Coach Prompt at a chapter boundary", async () => {
    const resolved: Array<[string, string | null]> = [];
    const progress: string[] = [];
    const client: ReflectionClient = {
      async getSession() {
        return session({
          session: { ...session().session, currentQuestionId: "life.drifted" },
          answers: { "life.drifted": "My calendar filled itself." },
        });
      },
      async saveAnswer() {},
      async updateProgress(_id, _chapter, questionId) {
        progress.push(questionId);
      },
      async createCoachPrompt() {
        return {
          id: "4b129da1-e739-46d8-8898-5fed6f81885a",
          question: "Which part of that drift costs the most energy?",
          userResponse: null,
          resolvedAt: null,
        };
      },
      async resolveCoachPrompt(_id, promptId, response) {
        resolved.push([promptId, response]);
      },
    };

    renderJourney(
      <ReflectionJourney sessionId={session().session.id} client={client} />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Continue" }));
    expect(
      await screen.findByRole("heading", {
        name: "Which part of that drift costs the most energy?",
      }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));

    await waitFor(() =>
      expect(resolved).toEqual([
        ["4b129da1-e739-46d8-8898-5fed6f81885a", null],
      ]),
    );
    expect(progress).toEqual(["alive.memories"]);
  });

  test("shows German copy while saving canonical assessment values", async () => {
    const saves: Array<[string, unknown]> = [];
    const client: ReflectionClient = {
      async getSession() {
        return session();
      },
      async saveAnswer(_id, questionId, value) {
        saves.push([questionId, value]);
      },
      async updateProgress() {},
      async createCoachPrompt() {
        throw new Error("not used");
      },
      async resolveCoachPrompt() {},
    };

    renderJourney(
      <ReflectionJourney
        sessionId={session().session.id}
        locale="de"
        client={client}
      />,
      "de",
    );

    expect(
      await screen.findByRole("heading", {
        name: "Was beansprucht gerade den Großteil deiner Zeit und Energie?",
      }),
    ).toBeTruthy();
    expect(document.querySelector('[aria-current="step"]')).toBeTruthy();
    await userEvent.click(screen.getByLabelText("Arbeit"));
    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));

    await waitFor(() => expect(saves).toEqual([["life.energy", ["Work"]]]));
  });

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
      async createCoachPrompt() {
        throw new Error("not used");
      },
      async resolveCoachPrompt() {},
    };

    renderJourney(
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
