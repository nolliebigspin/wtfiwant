import {
  actionPlanInputSchema,
  assessmentQuestions,
  followUpInputSchema,
  followUpResponseInputSchema,
  questionById,
  saveAnswerInputSchema,
  sessionViewSchema,
  updateSessionInputSchema,
} from "@wtfiwant/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { LocalAIProvider } from "./ai/local";
import { type AIProvider, analyzeAnswers } from "./ai/provider";
import {
  createSeedSession,
  type SeedPersona,
  seedPersonas,
} from "./dev/personas";
import { validateAnswer } from "./domain/answer-validation";
import { ANALYSIS_PROMPT_VERSION } from "./prompts/analysis";
import type { AssessmentRepository } from "./repositories/types";
import { classifySafety, SAFETY_MESSAGE } from "./safety/classifier";

type AppDependencies = {
  repository: AssessmentRepository;
  aiProvider?: AIProvider;
  webOrigin?: string;
};

export function createApp({
  repository,
  aiProvider = new LocalAIProvider(),
  webOrigin = "http://localhost:3000",
}: AppDependencies) {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: webOrigin,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type"],
    }),
  );

  app.get("/health", (context) => context.json({ status: "ok" }));

  app.post("/sessions", async (context) => {
    const session = sessionViewSchema.parse(await repository.createSession());
    return context.json(session, 201);
  });

  app.get("/sessions/:id", async (context) => {
    const session = await repository.getSession(context.req.param("id"));
    if (!session) return context.json({ error: "Reflection not found" }, 404);
    return context.json(sessionViewSchema.parse(session));
  });

  app.patch("/sessions/:id", async (context) => {
    const input = updateSessionInputSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!input.success)
      return context.json({ error: "Invalid progress update" }, 400);
    const question = assessmentQuestions.find(
      (candidate) =>
        candidate.id === input.data.currentQuestionId &&
        candidate.chapter === input.data.currentChapter,
    );
    if (!question)
      return context.json({ error: "Unknown assessment position" }, 400);
    const session = await repository.updateProgress(
      context.req.param("id"),
      input.data.currentChapter,
      input.data.currentQuestionId,
    );
    if (!session) return context.json({ error: "Reflection not found" }, 404);
    return context.json({ session });
  });

  app.put("/sessions/:id/answers/:questionId", async (context) => {
    const input = saveAnswerInputSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!input.success)
      return context.json({ error: "Invalid answer payload" }, 400);
    const answer = validateAnswer(
      context.req.param("questionId"),
      input.data.value,
    );
    if (!answer.success) return context.json({ error: answer.message }, 400);
    const saved = await repository.saveAnswer(
      context.req.param("id"),
      context.req.param("questionId"),
      input.data.value,
    );
    if (!saved) return context.json({ error: "Reflection not found" }, 404);
    return context.json({ saved: true });
  });

  app.post("/sessions/:id/analyze", async (context) => {
    const id = context.req.param("id");
    const view = await repository.getSession(id);
    if (!view) return context.json({ error: "Reflection not found" }, 404);
    if (view.analysis)
      return context.json({ status: "complete", analysis: view.analysis });

    if (classifySafety(view.answers) === "immediate_self_harm_risk") {
      await repository.setStatus(id, "safety_paused");
      return context.json({ status: "safety_paused", message: SAFETY_MESSAGE });
    }

    const missing = assessmentQuestions
      .filter((question) => question.required && !(question.id in view.answers))
      .map((question) => question.id);
    if (missing.length > 0) {
      return context.json(
        { error: "Reflection is incomplete", details: missing },
        409,
      );
    }

    const result = await analyzeAnswers(aiProvider, view.answers, id);
    const analysis = {
      version: ANALYSIS_PROMPT_VERSION,
      model: aiProvider.name,
      result,
      createdAt: new Date().toISOString(),
    };
    await repository.saveAnalysis(id, analysis);
    return context.json({ status: "complete", analysis });
  });

  app.get("/sessions/:id/analysis", async (context) => {
    const view = await repository.getSession(context.req.param("id"));
    if (!view) return context.json({ error: "Reflection not found" }, 404);
    if (!view.analysis)
      return context.json({ error: "Analysis is not ready" }, 404);
    return context.json({ analysis: view.analysis });
  });

  app.post("/sessions/:id/follow-up", async (context) => {
    const id = context.req.param("id");
    const input = followUpInputSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!input.success)
      return context.json({ error: "Invalid follow-up request" }, 400);
    const view = await repository.getSession(id);
    if (!view) return context.json({ error: "Reflection not found" }, 404);
    const question = questionById.get(input.data.questionId);
    if (!question) return context.json({ error: "Unknown question" }, 400);
    const chapterFollowUps = view.followUps.filter(
      (followUp) =>
        questionById.get(followUp.questionId)?.chapter === question.chapter,
    );
    if (chapterFollowUps.length >= 2) {
      return context.json(
        { error: "Follow-up limit reached for this chapter" },
        409,
      );
    }
    const generatedQuestion = await aiProvider.generateFollowUp(
      input.data.questionId,
      input.data.answer,
      id,
    );
    const followUp = {
      id: crypto.randomUUID(),
      questionId: input.data.questionId,
      userAnswer: input.data.answer,
      generatedQuestion,
      userResponse: null,
      createdAt: new Date().toISOString(),
    };
    await repository.saveFollowUp(id, followUp);
    return context.json({ followUp }, 201);
  });

  app.put("/sessions/:id/follow-up/:followUpId", async (context) => {
    const input = followUpResponseInputSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!input.success)
      return context.json({ error: "Invalid follow-up response" }, 400);
    const saved = await repository.saveFollowUpResponse(
      context.req.param("id"),
      context.req.param("followUpId"),
      input.data.response,
    );
    if (!saved) return context.json({ error: "Follow-up not found" }, 404);
    return context.json({ saved: true });
  });

  app.put("/sessions/:id/action-plan", async (context) => {
    const input = actionPlanInputSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!input.success)
      return context.json({ error: "Invalid action plan" }, 400);
    const saved = await repository.saveActionPlan(
      context.req.param("id"),
      input.data,
    );
    if (!saved) return context.json({ error: "Reflection not found" }, 404);
    const view = await repository.getSession(context.req.param("id"));
    return context.json({ actionPlan: view?.actionPlan });
  });

  if (process.env.NODE_ENV !== "production") {
    app.post("/dev/seed/:persona", async (context) => {
      const persona = context.req.param("persona") as SeedPersona;
      if (!(persona in seedPersonas))
        return context.json({ error: "Unknown seed persona" }, 400);
      const view = await createSeedSession(repository, persona);
      return context.json(view, 201);
    });
  }

  app.delete("/sessions/:id", async (context) => {
    const deleted = await repository.deleteSession(context.req.param("id"));
    if (!deleted) return context.json({ error: "Reflection not found" }, 404);
    return context.body(null, 204);
  });

  app.notFound((context) => context.json({ error: "Not found" }, 404));
  app.onError((error, context) => {
    console.error("Unhandled API error", { name: error.name });
    return context.json({ error: "Something went wrong" }, 500);
  });

  return app;
}

export const firstQuestionId = assessmentQuestions[0].id;
