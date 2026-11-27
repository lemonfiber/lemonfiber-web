import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TellMeWhen from "./TellMeWhen.svelte";
import { kitsTelling } from "../api/hearings";
import * as m from "../paraglide/messages.js";

const answered = { at: "answered", value: kitsTelling } as const;

describe("tell me when", () => {
  it("switches each way offered by its household name, on where they are told", () => {
    render(TellMeWhen, { telling: answered, ontick: vi.fn() });

    expect(
      screen.getByRole("button", { name: "The family chat" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Our phones" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByText(m.member_tell_phone())).toBeInTheDocument();
  });

  it("asks for one way to be switched the other way", async () => {
    const ontick = vi.fn();
    render(TellMeWhen, { telling: answered, ontick });

    await userEvent.click(screen.getByRole("button", { name: "Our phones" }));
    expect(ontick).toHaveBeenCalledWith("phones");
  });

  it("says nothing is offered yet, rather than drawing an empty list", () => {
    render(TellMeWhen, {
      telling: { at: "answered", value: { ...kitsTelling, offered: [] } },
      ontick: vi.fn(),
    });
    expect(screen.getByText(m.member_tell_none())).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("says a choice did not go through, in lemonfiber's words where it said any", () => {
    const { unmount } = render(TellMeWhen, {
      telling: answered,
      choosing: {
        at: "unanswered",
        problem: { kind: "unreachable", message: "unreachable" },
      },
      ontick: vi.fn(),
    });
    expect(screen.getByText(m.member_tell_unchosen())).toBeInTheDocument();
    unmount();

    render(TellMeWhen, {
      telling: answered,
      choosing: { at: "declined", said: "Not one of the ways offered." },
      ontick: vi.fn(),
    });
    expect(
      screen.getByText("Not one of the ways offered."),
    ).toBeInTheDocument();
  });

  it("marks the ways busy while a choice is on its way", () => {
    render(TellMeWhen, {
      telling: answered,
      choosing: "sending",
      ontick: vi.fn(),
    });
    expect(screen.getByRole("list")).toHaveAttribute("aria-busy", "true");
  });

  it("waits for the house, and says so where it did not answer", () => {
    const { unmount } = render(TellMeWhen, {
      telling: undefined,
      ontick: vi.fn(),
    });
    expect(screen.getByText(m.waiting_answer())).toBeInTheDocument();
    unmount();

    render(TellMeWhen, {
      telling: {
        at: "unanswered",
        problem: { kind: "unreachable", message: "unreachable" },
      },
      ontick: vi.fn(),
    });
    expect(screen.getByText(m.member_tell_unread())).toBeInTheDocument();
  });
});
