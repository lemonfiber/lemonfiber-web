import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import Shell from "./Shell.svelte";
import { everyRoom, memberMenu, nameOfRoom, pathOfRoom } from "../lib/rooms";
import { consoleMenu, everyPlace, nameOf, pathOf } from "../lib/route";
import * as m from "../paraglide/messages.js";

const body = createRawSnippet(() => ({
  render: () => `<p data-testid="screen">what this place shows</p>`,
}));

/** Answers a press the way the console does, without navigating. */
const answering = (
  taken: string[],
): ((place: string, event: MouseEvent) => void) => {
  return (place, event) => {
    event.preventDefault();
    taken.push(place);
  };
};

describe("Shell", () => {
  it("puts the screen in the page's one main landmark", () => {
    render(Shell, { menu: consoleMenu, place: "overview", children: body });
    expect(screen.getByRole("main")).toContainElement(
      screen.getByTestId("screen"),
    );
  });

  // Each place is an address of its own, so a screen reader lists them, a
  // second tab opens one, and the back button leaves one behind.
  it("leads to every place with a link to its own address", () => {
    render(Shell, { menu: consoleMenu, place: "overview", children: body });

    for (const place of everyPlace) {
      expect(
        screen.getByRole("link", { name: new RegExp(nameOf(place)) }),
      ).toHaveAttribute("href", pathOf(place));
    }
  });

  it("names the menu, so it is reachable on its own", () => {
    render(Shell, { menu: consoleMenu, place: "overview", children: body });
    expect(
      screen.getByRole("navigation", { name: m.nav_console() }),
    ).toBeInTheDocument();
  });

  it("says which of the addresses is the one being read", () => {
    render(Shell, { menu: consoleMenu, place: "logs", children: body });
    expect(
      screen.getByRole("link", { name: new RegExp(nameOf("logs")) }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("marks one place and no more", () => {
    render(Shell, { menu: consoleMenu, place: "logs", children: body });
    expect(screen.getAllByRole("link", { current: "page" })).toHaveLength(1);
  });

  it("hands a press to whatever answers addresses", async () => {
    const taken: string[] = [];
    render(Shell, {
      menu: consoleMenu,
      place: "overview",
      ongo: answering(taken),
      children: body,
    });

    await userEvent.click(
      screen.getByRole("link", { name: new RegExp(nameOf("checks")) }),
    );

    expect(taken).toEqual(["checks"]);
  });

  // The menu is a set of links whether or not anything is listening to it, so
  // pressing one where nothing is asks the browser for the address instead.
  it("leaves the address to the browser where nothing answers", async () => {
    render(Shell, { menu: consoleMenu, place: "overview", children: body });
    const link = screen.getByRole("link", {
      name: new RegExp(nameOf("checks")),
    });

    await userEvent.click(link);

    expect(link).toHaveAttribute("href", pathOf("checks"));
    expect(screen.getByTestId("screen")).toBeInTheDocument();
  });

  // A household member is handed their own menu in the same chrome, and the
  // chrome knows nothing of either.
  it("leads a household member to their own rooms and to nothing of the console's", () => {
    render(Shell, { menu: memberMenu, place: "asked", children: body });

    for (const room of everyRoom) {
      expect(
        screen.getByRole("link", { name: new RegExp(nameOfRoom(room)) }),
      ).toHaveAttribute("href", pathOfRoom(room));
    }
    for (const place of everyPlace) {
      expect(
        screen.queryByRole("link", { name: new RegExp(nameOf(place)) }),
      ).toBeNull();
    }
    expect(
      screen.getByRole("navigation", { name: m.nav_member() }),
    ).toBeInTheDocument();
  });

  // An address that is none of the menu's places is not one of them, so no
  // link claims to be the page being read.
  it("marks no place where the address is none of the menu's", () => {
    render(Shell, { menu: memberMenu, place: undefined, children: body });
    expect(screen.queryAllByRole("link", { current: "page" })).toHaveLength(0);
  });
});
