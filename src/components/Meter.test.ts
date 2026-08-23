import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Meter from "./Meter.svelte";
import { everyState, showingFor } from "../lib/state";

const label = "How far along";

describe("Meter", () => {
  it("is named by what it is measuring", () => {
    render(Meter, { part: 0.64, label });
    expect(
      screen.getByRole("progressbar", { name: label }),
    ).toBeInTheDocument();
  });

  it("reports how far along it is, on a scale a reader is given", () => {
    render(Meter, { part: 0.64, label });
    const bar = screen.getByRole("progressbar", { name: label });

    expect(bar).toHaveAttribute("aria-valuenow", "64");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("draws the same share it reports", () => {
    const { container } = render(Meter, { part: 0.64, label });
    expect(container.querySelector<HTMLElement>(".fill")?.style.width).toBe(
      "64%",
    );
  });
});

describe("a share outside its own bounds", () => {
  it("never draws a bar past its track", () => {
    const { container } = render(Meter, { part: 1.4, label });

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    expect(container.querySelector<HTMLElement>(".fill")?.style.width).toBe(
      "100%",
    );
  });

  it("never reports less than none of something", () => {
    const { container } = render(Meter, { part: -0.3, label });

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    expect(container.querySelector<HTMLElement>(".fill")?.style.width).toBe(
      "0%",
    );
  });
});

describe("how much the figure behind a bar can be trusted", () => {
  it("is measured now unless it is told otherwise", () => {
    const { container } = render(Meter, { part: 0.5, label });
    expect(container.querySelector(".fill.dim")).toBeNull();
  });

  it.each(everyState)(
    "dims the bar for %s where the figure is not",
    (state) => {
      const { container } = render(Meter, { part: 0.5, label, state });
      expect(container.querySelector(".fill")?.classList.contains("dim")).toBe(
        showingFor(state) !== "ink",
      );
    },
  );
});

describe("when a bar moves while it is on screen", () => {
  it("redraws and re-reports together", async () => {
    const { container, rerender } = render(Meter, { part: 0.2, label });
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "20",
    );

    await rerender({ part: 0.75 });

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "75",
    );
    expect(container.querySelector<HTMLElement>(".fill")?.style.width).toBe(
      "75%",
    );
  });
});
