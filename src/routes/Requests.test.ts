import { render, screen } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Requests from "./Requests.svelte";
import { household, unread } from "./fixture";
import type { Freshness } from "../lib/freshness";
import { wordOfRequestState } from "../lib/household";
import type { Household } from "../lib/wire";
import * as m from "../paraglide/messages.js";

const never: Freshness = { kind: "never" };
const answered: Freshness = { kind: "answered", secondsAgo: 8 };

/** The screen, given whatever this test hands it. */
function asked(
  held: Reading<Household> | undefined,
  freshness: Freshness = answered,
): void {
  render(Requests, { household: held, freshness });
}

describe("what each person asked for", () => {
  it("gives every member a panel of their own", () => {
    asked({ ok: true, value: household });
    for (const member of household.members) {
      expect(
        screen.getByRole("region", { name: member.name }),
      ).toBeInTheDocument();
    }
  });

  it("names each request by its title", () => {
    asked({ ok: true, value: household });
    expect(screen.getByText("The Expanse")).toBeInTheDocument();
  });

  // A request no service holds yet has no title to show.
  it("names an untitled request by what it is", () => {
    asked({ ok: true, value: household });
    expect(
      screen.getByText(m.request_a_kind({ media: "film" })),
    ).toBeInTheDocument();
  });

  it("names one that is neither by neither", () => {
    asked({ ok: true, value: household });
    expect(screen.getByText(m.request_unnamed())).toBeInTheDocument();
  });

  it("says where each request stands", () => {
    asked({ ok: true, value: household });
    expect(
      screen.getByText(wordOfRequestState("partly-here")),
    ).toBeInTheDocument();
    expect(screen.getByText(wordOfRequestState("here"))).toBeInTheDocument();
  });

  it("says plainly where the request service named a state this build does not know", () => {
    asked({ ok: true, value: household });
    expect(
      screen.getByText(m.request_state_unrecognised()),
    ).toBeInTheDocument();
  });

  // Nobody has said that a request turned down wants the operator, so nothing
  // here is given a severity the server never assigned.
  it("gives no request's state a severity", () => {
    asked({ ok: true, value: household });
    expect(screen.queryByRole("alert")).toBeNull();
    const declined = screen.getByText(wordOfRequestState("declined"));
    const here = screen.getByText(wordOfRequestState("here"));
    expect(declined.closest("td")?.className).toBe(
      here.closest("td")?.className,
    );
  });
});

describe("a household that has asked for nothing", () => {
  it("says so where the record was read", () => {
    asked({
      ok: true,
      value: { available: true, findings: [], members: [] },
    });

    expect(screen.getByText(m.requests_nobody())).toBeInTheDocument();
  });

  // The same empty list, and the opposite fact.
  it("says the record was unread where it was", () => {
    asked({ ok: true, value: unread });
    expect(screen.getByText(m.requests_unread())).toBeInTheDocument();
    expect(screen.queryByText(m.requests_nobody())).toBeNull();
  });
});

describe("what could not be read", () => {
  it("stands apart from what was", () => {
    asked({
      ok: true,
      value: { ...household, findings: [...unread.findings] },
    });

    const apart = screen.getByRole("region", { name: m.panel_unread() });
    expect(apart).toHaveTextContent(unread.findings[0] ?? "");
    expect(screen.getByRole("region", { name: "Ada" })).not.toHaveTextContent(
      unread.findings[0] ?? "",
    );
  });

  it("is not drawn where everything was read", () => {
    asked({ ok: true, value: household });
    expect(screen.queryByRole("region", { name: m.panel_unread() })).toBeNull();
  });
});

describe("before anything has answered", () => {
  it("holds a place rather than showing an empty household", () => {
    asked(undefined, never);
    expect(screen.getByText(m.waiting_answer())).toBeInTheDocument();
    expect(screen.queryByText(m.requests_nobody())).toBeNull();
  });
});

describe("when the reading did not answer", () => {
  it("says so in the words the client used", () => {
    asked(
      {
        ok: false,
        problem: { kind: "unreachable", message: "Nothing answered." },
      },
      { kind: "silent", secondsAgo: 300 },
    );

    expect(screen.getByText("Nothing answered.")).toBeInTheDocument();
  });
});
