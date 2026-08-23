import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SubNav from "./SubNav.svelte";

const settings = [
  { id: "stack", label: "Your stack" },
  { id: "tunnel", label: "Tunnel & downloading" },
  { id: "updates", label: "Updates" },
  { id: "backups", label: "Backups" },
];

const strip = {
  label: "Settings",
  items: settings,
  selected: "stack",
  onselect: () => undefined,
};

describe("SubNav", () => {
  it("is a landmark saying what it navigates", () => {
    render(SubNav, strip);
    expect(
      screen.getByRole("navigation", { name: "Settings" }),
    ).toBeInTheDocument();
  });

  it("offers one control per place", () => {
    render(SubNav, strip);
    expect(screen.getAllByRole("button").length).toBe(settings.length);
  });

  it("reads as a list, so a reader is told how many places there are", () => {
    render(SubNav, strip);
    expect(screen.getAllByRole("listitem").length).toBe(settings.length);
  });

  it("names every place in its own words", () => {
    render(SubNav, strip);
    for (const place of settings) {
      expect(screen.getByRole("button", { name: place.label })).toBeVisible();
    }
  });
});

describe("the place being shown", () => {
  it("is the only one marked current", () => {
    render(SubNav, strip);
    expect(screen.getByRole("button", { name: "Your stack" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: "Updates" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("stays reachable by tab, as every other place does", () => {
    render(SubNav, strip);
    for (const place of settings) {
      expect(
        screen.getByRole("button", { name: place.label }),
      ).not.toHaveAttribute("tabindex");
    }
  });
});

describe("pressing a place", () => {
  it("hands back the id of the one pressed", async () => {
    const onselect = vi.fn();
    render(SubNav, { ...strip, onselect });

    await userEvent.click(screen.getByRole("button", { name: "Backups" }));

    expect(onselect).toHaveBeenCalledWith("backups");
  });

  it("hands back the current one too, rather than swallowing the press", async () => {
    const onselect = vi.fn();
    render(SubNav, { ...strip, onselect });

    await userEvent.click(screen.getByRole("button", { name: "Your stack" }));

    expect(onselect).toHaveBeenCalledWith("stack");
  });

  it("is reached by the keyboard the way any button is", async () => {
    const onselect = vi.fn();
    render(SubNav, { ...strip, onselect });

    screen.getByRole("button", { name: "Updates" }).focus();
    await userEvent.keyboard("{Enter}");

    expect(onselect).toHaveBeenCalledWith("updates");
  });
});

describe("when the place being shown changes under the strip", () => {
  it("moves the mark to the new one and takes it off the old", async () => {
    const { rerender } = render(SubNav, strip);
    expect(screen.getByRole("button", { name: "Your stack" })).toHaveAttribute(
      "aria-current",
      "true",
    );

    await rerender({ selected: "tunnel" });

    expect(
      screen.getByRole("button", { name: "Tunnel & downloading" }),
    ).toHaveAttribute("aria-current", "true");
    expect(
      screen.getByRole("button", { name: "Your stack" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("follows a strip given other places to lead to", async () => {
    const { rerender } = render(SubNav, strip);

    await rerender({
      items: [
        { id: "house", label: "Who's in the house" },
        { id: "invites", label: "Invitations" },
      ],
      selected: "invites",
    });

    expect(screen.getAllByRole("button").length).toBe(2);
    expect(screen.getByRole("button", { name: "Invitations" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });
});
