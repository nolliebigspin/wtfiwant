import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { createElement, type ReactNode } from "react";
import deMessages from "../messages/de.json";

const replacements: Array<[string, { locale: string }]> = [];

mock.module("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: { children: ReactNode; href: string }) =>
    createElement("a", { href, ...props }, children),
  usePathname: () => "/reflection/session-id",
  useRouter: () => ({
    replace: (pathname: string, options: { locale: string }) => {
      replacements.push([pathname, options]);
    },
  }),
}));

afterEach(() => {
  cleanup();
  replacements.length = 0;
});

describe("language navigation", () => {
  test("offers a language dropdown in the navigation and keeps the current route", async () => {
    const { LandingNav } = await import(
      "../src/components/landing/landing-nav"
    );

    render(
      <NextIntlClientProvider locale="de" messages={deMessages}>
        <LandingNav />
      </NextIntlClientProvider>,
    );

    const navigation = screen.getByRole("navigation");
    const language = within(navigation).getByRole("combobox", {
      name: "Sprache",
    });

    expect((language as HTMLSelectElement).value).toBe("de");
    await userEvent.selectOptions(language, "en");
    expect(replacements).toEqual([
      ["/reflection/session-id", { locale: "en" }],
    ]);
  });
});
