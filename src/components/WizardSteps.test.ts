import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import WizardSteps from "./WizardSteps.svelte";
import * as m from "../paraglide/messages.js";

const steps = [
  { title: "Folders", detail: "one disk" },
  { title: "The tunnel", detail: "Mullvad, Netherlands" },
  { title: "Downloading", detail: "torrents and usenet" },
  { title: "Finding things", detail: "where to search" },
];

describe("WizardSteps", () => {
  it("draws every step it was given", () => {
    render(WizardSteps, { steps, current: 3 });
    for (const step of steps) {
      expect(screen.getByText(step.title)).toBeInTheDocument();
      expect(screen.getByText(step.detail)).toBeInTheDocument();
    }
  });

  it("numbers the steps by where they sit in the run", () => {
    render(WizardSteps, { steps, current: 1 });
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("tells every step how long the run it is part of is", () => {
    render(WizardSteps, { steps, current: 1 });
    expect(
      screen.getByText(m.step_of({ position: 4, total: 4 })),
    ).toBeInTheDocument();
  });

  // The run decides which step is current, so no two of them can claim it.
  it("gives the run exactly one current step", () => {
    const { container } = render(WizardSteps, { steps, current: 3 });
    expect(container.querySelectorAll("[aria-current='step']")).toHaveLength(1);
  });

  it("settles the steps behind the current one and leaves the rest open", () => {
    const { container } = render(WizardSteps, { steps, current: 3 });
    const drawn = [...container.querySelectorAll(".vstep")];

    expect(drawn.map((step) => step.classList.contains("done"))).toStrictEqual([
      true,
      true,
      false,
      false,
    ]);
    expect(drawn.map((step) => step.classList.contains("now"))).toStrictEqual([
      false,
      false,
      true,
      false,
    ]);
  });

  // A step draws the line down to the next one and the last step draws none,
  // which only holds while the steps are each other's siblings.
  it("keeps the steps side by side, with nothing between them", () => {
    const { container } = render(WizardSteps, { steps, current: 3 });
    expect(container.querySelectorAll(".vsteps > .vstep")).toHaveLength(4);
  });
});

describe("when the setup moves on a step", () => {
  it("settles the step just left and rings the one now being done", async () => {
    const { container, rerender } = render(WizardSteps, { steps, current: 3 });
    const before = [...container.querySelectorAll(".vstep")];
    expect(before[2]?.classList.contains("now")).toBe(true);

    await rerender({ current: 4 });

    const after = [...container.querySelectorAll(".vstep")];
    expect(after[2]?.classList.contains("done")).toBe(true);
    expect(after[3]?.classList.contains("now")).toBe(true);
  });
});
