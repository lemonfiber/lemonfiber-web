import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Node from "./Node.svelte";
import { everyState, wordFor } from "../lib/state";
import * as m from "../paraglide/messages.js";

const gluetun = {
  name: "gluetun",
  state: "known",
  figure: "185.65.135.72 · NL",
} as const;

describe("Node", () => {
  it("names the program the box stands for", () => {
    render(Node, gluetun);
    expect(screen.getByText("gluetun")).toBeInTheDocument();
  });

  it("shows the figure under the name", () => {
    render(Node, gluetun);
    expect(screen.getByText(gluetun.figure)).toBeInTheDocument();
  });

  it.each(everyState)("announces a %s program beside its name", (state) => {
    render(Node, { ...gluetun, state });
    expect(
      screen.getByRole("img", { name: wordFor(state) }),
    ).toBeInTheDocument();
  });

  it("gives a place on disk no mark, since it runs nothing", () => {
    render(Node, { name: "downloads", figure: "412 GB free" });
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("412 GB free")).toBeInTheDocument();
  });

  it("keeps the figure a quiet program last gave", () => {
    render(Node, { name: "sabnzbd", state: "quiet", figure: "0 B/s" });
    expect(screen.getByText("0 B/s")).toBeInTheDocument();
  });

  // The mark beside the name says the same thing, and a box this size has no
  // room to say it twice.
  it("leaves that figure uncaptioned", () => {
    render(Node, { name: "sabnzbd", state: "quiet", figure: "0 B/s" });
    expect(screen.queryByText(m.value_last_known())).toBeNull();
  });

  it("says in words when nothing ever measured the figure", () => {
    render(Node, { ...gluetun, state: "unknown" });
    expect(screen.queryByText(gluetun.figure)).toBeNull();
    expect(screen.getByText(m.value_not_known())).toBeInTheDocument();
  });
});

describe("how a node is drawn", () => {
  it("opens the border of a box whose program has gone quiet", () => {
    const { container } = render(Node, { ...gluetun, state: "quiet" });
    expect(container.querySelector(".node.quiet")).not.toBeNull();
  });

  it("closes the border of a box that is answering", () => {
    const { container } = render(Node, gluetun);
    expect(container.querySelector(".node.quiet")).toBeNull();
  });

  it("fades a box for a thing that is not set up yet", () => {
    const { container } = render(Node, {
      name: "your library",
      figure: "set up at step 5",
      pending: true,
    });
    expect(container.querySelector(".node.pending")).not.toBeNull();
  });

  it("leaves a box for a thing that exists at full weight", () => {
    const { container } = render(Node, gluetun);
    expect(container.querySelector(".node.pending")).toBeNull();
  });
});

describe("when a program falls quiet under a node already on screen", () => {
  it("changes its mark and opens its border together", async () => {
    const { container, rerender } = render(Node, {
      name: "sabnzbd",
      state: "known",
      figure: "0 B/s",
    });
    expect(container.querySelector(".node.quiet")).toBeNull();

    await rerender({ state: "quiet" });

    expect(container.querySelector(".node.quiet")).not.toBeNull();
    expect(
      screen.getByRole("img", { name: wordFor("quiet") }),
    ).toBeInTheDocument();
    expect(screen.getByText("0 B/s")).toBeInTheDocument();
  });
});
