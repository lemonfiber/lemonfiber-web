import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Note from "./Note.svelte";

const why =
  "A limit stops one person filling the disk on their own. It resets on the first of the month.";

describe("Note", () => {
  it("says what the section under it is for", () => {
    render(Note, { prose: why });
    expect(screen.getByText(why)).toBeInTheDocument();
  });

  // A paragraph, so it is one stop for a screen reader walking the page by
  // paragraph rather than a run of loose text under the heading.
  it("says it as a paragraph", () => {
    render(Note, { prose: why });
    expect(screen.getByText(why).tagName).toBe("P");
  });
});

describe("when a section is rewritten while it is on screen", () => {
  it("says the new thing and stops saying the old one", async () => {
    const { rerender } = render(Note, { prose: why });
    expect(screen.getByText(why)).toBeInTheDocument();

    const instead =
      "An invitation is a one-time link. It expires after a week if nobody uses it.";
    await rerender({ prose: instead });

    expect(screen.getByText(instead)).toBeInTheDocument();
    expect(screen.queryByText(why)).toBeNull();
  });
});
