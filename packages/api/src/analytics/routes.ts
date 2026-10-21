import { analyticsEventSchema, analyticsForgetSchema } from "@wtfiwant/shared";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { AnalyticsStore } from "./store";

export function analyticsRoutes(store: AnalyticsStore, publicAppUrl: string) {
  const app = new Hono();
  app.use("*", async (context, next) => {
    context.header("Cache-Control", "no-store");
    context.header("X-Robots-Tag", "noindex");
    await next();
  });
  app.use(
    "*",
    bodyLimit({
      maxSize: 4096,
      onError: (context) =>
        context.json({ error: "Analytics payload too large" }, 413),
    }),
  );
  app.use("*", async (context, next) => {
    if (context.req.method === "POST") {
      if (
        context.req.header("origin") !== new URL(publicAppUrl).origin ||
        !context.req.header("content-type")?.startsWith("application/json")
      )
        return context.json({ error: "Same-origin JSON required" }, 403);
    }
    await next();
  });
  app.post("/events", async (context) => {
    const event = analyticsEventSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!event.success)
      return context.json({ error: "Invalid analytics event" }, 400);
    await store.record(event.data);
    return context.body(null, 204);
  });
  app.post("/forget", async (context) => {
    const input = analyticsForgetSchema.safeParse(
      await context.req.json().catch(() => null),
    );
    if (!input.success)
      return context.json({ error: "Invalid analytics visit" }, 400);
    await store.forget(input.data.visitId);
    return context.body(null, 204);
  });
  return app;
}
