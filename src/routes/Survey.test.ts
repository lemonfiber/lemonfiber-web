import { render, screen, within } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Checks from "./Checks.svelte";
import { survey, unread } from "../api/surveys";
import type { Freshness } from "../lib/freshness";
import { surveyGroups, type Survey } from "../lib/survey";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The checks screen, with what is already on this machine read. */
function reading(found: Reading<Survey> | undefined): void {
  render(Checks, { diagnosis: undefined, freshness: answered, survey: found });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_survey() });

describe("what is already on this machine, on the checks screen", () => {
  it("is not drawn until it answers", () => {
    reading(undefined);
    expect(screen.queryByRole("region", { name: m.panel_survey() })).toBeNull();
  });

  it("draws every group the survey found under its heading", () => {
    reading({ ok: true, value: survey });
    for (const group of surveyGroups(survey)) {
      const drawn = within(panel()).getByRole("region", { name: group.title });
      for (const line of group.entries.flat()) {
        expect(within(drawn).getByText(line)).toBeVisible();
      }
    }
    expect(within(panel()).queryByText(m.survey_none())).toBeNull();
    expect(within(panel()).queryByText(m.survey_unread())).toBeNull();
  });

  it("says the engine did not answer, rather than that the machine is empty", () => {
    reading({ ok: true, value: unread });
    expect(within(panel()).getByText(m.survey_unread())).toBeVisible();
    expect(within(panel()).queryByText(m.survey_none())).toBeNull();
  });

  it("says so where nothing else runs on this machine", () => {
    reading({ ok: true, value: { ...unread, read: true } });
    expect(within(panel()).getByText(m.survey_none())).toBeVisible();
    expect(within(panel()).queryByRole("heading", { level: 3 })).toBeNull();
  });

  it("says why it could not be read", () => {
    reading({ ok: false, problem: { kind: "refused", message: "No." } });
    expect(within(panel()).getByText("No.")).toBeVisible();
  });
});
