import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import Shell from "./Shell.svelte";
import { everyPlace, nameOf, pathOf, type Place } from "../lib/route";
import * as m from "../paraglide/messages.js";

const body = createRawSnippet(() => ({
  render: () => `<p data-testid="screen">what this place shows</p>`,
}));

/** Answers a press the way the console does, without navigating. */
const answering = (
  taken: Place[],
): ((place: Place, event: MouseEvent) => void) => {
  return (place, event) => {
    event.preventDefault();
    taken.push(place);
  };
};

describe("Shell", () => {
  it("puts the screen in the page's one main landmark", () => {
    render(Shell, { place: "overview", children: body });
    expect(screen.getByRole("main")).toContainElement(
      screen.getByTestId("screen"),
    );
  });

  // Each place is an address of its own, so a screen reader lists them, a
  // second tab opens one, and the back button leaves one behind.
  it("leads to every place with a link to its own address", () => {
    render(Shell, { place: "overview", children: body });

    for (const place of everyPlace) {
      expect(
        screen.getByRole("link", { name: new RegExp(nameOf(place)) }),
      ).toHaveAttribute("href", pathOf(place));
    }
  });

  it("names the menu, so it is reachable on its own", () => {
    render(Shell, { place: "overview", children: body });
    expect(
      screen.getByRole("navigation", { name: m.nav_console() }),
    ).toBeInTheDocument();
  });

  it("says which of the addresses is the one being read", () => {
    render(Shell, { place: "logs", children: body });
    expect(
      screen.getByRole("link", { name: new RegExp(nameOf("logs")) }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("marks one place and no more", () => {
    render(Shell, { place: "logs", children: body });
    expect(screen.getAllByRole("link", { current: "page" })).toHaveLength(1);
  });

  it("hands a press to whatever answers addresses", async () => {
    const taken: Place[] = [];
    render(Shell, {
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
    render(Shell, { place: "overview", children: body });
    const link = screen.getByRole("link", {
      name: new RegExp(nameOf("checks")),
    });

    await userEvent.click(link);

    expect(link).toHaveAttribute("href", pathOf("checks"));
    expect(screen.getByTestId("screen")).toBeInTheDocument();
  });
});
