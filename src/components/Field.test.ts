import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Field from "./Field.svelte";

const provider = {
  label: "Your provider",
  value: "news.eweka.nl",
} as const;

const reached = "Reached it, and your details work";
const explains = "Your provider allows 20. Asking for more gets refused.";

describe("Field", () => {
  it("names the box by the label above it", () => {
    render(Field, provider);
    expect(screen.getByLabelText(provider.label)).toBeInTheDocument();
  });

  it("shows the value it was told to show", () => {
    render(Field, provider);
    expect(screen.getByLabelText(provider.label)).toHaveValue(provider.value);
  });

  it("is reached and filled in by the keyboard alone", async () => {
    render(Field, provider);
    await userEvent.tab();
    expect(screen.getByLabelText(provider.label)).toHaveFocus();
  });
});

describe("the line under the box", () => {
  it("has the hint read out with the box, not left beside it", () => {
    render(Field, { ...provider, hint: explains });
    expect(screen.getByLabelText(provider.label)).toHaveAccessibleDescription(
      explains,
    );
  });

  it("has the confirmation read out with the box too", () => {
    render(Field, { ...provider, confirmed: reached });
    expect(screen.getByLabelText(provider.label)).toHaveAccessibleDescription(
      reached,
    );
  });

  // Giving a confirmation is what makes the field checked.
  it("puts the confirmation in place of the hint", () => {
    render(Field, { ...provider, hint: explains, confirmed: reached });

    expect(screen.getByText(reached)).toBeInTheDocument();
    expect(screen.queryByText(explains)).toBeNull();
  });

  it("says nothing under a box that has neither", () => {
    render(Field, provider);
    expect(screen.getByLabelText(provider.label)).not.toHaveAttribute(
      "aria-describedby",
    );
  });
});

describe("a box holding a figure", () => {
  it("is set in the plain face unless it is told otherwise", () => {
    render(Field, provider);
    expect(screen.getByLabelText(provider.label)).not.toHaveClass("figure");
  });

  it("is set in the figure face, at the width a figure needs", () => {
    render(Field, { label: "Port to listen on", value: "51413", figure: true });
    expect(screen.getByLabelText("Port to listen on")).toHaveClass("figure");
  });
});

describe("what typing in a box asks for", () => {
  it("hands over what the box now holds", async () => {
    const typed = vi.fn();
    render(Field, { label: "Port to listen on", value: "", oninput: typed });

    await userEvent.type(screen.getByLabelText("Port to listen on"), "51");

    expect(typed).toHaveBeenLastCalledWith("51");
  });

  it("takes what is typed into a box nobody is listening to", async () => {
    render(Field, { label: "Port to listen on", value: "" });

    await userEvent.type(screen.getByLabelText("Port to listen on"), "5");

    expect(screen.getByLabelText("Port to listen on")).toHaveValue("5");
  });
});

describe("when a value is settled somewhere else", () => {
  it("shows the value it is given, and the confirmation that came with it", async () => {
    const { rerender } = render(Field, { ...provider, hint: explains });
    expect(screen.getByText(explains)).toBeInTheDocument();

    await rerender({ value: "news.easynews.com", confirmed: reached });

    expect(screen.getByLabelText(provider.label)).toHaveValue(
      "news.easynews.com",
    );
    expect(screen.getByText(reached)).toBeInTheDocument();
  });
});
