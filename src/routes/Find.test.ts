import { render, screen, waitFor, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { unreachable, type Problem } from "@lemonfiber/sdk-ts";
import { afterEach, describe, expect, it, vi } from "vitest";
import Find from "./Find.svelte";
import { dune, firstPage, lastPage, nothingFound, wouldAsk } from "./found";
import type { Heard } from "../api/member";
import type { Asked, Found, FoundTitle } from "../lib/askable";
import type { Freshness } from "../lib/freshness";
import { everythingInView } from "../lib/gallery.testing";
import * as m from "../paraglide/messages.js";

const fresh: Freshness = { kind: "never" };

const onasked = vi.fn();

afterEach(() => {
  vi.unstubAllGlobals();
});

/** What lemonfiber said where the words were too few. */
const tooShort: Problem = {
  kind: "misasked",
  message: "Type at least two letters to search.",
  code: "WISH-1",
};

interface Given {
  term?: string;
  pages?: readonly Found[];
  reading?: "first" | "more";
  unread?: Exclude<Heard<Found>, { at: "answered" }>;
  opened?: FoundTitle;
  rehearsal?: Heard<Asked>;
  posters?: (key: string) => Promise<Blob | undefined>;
}

/** What each thing the screen asks for was asked with. */
interface Pressed {
  readonly oninput: ReturnType<typeof vi.fn>;
  readonly onsearch: ReturnType<typeof vi.fn>;
  readonly onmore: ReturnType<typeof vi.fn>;
  readonly onagain: ReturnType<typeof vi.fn>;
  readonly onopen: ReturnType<typeof vi.fn>;
  readonly onask: ReturnType<typeof vi.fn>;
  readonly onrehearse: ReturnType<typeof vi.fn>;
  readonly onclose: ReturnType<typeof vi.fn>;
}

function drawn(given: Given = {}): Pressed {
  const on = {
    oninput: vi.fn(),
    onsearch: vi.fn(),
    onmore: vi.fn(),
    onagain: vi.fn(),
    onopen: vi.fn(),
    onask: vi.fn(),
    onrehearse: vi.fn(),
    onclose: vi.fn(),
  };
  render(Find, {
    term: "",
    pages: [],
    freshness: fresh,
    ...on,
    ...given,
  });
  return on;
}

const found = (): HTMLElement =>
  screen.getByRole("list", { name: m.found_for({ term: "dune" }) });

describe("asking for something, before a search", () => {
  it("says what to do first rather than drawing an empty list", () => {
    drawn();
    expect(screen.getByText(m.found_first())).toBeInTheDocument();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("offers one search box, and searches on a press or the enter key", async () => {
    const on = drawn({ term: "dune" });
    const search = screen.getByRole("search", { name: m.found_title() });
    await userEvent.type(
      within(search).getByRole("searchbox", { name: m.found_label() }),
      "x",
    );
    expect(on.oninput).toHaveBeenLastCalledWith("dunex");
    await userEvent.keyboard("{Enter}");
    await userEvent.click(
      within(search).getByRole("button", { name: m.found_search() }),
    );
    expect(on.onsearch).toHaveBeenCalledTimes(2);
  });

  it("holds a place while the first page is read, and searches no second time", () => {
    drawn({ reading: "first" });
    expect(screen.getByRole("status")).toHaveTextContent(m.waiting_answer());
    expect(
      screen.getByRole("button", { name: m.found_search() }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("says a search that could not be made is not one that found nothing, with a way to ask again", async () => {
    const on = drawn({ unread: { at: "unanswered", problem: unreachable() } });
    expect(screen.getByText(m.found_unread())).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: m.action_try_again() }),
    );
    expect(on.onagain).toHaveBeenCalledOnce();
  });

  it("says why lemonfiber turned the search down, in its words", () => {
    drawn({ unread: { at: "unanswered", problem: tooShort } });
    expect(screen.getByText(tooShort.message)).toBeInTheDocument();
  });
});

describe("what a search found", () => {
  it("says what asking does for them before anything found", () => {
    drawn({ pages: [firstPage] });
    const before = screen.getByRole("region", {
      name: m.member_asking_title(),
    });
    expect(before).toHaveTextContent(firstPage.approval);
    expect(before).toHaveTextContent(/3 of the 5 films allowed/);
  });

  it("draws each title as a poster, named, with where it stands", () => {
    drawn({ pages: [firstPage] });
    const titles = within(found()).getAllByRole("listitem");
    expect(titles).toHaveLength(3);
    expect(
      within(found()).getByRole("button", { name: "Dune" }),
    ).toBeInTheDocument();
    expect(found()).toHaveTextContent(m.found_partly_here());
    expect(found()).toHaveTextContent(m.found_on_its_way());
  });

  it("opens a title on a press", async () => {
    const on = drawn({ pages: [firstPage] });
    await userEvent.click(
      within(found()).getByRole("button", { name: "Dune" }),
    );
    expect(on.onopen).toHaveBeenCalledWith(dune);
  });

  it("offers the next page where lemonfiber said there is one", async () => {
    const on = drawn({ pages: [firstPage] });
    await userEvent.click(screen.getByRole("button", { name: m.found_more() }));
    expect(on.onmore).toHaveBeenCalledWith("page-2");
  });

  it("draws every page read, and offers no page after the last", () => {
    drawn({ pages: [firstPage, lastPage] });
    expect(within(found()).getAllByRole("listitem")).toHaveLength(4);
    expect(screen.queryByRole("button", { name: m.found_more() })).toBeNull();
  });

  it("holds a place while the next page is read", () => {
    drawn({ pages: [firstPage], reading: "more" });
    expect(screen.getByRole("status")).toHaveTextContent(m.waiting_answer());
    expect(screen.queryByRole("button", { name: m.found_more() })).toBeNull();
  });

  it("says where the next page could not be read, keeping what was found, with a way to ask again", async () => {
    const on = drawn({
      pages: [firstPage],
      unread: { at: "declined", said: "lemonfiber could not ask just now." },
    });
    expect(within(found()).getAllByRole("listitem")).toHaveLength(3);
    expect(
      screen.getByText("lemonfiber could not ask just now."),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: m.action_try_again() }),
    );
    expect(on.onagain).toHaveBeenCalledOnce();
  });

  it("says a search found nothing as that", () => {
    drawn({ pages: [nothingFound] });
    expect(screen.getByText(m.found_nothing())).toBeInTheDocument();
  });

  it("asks for each poster on screen by the key that tells the title apart", async () => {
    everythingInView();
    const posters = vi.fn(() => Promise.resolve(undefined));
    drawn({ pages: [firstPage], posters });
    await waitFor(() => {
      expect(posters).toHaveBeenCalledWith("movies/438631");
    });
  });

  it("letters every title where nothing asks for posters", () => {
    everythingInView();
    drawn({ pages: [firstPage] });
    expect(found().querySelector("img")).toBeNull();
  });

  it("opens the chosen title over the search, asking and rehearsing for that title", async () => {
    const on = drawn({
      pages: [firstPage],
      opened: dune,
      rehearsal: { at: "unanswered", problem: unreachable() },
    });
    const card = screen.getByRole("dialog", { name: "Dune" });
    await userEvent.click(
      within(card).getByRole("button", { name: m.action_try_again() }),
    );
    expect(on.onrehearse).toHaveBeenCalledWith(dune);
  });

  it("sends the ask for the title that is open", async () => {
    render(Find, {
      term: "dune",
      pages: [firstPage],
      freshness: fresh,
      opened: dune,
      rehearsal: { at: "answered", value: wouldAsk },
      oninput: vi.fn(),
      onsearch: vi.fn(),
      onmore: vi.fn(),
      onagain: vi.fn(),
      onopen: vi.fn(),
      onask: onasked,
      onrehearse: vi.fn(),
      onclose: vi.fn(),
    });
    await userEvent.click(screen.getByRole("button", { name: m.found_ask() }));
    expect(onasked).toHaveBeenCalledWith(dune);
  });
});
