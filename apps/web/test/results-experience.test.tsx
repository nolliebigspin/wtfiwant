import { afterEach, describe, expect, test } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  ActionPlanInput,
  Analysis,
  AnalysisResponse,
  SessionView,
} from "@wtfiwant/shared";
import { NextIntlClientProvider } from "next-intl";
import deMessages from "../messages/de.json";
import enMessages from "../messages/en.json";
import {
  type ResultsClient,
  ResultsExperience,
} from "../src/components/results/results-experience";

afterEach(cleanup);

const analysis: Analysis = {
  summary:
    "Your answers suggest that autonomy and close relationships both matter.",
  coreDrivers: [
    {
      id: "autonomy",
      name: "Autonomy",
      explanation: "You repeatedly described wanting control over your time.",
      evidenceQuestionIds: ["life.chosen"],
      confidence: "medium",
    },
    {
      id: "connection",
      name: "Connection",
      explanation: "Your memories include people you trust.",
      evidenceQuestionIds: ["life.chosen"],
      confidence: "medium",
    },
    {
      id: "growth",
      name: "Growth",
      explanation: "You want challenge that still leaves room to live.",
      evidenceQuestionIds: ["anti_life.description"],
      confidence: "low",
    },
  ],
  tensions: [
    {
      id: "freedom-belonging",
      sideA: "Freedom",
      sideB: "Belonging",
      explanation: "You want movement without losing your people.",
      evidenceQuestionIds: ["life.chosen"],
    },
  ],
  externalInfluences: [],
  antiLife: {
    themes: ["Waiting for weekends"],
    summary: "A life where work owns nearly every hour.",
    evidenceQuestionIds: ["anti_life.description"],
  },
  possibleDirections: [
    {
      title: "Build around autonomy",
      explanation: "Test more control without quitting everything.",
      whyItFits: "It matches a repeated pattern.",
      evidenceQuestionIds: ["life.chosen"],
    },
    {
      title: "Keep people within reach",
      explanation: "Design change with connection as a constraint.",
      whyItFits: "Your alive moments include close friends.",
      evidenceQuestionIds: ["life.chosen"],
    },
  ],
  goals: [],
  firstSteps: [
    {
      direction: "Build more autonomy into work",
      experiment: "Try one remote day each week for a month",
      immediateAction: "Ask which day could work",
      evidenceQuestionIds: ["life.chosen"],
    },
  ],
};

function view(): SessionView {
  return {
    session: {
      id: "a36ca7ae-35bf-4dd8-82fc-3eebf3e9d842",
      status: "completed",
      currentChapter: "goals",
      currentQuestionId: "goals.current",
      createdAt: "2026-08-08T10:00:00.000Z",
      updatedAt: "2026-08-08T10:30:00.000Z",
      completedAt: "2026-08-08T10:30:00.000Z",
    },
    answers: {
      "life.chosen": "I chose flexible work.",
      "anti_life.description": "Waiting for weekends.",
    },
    followUps: [],
    coachPrompts: [],
    preview: null,
    actionPlan: null,
    entitlements: ["assessment", "full_analysis"],
    checkoutAvailable: true,
    legalLinks: {
      termsUrl: "https://wtfiwant.test/terms",
      refundPolicyUrl: "https://wtfiwant.test/refunds",
    },
  };
}

const storedAnalysis = {
  version: "v1",
  model: "test",
  locale: "en" as const,
  result: analysis,
  createdAt: "2026-08-08T10:30:00.000Z",
};

describe("results experience", () => {
  test("shows only a Compass Preview before payment", async () => {
    const unpaid: SessionView = {
      ...view(),
      entitlements: ["assessment"],
      preview: {
        locale: "en",
        summary: analysis.summary,
        coreDriver: analysis.coreDrivers[0],
        lockedSections: ["drivers", "tensions", "directions", "action_plan"],
      },
    };
    const client: ResultsClient = {
      async getSession() {
        return unpaid;
      },
      async analyze() {
        throw new Error("not used");
      },
      async getCompass() {
        throw new Error("unpaid clients cannot fetch the Full Compass");
      },
      async createCheckout() {
        return {
          status: "checkout_open",
          checkoutSessionId: "cs_test_preview",
          url: "https://checkout.stripe.test/cs_test_preview",
        };
      },
      async fulfillCheckout() {
        return "processing";
      },
      async resendFullCompass() {},
      async saveActionPlan() {},
      async deleteSession() {},
    };

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ResultsExperience sessionId={view().session.id} client={client} />
      </NextIntlClientProvider>,
    );

    expect(
      await screen.findByRole("button", { name: "Get my Full Compass" }),
    ).toBeTruthy();
    expect(screen.getByText(analysis.summary)).toBeTruthy();
    fireEvent.click(screen.getByText("Why do you think this?"));
    expect(await screen.findByText("I chose flexible work.")).toBeTruthy();
    expect(screen.queryByText("Directions worth exploring")).toBeNull();
  });

  test("shows the results interface in German", async () => {
    const client: ResultsClient = {
      async getSession() {
        const restored = view();
        restored.answers["life.chosen"] = ["Work"];
        return restored;
      },
      async getCompass() {
        return {
          analysis: { ...storedAnalysis, locale: "de" },
          actionPlan: null,
        };
      },
      async analyze(): Promise<AnalysisResponse> {
        throw new Error("not used");
      },
      async createCheckout() {
        throw new Error("not used");
      },
      async fulfillCheckout() {
        return "paid";
      },
      async resendFullCompass() {},
      async saveActionPlan() {},
      async deleteSession() {},
    };

    render(
      <NextIntlClientProvider locale="de" messages={deMessages}>
        <ResultsExperience
          sessionId={view().session.id}
          locale="de"
          client={client}
        />
      </NextIntlClientProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Dein Kompass" }),
    ).toBeTruthy();
    expect(screen.getAllByText("Warum denkst du das?").length).toBeGreaterThan(
      0,
    );
    fireEvent.click(screen.getAllByText("Warum denkst du das?")[0]);
    expect((await screen.findAllByText("Arbeit")).length).toBeGreaterThan(0);
  });

  test("shows analysis evidence and saves a concrete action plan", async () => {
    const saved: ActionPlanInput[] = [];
    const client: ResultsClient = {
      async getSession() {
        return view();
      },
      async getCompass() {
        return { analysis: storedAnalysis, actionPlan: null };
      },
      async analyze(): Promise<AnalysisResponse> {
        return { status: "complete", analysis: storedAnalysis };
      },
      async createCheckout() {
        throw new Error("not used");
      },
      async fulfillCheckout() {
        return "paid";
      },
      async resendFullCompass() {},
      async saveActionPlan(_id, input) {
        saved.push(input);
      },
      async deleteSession() {},
    };

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ResultsExperience sessionId={view().session.id} client={client} />
      </NextIntlClientProvider>,
    );
    expect(
      await screen.findByRole("heading", { name: "Your Compass" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: /direction 1/i })
        .getAttribute("aria-pressed"),
    ).toBe("true");

    fireEvent.click(screen.getAllByText("Why do you think this?")[0]);
    expect(
      (await screen.findAllByText("I chose flexible work.")).length,
    ).toBeGreaterThan(0);

    await userEvent.click(
      screen.getByRole("combobox", {
        name: "What's most likely to stop you?",
      }),
    );
    await userEvent.click(
      screen.getByRole("option", { name: "I overthink things" }),
    );
    await userEvent.type(
      screen.getByLabelText("If"),
      "I begin researching forever",
    );
    await userEvent.type(
      screen.getByLabelText("Then"),
      "I will take the first ten-minute action",
    );
    fireEvent.click(screen.getByRole("button", { name: "Start now" }));

    await waitFor(() => expect(saved).toHaveLength(1));
    expect(saved[0].immediateAction).toBe("Ask which day could work");
    expect(
      await screen.findByText("Started. Not solved — started."),
    ).toBeTruthy();
  });
});
