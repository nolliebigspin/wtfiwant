import { createApp } from "@wtfiwant/api";
import { createAIProvider } from "@wtfiwant/api/ai";
import { createCommerceProviders } from "@wtfiwant/api/commerce";
import { PostgresAssessmentRepository } from "@wtfiwant/api/repositories";

/**
 * The reflection API runs in-process with the web app. Analysis and follow-up
 * generation call the AI provider, so the handler needs more than the default
 * budget; fluid compute bills active CPU, not the time spent awaiting the model.
 */
export const maxDuration = 300;
export const dynamic = "force-dynamic";

type App = ReturnType<typeof createApp>;

let app: App | undefined;

/**
 * Built lazily, then reused for the lifetime of the instance: the connection
 * pool and AI provider outlive a single request, but must not be constructed
 * while Next collects route configuration at build time, when the database
 * credentials are absent.
 */
function getApp(): App {
  if (app) return app;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  app = createApp({
    repository: PostgresAssessmentRepository.connect(databaseUrl),
    aiProvider: createAIProvider(),
    ...createCommerceProviders(),
    basePath: "/api",
  });
  return app;
}

const handler = (request: Request) => getApp().fetch(request);

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
