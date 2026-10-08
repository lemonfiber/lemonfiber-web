import { screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it } from "vitest";
import { cleared, raised } from "./fixture";
import { console_, framed, press, saying } from "./Console.testing";
import { wordOfWay } from "../lib/trouble";
import * as m from "../paraglide/messages.js";

describe("an alert as the stream says it starts or ends, over any screen", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/settings");
  });

  it("says what happened, what it means and what to do, and interrupts for an alarm", async () => {
    console_({ fetching: saying([framed("alert", raised)]) });
    const banner = await screen.findByRole("alert");
    expect(banner).toHaveTextContent(
      m.told_live_lead({ way: wordOfWay("onset"), summary: raised.summary }),
    );
    expect(banner).toHaveTextContent(raised.meaning);
    expect(banner).toHaveTextContent(raised.remedies[0] ?? "");
  });

  it("says one that ended without interrupting, and is put away when asked", async () => {
    console_({ fetching: saying([framed("alert", cleared)]) });
    expect(
      await screen.findByText(
        m.told_live_lead({
          way: wordOfWay("resolved"),
          summary: cleared.summary,
        }),
      ),
    ).toBeVisible();
    expect(screen.queryByRole("alert")).toBeNull();

    await press(m.action_told_dismiss());
    expect(
      screen.queryByText(
        m.told_live_lead({
          way: wordOfWay("resolved"),
          summary: cleared.summary,
        }),
      ),
    ).toBeNull();
  });
});
