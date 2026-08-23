import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Value from "./Value.svelte";
import { everyState, showingFor } from "../lib/state";
import * as m from "../paraglide/messages.js";

describe("Value", () => {
  it("shows a measured figure as it reads", () => {
    render(Value, { state: "known", figure: "4.1 MB/s" });
    expect(screen.getByText("4.1 MB/s")).toBeInTheDocument();
  });

  it("shows an unfinished figure as it reads, because it is measured now", () => {
    render(Value, { state: "part", figure: "9/11" });
    expect(screen.getByText("9/11")).toBeInTheDocument();
  });

  it("keeps the figure a quiet source last gave", () => {
    render(Value, { state: "quiet", figure: "0 B/s" });
    expect(screen.getByText("0 B/s")).toBeInTheDocument();
  });

  it("marks that figure as the last one, not the current one", () => {
    render(Value, { state: "quiet", figure: "0 B/s" });
    expect(screen.getByText(m.value_last_known())).toBeInTheDocument();
  });

  it("does not mark a measured figure as the last one", () => {
    render(Value, { state: "known", figure: "4.1 MB/s" });
    expect(screen.queryByText(m.value_last_known())).toBeNull();
  });
});

describe("where the caller has already said the figure is the last one", () => {
  it("keeps the figure and drops the caption", () => {
    render(Value, { state: "quiet", figure: "0 B/s", unmarked: true });
    expect(screen.getByText("0 B/s")).toBeInTheDocument();
    expect(screen.queryByText(m.value_last_known())).toBeNull();
  });
});

describe("when nothing was ever measured", () => {
  it("says so in words", () => {
    render(Value, { state: "unknown" });
    expect(screen.getByText(m.value_not_known())).toBeInTheDocument();
  });

  it("takes the words the screen wants instead", () => {
    render(Value, { state: "unknown", absent: m.value_cannot_say() });
    expect(screen.getByText(m.value_cannot_say())).toBeInTheDocument();
  });

  // "0 B/s" and "not known" mean opposite things. A figure handed to a state
  // that never measured one is a figure that must not reach the screen.
  it("refuses a figure it was handed anyway", () => {
    render(Value, { state: "unknown", figure: "0 B/s" });
    expect(screen.queryByText("0 B/s")).toBeNull();
    expect(screen.getByText(m.value_not_known())).toBeInTheDocument();
  });

  it("says the same for a source that is not running", () => {
    render(Value, { state: "stopped", figure: "0 B/s" });
    expect(screen.queryByText("0 B/s")).toBeNull();
    expect(screen.getByText(m.value_not_known())).toBeInTheDocument();
  });

  it("falls back to words when a measured state was given no figure", () => {
    render(Value, { state: "known" });
    expect(screen.getByText(m.value_not_known())).toBeInTheDocument();
  });
});

describe("how a figure is set", () => {
  it("sets words in italic and never in the figure face", () => {
    const { container } = render(Value, { state: "unknown" });
    expect(container.querySelector("em")).not.toBeNull();
    expect(container.querySelector(".figure")).toBeNull();
  });

  it.each(everyState.filter((s) => showingFor(s) !== "words"))(
    "sets a measured %s figure in the figure face",
    (state) => {
      const { container } = render(Value, { state, figure: "412 GB" });
      expect(container.querySelector(".figure")).not.toBeNull();
      expect(container.querySelector("em")).toBeNull();
    },
  );
});

describe("when a source falls quiet under a figure already on screen", () => {
  it("dims the figure and marks it, without being remounted", async () => {
    const { rerender } = render(Value, { state: "known", figure: "4.1 MB/s" });
    expect(screen.queryByText(m.value_last_known())).toBeNull();

    await rerender({ state: "quiet" });

    expect(screen.getByText("4.1 MB/s")).toBeInTheDocument();
    expect(screen.getByText(m.value_last_known())).toBeInTheDocument();
  });
});
