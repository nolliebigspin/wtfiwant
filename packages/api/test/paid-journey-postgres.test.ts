import { describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { JOURNEY_VERSION, refinementPlanSchema } from "@wtfiwant/shared";
import postgres from "postgres";
import { LocalAIProvider } from "../src/ai/local";
import { localDirection } from "../src/ai/local-compass";
import { PostgresAIJobStore } from "../src/journey/postgres";
import { PostgresAssessmentRepository } from "../src/repositories/postgres";

const url = process.env.PAID_JOURNEY_TEST_DATABASE_URL;
describe("durable paid AI jobs in PostgreSQL", () => {
  test.skipIf(!url)(
    "serializes claims and refinement snapshots, publishes atomically and cascades deletion",
    async () => {
      if (!url) throw new Error("Explicit isolated test database required");
      const admin = postgres(url, { max: 1 });
      const schema = `paid_test_${crypto.randomUUID().replaceAll("-", "")}`;
      await admin.unsafe(`CREATE SCHEMA ${schema}`);
      const sql = postgres(url, {
        max: 6,
        connection: { search_path: schema },
      });
      try {
        const directory = new URL("../migrations/", import.meta.url);
        for (const file of (await readdir(directory))
          .filter((file) => file.endsWith(".sql"))
          .sort())
          await sql.unsafe(await readFile(new URL(file, directory), "utf8"));
        const repository = new PostgresAssessmentRepository(sql);
        const jobs = new PostgresAIJobStore(sql);
        const record = await repository.createSession();
        const id = record.session.id;
        const input = {
          answers: { "life.chosen": "More room for friends" },
          model: "test-model",
          version: JOURNEY_VERSION,
        };
        const enqueued = await Promise.all([
          jobs.enqueue(id, "plan", "de", input),
          jobs.enqueue(id, "plan", "en", input),
        ]);
        expect(enqueued[0].id).toBe(enqueued[1].id);
        const claimed = (
          await Promise.all([jobs.claim(), jobs.claim()])
        ).filter((job) => job !== null);
        expect(claimed).toHaveLength(1);
        const planJob = claimed[0];
        if (!planJob) throw new Error("No claimed job");
        const plan = refinementPlanSchema.parse({
          questions: [
            {
              id: "q1",
              question: "Was würdest du in deinem Alltag dafür ändern?",
              evidenceQuestionIds: ["life.chosen"],
            },
          ],
        });
        expect(await jobs.complete(planJob, plan)).toBe(true);
        await jobs.answer(id, "q1", "One meeting-free afternoon");
        const synthesis = await jobs.enqueue(
          id,
          "synthesis",
          planJob.locale,
          input,
        );
        expect(synthesis.input.answers["refinement:q1"]).toMatchObject({
          answer: "One meeting-free afternoon",
        });
        expect(await jobs.answer(id, "q1", "Too late")).toBe(false);
        const synthesisClaim = await jobs.claim();
        if (!synthesisClaim) throw new Error("No synthesis");
        expect(
          await jobs.complete(
            synthesisClaim,
            localDirection(synthesis.input.answers, "de"),
          ),
        ).toBe(true);
        const review = {
          alignment: "adjusted" as const,
          northStar: "Room for friendship and meaningful work",
          priority: "Protect an afternoon first",
          feedback: "A promotion is not my priority.",
        };
        const saved = await Promise.all([
          jobs.saveReview(id, review),
          jobs.saveReview(id, {
            ...review,
            northStar: "A conflicting second choice",
          }),
        ]);
        expect(saved.filter(Boolean)).toHaveLength(1);
        const chosenReview = (await jobs.get(id, "synthesis"))?.review;
        const reports = await Promise.all([
          jobs.enqueue(id, "report", planJob.locale, input),
          jobs.enqueue(id, "report", planJob.locale, input),
        ]);
        expect(reports[0].id).toBe(reports[1].id);
        expect(reports[0].input.direction?.review).toEqual(chosenReview);
        expect(reports[0].input.answers["refinement:q1"]).toMatchObject({
          answer: "One meeting-free afternoon",
        });
        expect(await jobs.answer(id, "q1", "A late answer")).toBe(false);
        const report = await jobs.claim();
        if (!report) throw new Error("Missing report");
        // Expired lease results are fenced even if the original process returns.
        await sql`UPDATE paid_ai_jobs SET lease_until = now() - interval '1 second' WHERE id = ${report.id}`;
        const replacement = await jobs.claim();
        if (!replacement) throw new Error("Missing retry");
        const provider = new LocalAIProvider();
        const analysis = {
          version: JOURNEY_VERSION,
          model: provider.name,
          locale: report.locale,
          result: await provider.analyzeAssessment(
            input.answers,
            false,
            id,
            report.locale,
          ),
          createdAt: new Date().toISOString(),
        };
        expect(await jobs.complete(report, analysis)).toBe(false);
        expect(await jobs.complete(replacement, analysis)).toBe(true);
        expect((await repository.getSession(id))?.analysis?.locale).toBe(
          report.locale,
        );
        expect((await repository.getSession(id))?.session.status).toBe(
          "completed",
        );
        await repository.deleteSession(id);
        expect(await jobs.get(id, "report")).toBeNull();
        expect(await jobs.get(id, "plan")).toBeNull();
        expect(await jobs.get(id, "synthesis")).toBeNull();
      } finally {
        await sql.end();
        await admin.unsafe(`DROP SCHEMA ${schema} CASCADE`);
        await admin.end();
      }
    },
  );
});
