import { render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import PersonRow from "./PersonRow.svelte";

const actions = createRawSnippet(() => ({
  render: () => `<button type="button">Edit</button>`,
}));

const nora = {
  name: "Nora",
  prose: "Can ask for things",
  quota: "3 of 5 used",
  part: 0.6,
} as const;

const owner = {
  name: "Wessel",
  prose: "Can change anything",
  quota: "No limit",
} as const;

describe("PersonRow", () => {
  it("heads the row with who they are", () => {
    render(PersonRow, nora);
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent(
      nora.name,
    );
  });

  it("says what they can do", () => {
    render(PersonRow, nora);
    expect(screen.getByText(nora.prose)).toBeInTheDocument();
  });

  it("draws their initial beside the name", () => {
    const { container } = render(PersonRow, nora);
    expect(container.querySelector(".avatar")).toHaveTextContent("N");
  });

  it("sets a word beside the name where there is one", () => {
    render(PersonRow, { ...owner, tag: "you" });
    expect(screen.getByText("you")).toBeInTheDocument();
  });

  it("leaves the name on its own where there is none", () => {
    const { container } = render(PersonRow, owner);
    expect(container.querySelector(".tag")).toBeNull();
  });

  it("offers what can be done about them", () => {
    render(PersonRow, { ...nora, actions });
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("offers nothing where there is nothing to press", () => {
    const { container } = render(PersonRow, nora);
    expect(container.querySelector(".pacts")).toBeNull();
  });
});

describe("how much of an allowance is gone", () => {
  it("draws a bar where there is a limit to draw one against", () => {
    render(PersonRow, nora);
    const bar = screen.getByRole("progressbar", { name: nora.quota });
    expect(bar).toHaveAttribute("aria-valuenow", "60");
  });

  // The bar carries the words as its own name, so they are said once.
  it("keeps the words out of the reading once a bar carries them", () => {
    render(PersonRow, nora);
    expect(screen.getByText(nora.quota)).toHaveAttribute("aria-hidden", "true");
  });

  it("says an allowance with no length in words alone", () => {
    render(PersonRow, owner);

    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.getByText(owner.quota)).not.toHaveAttribute("aria-hidden");
  });

  it("sets the words at the size an aside takes where no bar is drawn", () => {
    const { container } = render(PersonRow, owner);
    expect(container.querySelector(".lbl.plain")).not.toBeNull();
  });

  it("sets them as a bar's label where one is drawn", () => {
    const { container } = render(PersonRow, nora);
    expect(container.querySelector(".lbl.plain")).toBeNull();
  });
});

describe("when someone spends more of their allowance", () => {
  it("moves the bar and the words together", async () => {
    const { rerender } = render(PersonRow, nora);
    expect(
      screen.getByRole("progressbar", { name: "3 of 5 used" }),
    ).toHaveAttribute("aria-valuenow", "60");

    await rerender({ quota: "4 of 5 used", part: 0.8 });

    expect(
      screen.getByRole("progressbar", { name: "4 of 5 used" }),
    ).toHaveAttribute("aria-valuenow", "80");
    expect(screen.getByText("4 of 5 used")).toBeInTheDocument();
  });
});
