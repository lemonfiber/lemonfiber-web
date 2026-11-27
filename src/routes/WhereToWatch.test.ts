import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import WhereToWatch from "./WhereToWatch.svelte";
import { addressAt, kitsDoor } from "../api/hearings";
import * as m from "../paraglide/messages.js";

describe("where a member goes to watch", () => {
  it("hands each place as a link and as a code, in lemonfiber's words", () => {
    render(WhereToWatch, { door: { at: "answered", value: kitsDoor } });

    expect(
      screen.getByRole("link", {
        name: m.member_door_open({ service: "Where you ask" }),
      }),
    ).toHaveAttribute("href", addressAt("house.local:5055"));
    expect(
      screen.getByRole("img", {
        name: m.member_door_code({ service: "Where you watch" }),
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(kitsDoor.meaning)).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("leaves out a place that does not answer from here, saying why", () => {
    const away = kitsDoor.beside[1]?.unaddressed ?? "";
    render(WhereToWatch, { door: { at: "answered", value: kitsDoor } });

    expect(screen.getByText(away)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: m.member_door_open({ service: "Where you read" }),
      }),
    ).toBeNull();
  });

  it("draws no address that does not answer from here, even where nothing was said of it", () => {
    const away = addressAt("far.example:9000");
    render(WhereToWatch, {
      door: {
        at: "answered",
        value: {
          ...kitsDoor,
          address: { url: away },
          reaches: "not-here",
          unaddressed: null,
          beside: [],
        },
      },
    });

    expect(screen.getByText("Where you ask")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
    expect(document.body.innerHTML).not.toContain(away);
  });

  it.each([
    ["javascript", "alert(1)"],
    ["JaVaScRiPt", "alert(1)"],
    ["data", "text/html,hi"],
    ["vbscript", "msgbox(1)"],
  ])("links no %s: address, and draws no code of it", (scheme, rest) => {
    const url = [scheme, rest].join(":");
    render(WhereToWatch, {
      door: {
        at: "answered",
        value: {
          ...kitsDoor,
          address: { url },
          unaddressed: "Ask whoever runs the house.",
          beside: [],
        },
      },
    });

    expect(screen.getByText("Where you ask")).toBeInTheDocument();
    expect(screen.getByText("Ask whoever runs the house.")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
    expect(
      screen.queryByRole("img", {
        name: m.member_door_code({ service: "Where you ask" }),
      }),
    ).toBeNull();
    expect(document.body.innerHTML).not.toContain(`${scheme}:`);
  });

  it("says there is nowhere to begin yet where lemonfiber says so", () => {
    render(WhereToWatch, {
      door: {
        at: "answered",
        value: { ...kitsDoor, service: null, address: null, beside: [] },
      },
    });

    expect(screen.getByText(kitsDoor.meaning)).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("waits for the house, and says so where it did not answer", () => {
    const { unmount } = render(WhereToWatch, { door: undefined });
    expect(screen.getByText(m.waiting_answer())).toBeInTheDocument();
    unmount();

    render(WhereToWatch, {
      door: {
        at: "unanswered",
        problem: { kind: "unreachable", message: "unreachable" },
      },
    });
    expect(screen.getByText(m.member_door_unread())).toBeInTheDocument();
  });

  it("says what lemonfiber declined it with", () => {
    render(WhereToWatch, { door: { at: "declined", said: "Not yours." } });
    expect(screen.getByText("Not yours.")).toBeInTheDocument();
  });
});
