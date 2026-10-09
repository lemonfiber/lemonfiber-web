import { render, screen, waitFor, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { unreachable } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Shelf from "./Shelf.svelte";
import {
  arrival,
  kit,
  kitsEmptyShelf,
  kitsShelf,
  kitsUnreadShelf,
} from "./mine";
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

/** Every place on the page counts as on screen the moment it is watched. */
function onScreenAtOnce(): void {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      readonly #told: (entries: { isIntersecting: boolean }[]) => void;
      constructor(told: (entries: { isIntersecting: boolean }[]) => void) {
        this.#told = told;
      }
      observe(): undefined {
        this.#told([{ isIntersecting: true }]);
        return undefined;
      }
      disconnect(): undefined {
        return undefined;
      }
    },
  );
}

describe("what the household holds that a member can watch", () => {
  // The server applies their limits before it answers, so every title it sent
  // is drawn and none is held back here.
  it("draws every title the media server showed them, and nothing more", () => {
    drawn({ at: "answered", value: kitsShelf });
    const shelf = within(panel(m.member_shelf_title())).getByRole("list", {
      name: m.member_shelf_title(),
    });

    expect(within(shelf).getAllByRole("listitem")).toHaveLength(
      kitsShelf.holdings.length,
    );
    for (const holding of kitsShelf.holdings) {
      expect(within(shelf).getAllByText(holding.title).length).toBeGreaterThan(
        0,
      );
    }
  });

  // A poster is fetched with the session's key while it is on screen, drawn
  // from an address the page made for its bytes, and a title whose poster
  // could not be had stays lettered.
  it("draws each poster on screen from the bytes it was handed, and letters the rest", async () => {
    onScreenAtOnce();
    URL.createObjectURL = (): string => "blob:arrival";
    const revoked = vi.fn();
    URL.revokeObjectURL = revoked;
    const [first] = kitsShelf.holdings;
    const posters = vi.fn((id: string) =>
      Promise.resolve(
        id === first?.id ? new Blob(["x"], { type: "image/png" }) : undefined,
      ),
    );
    const { unmount } = render(Shelf, {
      access: theirs,
      watched: answered,
      shelf: { at: "answered", value: kitsShelf },
      freshness: answered,
      posters,
    });

    await waitFor(() => {
      expect(document.querySelector("img")).toHaveAttribute(
        "src",
        "blob:arrival",
      );
    });
    expect(document.querySelectorAll("img")).toHaveLength(1);
    expect(posters.mock.calls.map(([id]) => id)).toStrictEqual(
      kitsShelf.holdings.map((one) => one.id),
    );

    unmount();
    expect(revoked).toHaveBeenCalledWith("blob:arrival");
    vi.unstubAllGlobals();
  });

  it("letters every title where nothing hands over posters", async () => {
    onScreenAtOnce();
    drawn({ at: "answered", value: kitsShelf });
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    expect(document.querySelectorAll("img")).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  it("says what kind of thing each is, and the year where the server knows one", () => {
    drawn({ at: "answered", value: kitsShelf });
    expect(
      screen.getByText(
        m.member_shelf_caption({ kind: mediumOf("film"), year: 2016 }),
      ),
    ).toBeInTheDocument();
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

describe("asking again, where something could not be read", () => {
  it("offers to ask again under each panel that could not be read", async () => {
    const onretry = vi.fn();
    render(Shelf, {
      access: { at: "unanswered", problem: unreachable() },
      watched: never,
      shelf: { at: "unanswered", problem: unreachable() },
      freshness: never,
      onretry,
    });
    const again = screen.getAllByRole("button", { name: m.action_try_again() });
    expect(again).toHaveLength(2);

    await userEvent.click(again[0] ?? document.body);

    expect(onretry).toHaveBeenCalledOnce();
  });

  it("offers nothing to press where nobody can ask again, or nothing went unread", () => {
    drawn({ at: "unanswered", problem: unreachable() });
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("the stamp a member is shown", () => {
  it("is none while the answers hold, and says how long a quiet one has been quiet", () => {
    const { unmount } = render(Shelf, {
      access: theirs,
      watched: answered,
      shelf: { at: "answered", value: kitsShelf },
      freshness: answered,
    });
    expect(screen.queryByText(/Checked/u)).toBeNull();
    unmount();

    render(Shelf, {
      access: theirs,
      watched: answered,
      shelf: { at: "answered", value: kitsShelf },
      freshness: { kind: "silent", secondsAgo: 300 },
    });
    expect(
      screen.getByText(m.fresh_silent({ span: m.span_minutes({ count: 5 }) })),
    ).toBeVisible();
  });
});

describe("one title, opened over the shelf", () => {
  const [first] = kitsShelf.holdings;

  it("opens the title whose poster is pressed", async () => {
    const onopen = vi.fn();
    render(Shelf, {
      access: theirs,
      watched: answered,
      shelf: { at: "answered", value: kitsShelf },
      freshness: answered,
      onopen,
      onclose: vi.fn(),
    });

    await userEvent.click(screen.getByRole("button", { name: "Arrival" }));

    expect(onopen).toHaveBeenCalledWith(first);
  });

  it("draws the opened title over the shelf, and reads it again when asked", async () => {
    const onopen = vi.fn();
    render(Shelf, {
      access: theirs,
      watched: answered,
      shelf: { at: "answered", value: kitsShelf },
      freshness: answered,
      opened: first,
      told: { at: "unanswered", problem: unreachable() },
      onopen,
      onclose: vi.fn(),
    });
    const card = screen.getByRole("dialog", { name: "Arrival" });

    await userEvent.click(
      within(card).getByRole("button", { name: m.action_try_again() }),
    );

    expect(onopen).toHaveBeenCalledWith(first);
  });

  it("draws an opened title with nothing to ask again with where nothing opens", () => {
    render(Shelf, {
      access: theirs,
      watched: answered,
      shelf: { at: "answered", value: kitsShelf },
      freshness: answered,
      opened: first,
      told: { at: "unanswered", problem: unreachable() },
      onclose: vi.fn(),
    });
    const card = screen.getByRole("dialog", { name: "Arrival" });
    expect(
      within(card).queryByRole("button", { name: m.action_try_again() }),
    ).toBeNull();
  });

  it("opens nothing where there is no way to put it away", () => {
    render(Shelf, {
      access: theirs,
      watched: answered,
      shelf: { at: "answered", value: kitsShelf },
      freshness: answered,
      opened: first,
      told: { at: "answered", value: arrival },
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
