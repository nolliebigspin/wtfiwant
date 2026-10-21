import { PostgresAnalyticsStore } from "./store";
import { UmamiDestination, umamiConfigSchema } from "./umami";

export function createAnalytics(databaseUrl: string, env = process.env) {
  if (env.ANALYTICS_ENABLED !== "true" || env.NODE_ENV !== "production")
    return {};
  const secret = env.ANALYTICS_HASH_SECRET ?? "";
  const config = umamiConfigSchema.safeParse({
    url: env.UMAMI_URL,
    websiteId: env.UMAMI_WEBSITE_ID,
    appUrl: env.PUBLIC_APP_URL,
  });
  if (!config.success || secret.length < 32) {
    // Optional analytics misconfiguration must not take the paid app offline.
    console.error(
      "Analytics disabled: check UMAMI_URL, UMAMI_WEBSITE_ID, PUBLIC_APP_URL and ANALYTICS_HASH_SECRET",
    );
    return {};
  }
  if (isLocalAnalyticsHost(new URL(config.data.appUrl).hostname)) return {};
  return {
    analytics: PostgresAnalyticsStore.connect(
      databaseUrl,
      secret,
      new UmamiDestination(config.data),
    ),
  };
}

import { isLocalAnalyticsHost } from "@wtfiwant/shared";
