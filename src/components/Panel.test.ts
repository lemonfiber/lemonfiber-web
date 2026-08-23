import { render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import Panel from "./Panel.svelte";
import { stampFor } from "../lib/freshness";
import { wordFor } from "../lib/state";

const body = createRawSnippet(() => ({
  render: () => `<p data-testid="body">what the source said</p>`,
}));

const note = createRawSnippet(() => ({
  render: () => `<p data-testid="note">nothing here can be trusted</p>`,
}));

const answered = { kind: "answered", secondsAgo: 4 } as const;
const silent = { kind: "silent", secondsAgo: 240 } as const;

describe("Panel", () => {
  it("names itself with its title", () => {
    render(Panel, { title: "Disk", freshness: answered, children: body });
    expect(screen.getByRole("region", { name: "Disk" })).toBeInTheDocument();
  });

  // Rows style their own last one, which only works if the panel puts the
  // body's children where a row expects to find its siblings.
  it("puts the body's content directly inside the body", () => {
    const { container } = render(Panel, {
      title: "Disk",
      freshness: answered,
      children: body,
    });
    expect(
      container.querySelector(".body > [data-testid='body']"),
    ).not.toBeNull();
  });

  it("stamps when its own source last answered", () => {
    render(Panel, { title: "Disk", freshness: answered, children: body });
    expect(screen.getByText(stampFor(answered))).toBeInTheDocument();
  });

  it("marks the stamp with the trust that freshness carries", () => {
    render(Panel, { title: "Disk", freshness: answered, children: body });
    expect(
      screen.getByRole("img", { name: wordFor("known") }),
    ).toBeInTheDocument();
  });

  it("keeps the body's inset unless told to drop it", () => {
    const { container } = render(Panel, {
      title: "Disk",
      freshness: answered,
      children: body,
    });
    expect(container.querySelector(".body.flush")).toBeNull();
  });

  it("drops the body's inset for rows that meet the border", () => {
    const { container } = render(Panel, {
      title: "Disk",
      freshness: answered,
      children: body,
      flush: true,
    });
    expect(container.querySelector(".body.flush")).not.toBeNull();
  });
});

describe("when a panel's source is unreachable", () => {
  it("says so in place of the body", () => {
    render(Panel, {
      title: "Where things are found",
      freshness: silent,
      children: body,
      dead: note,
    });
    expect(screen.getByTestId("note")).toBeInTheDocument();
  });

  // Showing a figure beside "this cannot be trusted" is the contradiction the
  // dead state exists to prevent.
  it("shows none of what the source last said", () => {
    render(Panel, {
      title: "Where things are found",
      freshness: silent,
      children: body,
      dead: note,
    });
    expect(screen.queryByTestId("body")).toBeNull();
  });

  it("stamps how long the source has been silent", () => {
    render(Panel, {
      title: "Where things are found",
      freshness: silent,
      children: body,
      dead: note,
    });
    expect(screen.getByText(stampFor(silent))).toBeInTheDocument();
  });

  it("leaves every other panel on the screen alone", () => {
    render(Panel, {
      title: "Where things are found",
      freshness: silent,
      children: body,
      dead: note,
    });
    render(Panel, { title: "Disk", freshness: answered, children: body });

    expect(screen.getByTestId("body")).toBeInTheDocument();
    expect(screen.getByText(stampFor(answered))).toBeInTheDocument();
  });
});

describe("when a source falls silent under a panel already on screen", () => {
  it("swaps the body for the note without being remounted", async () => {
    const { rerender } = render(Panel, {
      title: "Where things are found",
      freshness: answered,
      children: body,
    });
    expect(screen.getByTestId("body")).toBeInTheDocument();

    await rerender({ freshness: silent, dead: note });

    expect(screen.getByTestId("note")).toBeInTheDocument();
    expect(screen.queryByTestId("body")).toBeNull();
    expect(screen.getByText(stampFor(silent))).toBeInTheDocument();
  });
});
