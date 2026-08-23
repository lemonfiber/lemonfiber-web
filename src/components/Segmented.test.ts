import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Segmented, { type Choice } from "./Segmented.svelte";

const density: readonly Choice[] = [
  { value: "comfortable", label: "Roomy" },
  { value: "compact", label: "Dense" },
];

const appearance: readonly Choice[] = [
  { value: "paper", label: "Paper" },
  { value: "auto", label: "Auto" },
  { value: "ink", label: "Ink" },
];

/** The group, its options, and what taking one asks for. */
function densityAt(selected: string, onselect: (value: string) => void) {
  return { label: "Density", options: density, selected, onselect };
}

describe("Segmented", () => {
  it("is announced as one group under one name", () => {
    render(Segmented, densityAt("comfortable", vi.fn()));
    expect(
      screen.getByRole("radiogroup", { name: "Density" }),
    ).toBeInTheDocument();
  });

  // Taking one gives up the others, which is what a radio says and what a row
  // of toggles does not.
  it("offers each option as one of a set, not as a switch of its own", () => {
    render(Segmented, densityAt("comfortable", vi.fn()));
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("says which option is taken", () => {
    render(Segmented, densityAt("comfortable", vi.fn()));
    expect(screen.getByRole("radio", { name: "Roomy" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Dense" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  // One stop for the whole group, not one per option.
  it("puts only the option that is taken on the way through the screen", async () => {
    render(Segmented, densityAt("compact", vi.fn()));

    await userEvent.tab();

    expect(screen.getByRole("radio", { name: "Dense" })).toHaveFocus();
  });

  it("asks for the option that was pressed", async () => {
    const asked = vi.fn();
    render(Segmented, densityAt("comfortable", asked));

    await userEvent.click(screen.getByRole("radio", { name: "Dense" }));

    expect(asked).toHaveBeenCalledWith("compact");
  });

  // It shows what it was told and asks for the rest; the screen that owns the
  // setting is the one that changes it.
  it("keeps the option it was told to show until it is told otherwise", async () => {
    render(Segmented, densityAt("comfortable", vi.fn()));

    await userEvent.click(screen.getByRole("radio", { name: "Dense" }));

    expect(screen.getByRole("radio", { name: "Roomy" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  // The group shows what it was told and asks for the rest, so one standing
  // on a screen with nothing behind it yet is still readable.
  it("takes no option when it was given nothing to ask", async () => {
    render(Segmented, {
      label: "Density",
      options: density,
      selected: "comfortable",
    });

    await userEvent.click(screen.getByRole("radio", { name: "Dense" }));

    expect(screen.getByRole("radio", { name: "Roomy" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("submits no form it happens to be standing in", () => {
    render(Segmented, densityAt("comfortable", vi.fn()));
    expect(screen.getByRole("radio", { name: "Roomy" })).toHaveAttribute(
      "type",
      "button",
    );
  });
});

describe("moving along the group by keyboard", () => {
  it.each([
    ["{ArrowRight}", "Dense", "compact"],
    ["{ArrowDown}", "Dense", "compact"],
    ["{ArrowLeft}", "Dense", "compact"],
    ["{ArrowUp}", "Dense", "compact"],
  ])("takes what %s reaches", async (key, reached, value) => {
    const asked = vi.fn();
    render(Segmented, densityAt("comfortable", asked));

    screen.getByRole("radio", { name: "Roomy" }).focus();
    await userEvent.keyboard(key);

    expect(asked).toHaveBeenCalledWith(value);
    expect(screen.getByRole("radio", { name: reached })).toHaveFocus();
  });

  it("moves nothing on a key that is not an arrow", async () => {
    const asked = vi.fn();
    render(Segmented, densityAt("comfortable", asked));

    const roomy = screen.getByRole("radio", { name: "Roomy" });
    roomy.focus();
    await userEvent.keyboard("{End}");

    expect(asked).not.toHaveBeenCalled();
    expect(roomy).toHaveFocus();
  });

  it("runs off the end back to the beginning", async () => {
    const asked = vi.fn();
    render(Segmented, {
      label: "Appearance",
      options: appearance,
      selected: "ink",
      onselect: asked,
    });

    screen.getByRole("radio", { name: "Ink" }).focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(asked).toHaveBeenCalledWith("paper");
    expect(screen.getByRole("radio", { name: "Paper" })).toHaveFocus();
  });

  it("runs off the beginning back to the end", async () => {
    const asked = vi.fn();
    render(Segmented, {
      label: "Appearance",
      options: appearance,
      selected: "paper",
      onselect: asked,
    });

    screen.getByRole("radio", { name: "Paper" }).focus();
    await userEvent.keyboard("{ArrowLeft}");

    expect(asked).toHaveBeenCalledWith("ink");
    expect(screen.getByRole("radio", { name: "Ink" })).toHaveFocus();
  });

  it("reaches the middle of three and stops there", async () => {
    const asked = vi.fn();
    render(Segmented, {
      label: "Appearance",
      options: appearance,
      selected: "paper",
      onselect: asked,
    });

    screen.getByRole("radio", { name: "Paper" }).focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(asked).toHaveBeenCalledWith("auto");
    expect(screen.getByRole("radio", { name: "Auto" })).toHaveFocus();
  });
});

describe("when the setting is changed somewhere else", () => {
  it("moves the mark and the tab stop together", async () => {
    const { rerender } = render(Segmented, densityAt("comfortable", vi.fn()));
    expect(screen.getByRole("radio", { name: "Roomy" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await rerender({ selected: "compact" });

    expect(screen.getByRole("radio", { name: "Dense" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Roomy" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(screen.getByRole("radio", { name: "Dense" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });

  it("draws the options it is given, in the order it is given them", async () => {
    const { rerender } = render(Segmented, densityAt("comfortable", vi.fn()));
    expect(screen.getAllByRole("radio")).toHaveLength(2);

    await rerender({
      label: "Appearance",
      options: appearance,
      selected: "auto",
    });

    expect(screen.getAllByRole("radio").map((one) => one.textContent)).toEqual([
      "Paper",
      "Auto",
      "Ink",
    ]);
  });
});
