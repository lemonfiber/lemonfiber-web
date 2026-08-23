import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import WizardStep from "./WizardStep.svelte";
import { everyStanding } from "../lib/steps";
import * as m from "../paraglide/messages.js";

const downloading = {
  position: 3,
  total: 7,
  title: "Downloading",
  detail: "torrents and usenet",
  standing: "now",
} as const;

describe("WizardStep", () => {
  it("names the step", () => {
    render(WizardStep, downloading);
    expect(screen.getByText(downloading.title)).toBeInTheDocument();
  });

  it("says what the step settles", () => {
    render(WizardStep, downloading);
    expect(screen.getByText(downloading.detail)).toBeInTheDocument();
  });

  it("draws the number of the step being done", () => {
    render(WizardStep, downloading);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("draws the number of a step still to come", () => {
    render(WizardStep, { ...downloading, position: 5, standing: "later" });
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("draws a tick in place of the number once a step is behind you", () => {
    render(WizardStep, { ...downloading, standing: "done" });
    expect(screen.queryByText("3")).toBeNull();
    expect(
      screen.getByRole("img", { name: m.step_done() }),
    ).toBeInTheDocument();
  });
});

describe("what a step tells a screen reader", () => {
  it("says where in the run it sits, and how long the run is", () => {
    render(WizardStep, downloading);
    expect(
      screen.getByText(m.step_of({ position: 3, total: 7 })),
    ).toBeInTheDocument();
  });

  // "Step 4 of 7" already carries the number the box draws.
  it("keeps the drawn numeral out of the reading", () => {
    render(WizardStep, { ...downloading, position: 4, standing: "later" });
    expect(screen.getByText("4")).toHaveAttribute("aria-hidden", "true");
  });

  it.each(everyStanding)("marks a %s step as current or not", (standing) => {
    const { container } = render(WizardStep, { ...downloading, standing });
    expect(
      container.querySelector(".vstep")?.getAttribute("aria-current"),
    ).toBe(standing === "now" ? "step" : null);
  });

  it.each(everyStanding)("gives a %s step its own standing", (standing) => {
    const { container } = render(WizardStep, { ...downloading, standing });
    const step = container.querySelector(".vstep");

    expect(step?.classList.contains("done")).toBe(standing === "done");
    expect(step?.classList.contains("now")).toBe(standing === "now");
  });
});

describe("when a step is finished while the rail is on screen", () => {
  it("swaps its numeral for a tick and gives up being current", async () => {
    const { container, rerender } = render(WizardStep, downloading);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(container.querySelector(".vstep")).toHaveAttribute(
      "aria-current",
      "step",
    );

    await rerender({ standing: "done" });

    expect(screen.queryByText("3")).toBeNull();
    expect(
      screen.getByRole("img", { name: m.step_done() }),
    ).toBeInTheDocument();
    expect(container.querySelector(".vstep")).not.toHaveAttribute(
      "aria-current",
    );
  });
});
