import { defaultLocale, locales } from "@wtfiwant/shared";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
