import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "../messages/en.json";

afterEach(cleanup);

describe("landing orbit", () => {
  test("names the outside influences a person may need to separate from their own wants", async () => {
    const { LandingOrbit } = await import(
      "../src/components/landing/landing-orbit"
    );

    const { container } = render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <LandingOrbit />
      </NextIntlClientProvider>,
    );

    const orbit = container.querySelector(".orbit-visual");

    expect(orbit?.textContent).toContain("FAMILY");
    expect(orbit?.textContent).toContain("FRIENDS");
    expect(orbit?.textContent).toContain("SOCIETY");
    expect(orbit?.textContent).toContain("SOCIAL MEDIA");
    expect(orbit?.textContent).toContain("WORK");
    expect(orbit?.textContent).toContain("MONEY");
    expect(orbit?.textContent).toContain("CULTURE");
    expect(orbit?.textContent).not.toContain("OTHER PEOPLE");
    expect(orbit?.textContent).not.toContain("EXPECTATIONS");
    expect(orbit?.textContent).not.toMatch(/0[1-7]/);
  });

  test("surrounds the person with five rings and a distinctly larger outer ring", async () => {
    const { LandingOrbit } = await import(
      "../src/components/landing/landing-orbit"
    );

    const { container } = render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <LandingOrbit />
      </NextIntlClientProvider>,
    );

    const rings = container.querySelectorAll(
      ".orbit-layer > circle:first-of-type",
    );
    const outerRadius = Number(rings[0]?.getAttribute("r"));
    const nextRadius = Number(rings[1]?.getAttribute("r"));

    expect(rings).toHaveLength(5);
    expect(outerRadius - nextRadius).toBeGreaterThanOrEqual(70);
  });
});
