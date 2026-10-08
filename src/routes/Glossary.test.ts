import { render, screen, within } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Settings from "./Settings.svelte";
import { seed, vocabulary } from "../api/vocabularies";
import type { Freshness } from "../lib/freshness";
import { entryLines, type Vocabulary } from "../lib/glossary";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The settings screen, with every word lemonfiber explains read. */
function reading(glossary: Reading<Vocabulary> | undefined): void {
  render(Settings, { quality: undefined, freshness: answered, glossary });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_words() });

describe("the words lemonfiber explains, on the settings screen", () => {
  it("holds a place while nothing has answered", () => {
    reading(undefined);
    expect(within(panel()).getByText(m.waiting_answer())).toBeInTheDocument();
  });

  it("names each word in the order somebody meets them, with what it means", () => {
    reading({ ok: true, value: vocabulary });
    const words = within(panel()).getByRole("list", {
      name: m.glossary_said(),
    });
    expect(
      within(words)
        .getAllByRole("heading")
        .map((heading) => heading.textContent),
    ).toStrictEqual(["seed", "hardlink"]);
    for (const line of entryLines(seed)) {
      expect(within(words).getByText(line)).toBeVisible();
    }
  });

  it("says so where lemonfiber explains no words", () => {
    reading({ ok: true, value: { words: [] } });
    expect(within(panel()).getByText(m.glossary_none())).toBeVisible();
    expect(within(panel()).queryByRole("list")).toBeNull();
  });

  it("says why they could not be read", () => {
    reading({ ok: false, problem: { kind: "refused", message: "No." } });
    expect(within(panel()).getByText("No.")).toBeVisible();
  });
});
