import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import StateTag from "./StateTag.svelte";
import StateMark from "./StateMark.svelte";
import { wordFor, type State } from "../lib/state";

const every: State[] = ["known", "quiet", "unknown", "stopped", "part"];

describe("StateTag", () => {
  it.each(every)("shows the plain word for %s", (state) => {
    render(StateTag, { state });
    expect(screen.getByText(wordFor(state))).toBeInTheDocument();
  });

  it("takes a label when the tag names a thing rather than a state", () => {
    render(StateTag, { state: "known", label: "gluetun" });
    expect(screen.getByText("gluetun")).toBeInTheDocument();
  });

  it.each(every)("records the state it is showing for %s", (state) => {
    const { container } = render(StateTag, { state });
    expect(container.querySelector(`[data-state="${state}"]`)).not.toBeNull();
  });
});

describe("StateMark", () => {
  it.each(every)("announces %s to a screen reader", (state) => {
    render(StateMark, { state });
    expect(
      screen.getByRole("img", { name: wordFor(state) }),
    ).toBeInTheDocument();
  });

  it("announces the label it was given instead", () => {
    render(StateMark, { state: "known", label: "gluetun is working" });
    expect(
      screen.getByRole("img", { name: "gluetun is working" }),
    ).toBeInTheDocument();
  });
});

describe("when a state changes on a tag already on screen", () => {
  // Every other test mounts afresh, which never exercises the update path —
  // and updating in place is the whole point of a live surface.
  it("shows the new word without being remounted", async () => {
    const { rerender } = render(StateTag, { state: "known" });
    expect(screen.getByText(wordFor("known"))).toBeInTheDocument();

    await rerender({ state: "quiet" });

    expect(screen.getByText(wordFor("quiet"))).toBeInTheDocument();
    expect(screen.queryByText(wordFor("known"))).toBeNull();
  });

  it("changes its mark with it", async () => {
    const { container, rerender } = render(StateTag, { state: "known" });
    expect(container.querySelector('[data-state="known"]')).not.toBeNull();

    await rerender({ state: "stopped" });

    expect(container.querySelector('[data-state="stopped"]')).not.toBeNull();
    expect(container.querySelector('[data-state="known"]')).toBeNull();
  });
});
