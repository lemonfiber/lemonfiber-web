import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import BigFigure from "./BigFigure.svelte";
import * as m from "../paraglide/messages.js";

const disk = { state: "known", figure: "412 GB" } as const;

describe("BigFigure", () => {
  it("sets the figure it was given", () => {
    render(BigFigure, disk);
    expect(screen.getByText("412 GB")).toBeInTheDocument();
  });

  it("says what the figure is measured against, beside it", () => {
    render(BigFigure, { ...disk, beside: "free of 4 TB" });
    expect(screen.getByText("free of 4 TB")).toBeInTheDocument();
  });

  it("says what the figure is, above it", () => {
    render(BigFigure, { ...disk, eyebrow: "Free space" });
    expect(screen.getByText("Free space")).toBeInTheDocument();
  });

  it("says what the figure means, under it", () => {
    render(BigFigure, { ...disk, caption: "tried twice, then gave up" });
    expect(screen.getByText("tried twice, then gave up")).toBeInTheDocument();
  });

  it("shows only the figure when it was given nothing else", () => {
    const { container } = render(BigFigure, disk);
    expect(container.querySelector(".eyebrow")).toBeNull();
    expect(container.querySelector(".beside")).toBeNull();
    expect(container.querySelector(".caption")).toBeNull();
  });
});

describe("what rides inside the figure", () => {
  it("sets the unit apart from the number", () => {
    const { container } = render(BigFigure, {
      state: "known",
      figure: "4.1",
      unit: "MB/s",
    });
    expect(screen.getByText("4.1")).toBeInTheDocument();
    expect(container.querySelector(".unit")).toHaveTextContent("MB/s");
  });

  it("sets the whole apart from the part", () => {
    const { container } = render(BigFigure, {
      state: "part",
      figure: "9",
      outOf: "/11",
    });
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(container.querySelector(".of")).toHaveTextContent("/11");
  });

  it("keeps the figure bare when it was given neither", () => {
    const { container } = render(BigFigure, disk);
    expect(container.querySelector(".unit")).toBeNull();
    expect(container.querySelector(".of")).toBeNull();
  });

  // A unit set after "not known" reads as a measurement of it.
  it("drops the unit where the figure is words", () => {
    const { container } = render(BigFigure, {
      state: "unknown",
      figure: "4.1",
      unit: "MB/s",
      outOf: "/11",
    });
    expect(screen.getByText(m.value_not_known())).toBeInTheDocument();
    expect(container.querySelector(".unit")).toBeNull();
    expect(container.querySelector(".of")).toBeNull();
  });

  it("drops the unit where there is no figure at all", () => {
    const { container } = render(BigFigure, {
      state: "known",
      unit: "MB/s",
      outOf: "/11",
    });
    expect(container.querySelector(".unit")).toBeNull();
    expect(container.querySelector(".of")).toBeNull();
  });

  // A figure a quiet source last gave is still a figure, so its unit stands.
  it("keeps the unit on the last figure a quiet source gave", () => {
    const { container } = render(BigFigure, {
      state: "quiet",
      figure: "4.1",
      unit: "MB/s",
    });
    expect(screen.getByText("4.1")).toBeInTheDocument();
    expect(container.querySelector(".unit")).toHaveTextContent("MB/s");
  });
});

describe("how much a figure is trusted", () => {
  it("leaves the words to Value where nothing was measured", () => {
    const { container } = render(BigFigure, { state: "unknown" });
    expect(screen.getByText(m.value_not_known())).toBeInTheDocument();
    expect(container.querySelector("em")).not.toBeNull();
  });

  it("takes the words the screen wants for the gap", () => {
    render(BigFigure, { state: "stopped", absent: m.value_not_running() });
    expect(screen.getByText(m.value_not_running())).toBeInTheDocument();
  });

  it("marks the figure a quiet source last gave", () => {
    render(BigFigure, { state: "quiet", figure: "0 B/s" });
    expect(screen.getByText(m.value_last_known())).toBeInTheDocument();
  });
});

describe("a figure that wants the operator", () => {
  it("sets it in the ink of the thing that is wrong", () => {
    const { container } = render(BigFigure, {
      state: "known",
      figure: "1",
      alarm: true,
    });
    expect(container.querySelector(".fig.alarm")).not.toBeNull();
  });

  it("leaves every other figure in the ink of the page", () => {
    const { container } = render(BigFigure, disk);
    expect(container.querySelector(".fig.alarm")).toBeNull();
  });
});

describe("when a source falls silent under a figure already on screen", () => {
  it("drops to words and takes the unit with it", async () => {
    const { container, rerender } = render(BigFigure, {
      state: "known",
      figure: "4.1",
      unit: "MB/s",
      eyebrow: "Coming in now",
    });
    expect(container.querySelector(".unit")).toHaveTextContent("MB/s");

    await rerender({ state: "stopped" });

    expect(screen.getByText(m.value_not_known())).toBeInTheDocument();
    expect(container.querySelector(".unit")).toBeNull();
    expect(screen.getByText("Coming in now")).toBeInTheDocument();
  });
});
