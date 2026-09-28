import { render, screen, within } from "@testing-library/svelte";
import { unreachable } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Shelf from "./Shelf.svelte";
import { kit, kitsEmptyShelf, kitsShelf, kitsUnreadShelf } from "./mine";
import type { Heard } from "../api/member";
import type { Freshness } from "../lib/freshness";
import type { Access } from "../lib/wire";
import { mediumOf, watchOf, type Shelf as Held } from "../lib/yours";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 8 };
const never: Freshness = { kind: "never" };

const theirs: Heard<readonly Access[]> = {
  at: "answered",
  value: [kit.access],
};

function drawn(
  shelf: Heard<Held> | undefined,
  access: Heard<readonly Access[]> = theirs,
): void {
  render(Shelf, {
    access,
    watched: access.at === "answered" ? answered : never,
    shelf,
    freshness: shelf?.at === "answered" ? answered : never,
  });
}

const panel = (name: string): HTMLElement =>
  screen.getByRole("region", { name });

describe("what the household holds that a member can watch", () => {
  // The server applies their limits before it answers, so every title it sent
  // is drawn and none is held back here.
  it("draws every title the media server showed them, and nothing more", () => {
    drawn({ at: "answered", value: kitsShelf });
    const table = within(panel(m.member_shelf_title())).getByRole("table");
    const rows = within(table).getAllByRole("row");

    expect(rows).toHaveLength(kitsShelf.holdings.length + 1);
    for (const holding of kitsShelf.holdings) {
      expect(within(table).getByText(holding.title)).toBeInTheDocument();
    }
  });

  it("says what kind of thing each is, and the year where the server knows one", () => {
    drawn({ at: "answered", value: kitsShelf });
    expect(screen.getByText("2016")).toBeInTheDocument();
    expect(screen.getByText(mediumOf("series"))).toBeInTheDocument();
    expect(screen.getByText(mediumOf("other"))).toBeInTheDocument();
  });

  it("says there is nothing to watch yet where the shelf was read and holds nothing", () => {
    drawn({ at: "answered", value: kitsEmptyShelf });
    expect(panel(m.member_shelf_title())).toHaveTextContent(
      m.member_shelf_empty(),
    );
  });

  // An unread shelf is not an empty one, and why it was unread is the
  // operator's to read.
  it("says the shelf could not be read, not that it is empty, and not why", () => {
    drawn({ at: "answered", value: kitsUnreadShelf });
    const shelf = panel(m.member_shelf_title());
    expect(shelf).toHaveTextContent(m.member_shelf_unread());
    expect(shelf).not.toHaveTextContent(m.member_shelf_empty());
    for (const finding of kitsUnreadShelf.findings) {
      expect(screen.queryByText(finding)).toBeNull();
    }
  });

  // Nothing from an earlier read stands in for one that went unanswered.
  it("says the shelf could not be read where lemonfiber did not answer", () => {
    drawn({ at: "unanswered", problem: unreachable() });
    expect(panel(m.member_shelf_title())).toHaveTextContent(
      m.member_shelf_unread(),
    );
    expect(screen.queryByText(unreachable().message)).toBeNull();
  });

  it("holds a place for both while nothing has answered", () => {
    render(Shelf, {
      access: undefined,
      watched: never,
      shelf: undefined,
      freshness: never,
    });
    expect(screen.getAllByRole("status")).toHaveLength(2);
  });
});

describe("what a member can watch", () => {
  it("says what lemonfiber answered they are held to", () => {
    drawn({ at: "answered", value: kitsShelf });
    const watching = panel(m.member_watch_title());
    for (const line of watchOf(kit.access)) {
      expect(watching).toHaveTextContent(line);
    }
  });

  it("says it could not be read where lemonfiber did not answer", () => {
    drawn(
      { at: "answered", value: kitsShelf },
      { at: "unanswered", problem: unreachable() },
    );
    const watching = panel(m.member_watch_title());
    expect(watching).toHaveTextContent(m.member_watch_unread());
    expect(watching).not.toHaveTextContent(m.member_watch_both());
  });

  it("says it could not be read where lemonfiber answered about nobody", () => {
    drawn({ at: "answered", value: kitsShelf }, { at: "answered", value: [] });
    expect(panel(m.member_watch_title())).toHaveTextContent(
      m.member_watch_unread(),
    );
  });
});
