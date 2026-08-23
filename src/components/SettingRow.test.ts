import { render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import SettingRow from "./SettingRow.svelte";

const control = createRawSnippet(() => ({
  render: () => `<button type="button">Change</button>`,
}));

const boot = {
  title: "Start when this machine starts",
  prose: "Your stack comes back on its own after a power cut or a reboot.",
  control,
};

describe("SettingRow", () => {
  it("names the setting in a heading under the subview's own", () => {
    render(SettingRow, boot);
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent(
      boot.title,
    );
  });

  it("says what the setting does, not only what it is called", () => {
    render(SettingRow, boot);
    expect(screen.getByText(boot.prose)).toBeInTheDocument();
  });

  it("offers the control it was handed", () => {
    render(SettingRow, boot);
    expect(screen.getByRole("button", { name: "Change" })).toBeInTheDocument();
  });

  // The right-hand side is a switch, a button, a tag or a field, and the row
  // renders whichever it was given rather than choosing between them.
  it("holds a control of a different kind just as well", () => {
    const stated = createRawSnippet(() => ({
      render: () => `<span>Always on</span>`,
    }));
    render(SettingRow, { ...boot, control: stated });

    expect(screen.getByText("Always on")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("when a setting is rewritten while it is on screen", () => {
  it("changes its name and its words together", async () => {
    const { rerender } = render(SettingRow, boot);
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent(
      boot.title,
    );

    await rerender({
      title: "Slow downloads at night",
      prose: "Keeps the line clear between 6pm and 11pm.",
    });

    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent(
      "Slow downloads at night",
    );
    expect(
      screen.getByText("Keeps the line clear between 6pm and 11pm."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change" })).toBeInTheDocument();
  });
});
