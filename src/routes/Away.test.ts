import { render, screen } from "@testing-library/svelte";
import { unreachable } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Away from "./Away.svelte";
import type { Answer } from "../api/member";
import * as m from "../paraglide/messages.js";

const drawn = (answer: Answer<string> | undefined): void => {
  render(Away, { answer });
};

describe("a household member at an address that is not theirs", () => {
  // Refused in lemonfiber's words, rather than answered with an empty page.
  it("shows the refusal in lemonfiber's own words", () => {
    const said = "This is not something this account may ask for.";
    drawn({ at: "refused", said });

    expect(screen.getByRole("status")).toHaveTextContent(m.member_away_lead());
    expect(screen.getByText(said)).toBeInTheDocument();
  });

  it("says it was turned away where lemonfiber's words did not arrive", () => {
    drawn({ at: "refused", said: undefined });
    expect(screen.getByText(m.member_away_unsaid())).toBeInTheDocument();
  });

  // What the stack says about why it did not answer is the operator's.
  it("says lemonfiber did not answer, in the member's words", () => {
    drawn({ at: "unanswered", problem: unreachable() });
    expect(screen.getByText(m.member_unanswered())).toBeInTheDocument();
    expect(screen.queryByText(unreachable().message)).toBeNull();
  });

  // Nothing the console draws belongs on a member's screen, whatever came back.
  it("draws nothing of what came back where lemonfiber answered", () => {
    drawn({ at: "answered", value: "a line one of the services said" });
    expect(screen.getByText(m.member_away_nothing_lead())).toBeInTheDocument();
    expect(screen.queryByText("a line one of the services said")).toBeNull();
    expect(screen.queryByText(m.member_away_lead())).toBeNull();
  });

  it("holds a place while nothing has answered", () => {
    drawn(undefined);
    expect(screen.getByRole("status")).toHaveTextContent(m.waiting_answer());
  });
});
