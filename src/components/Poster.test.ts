import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Poster from "./Poster.svelte";
import { wordFor } from "../lib/state";

const dune = { title: "Dune: Part Two" } as const;

// A picture of the title, small enough to sit in this file: the component's
// job is what it does with one, not what is in it.
const artwork =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAEElEQVR42mN4UCUORAwoFABfmginlyLNOQAAAABJRU5ErkJggg==";

describe("Poster", () => {
  it("names the thing in text under the frame", () => {
    const { container } = render(Poster, dune);
    expect(container.querySelector(".t")).toHaveTextContent(dune.title);
  });

  it("stands the title in for artwork it has not got", () => {
    const { container } = render(Poster, dune);
    expect(container.querySelector(".blank")).toHaveTextContent(dune.title);
    expect(container.querySelector("img")).toBeNull();
  });

  it("shows the artwork where there is some", () => {
    const { container } = render(Poster, { ...dune, artwork });
    expect(container.querySelector("img")).toHaveAttribute("src", artwork);
    expect(container.querySelector(".blank")).toBeNull();
  });

  // The name is text under the frame, and a screen reader reading the frame
  // as well would be given the same words twice.
  it("keeps the stand-in out of the reading", () => {
    const { container } = render(Poster, dune);
    expect(container.querySelector(".art")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("leaves the artwork unnamed, since the text below names it", () => {
    const { container } = render(Poster, { ...dune, artwork });
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });
});

describe("what a poster says underneath", () => {
  it("tags the thing with the words the screen gave it", () => {
    render(Poster, { ...dune, state: "known", label: "Ready to watch" });
    expect(screen.getByText("Ready to watch")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Ready to watch" }),
    ).toBeInTheDocument();
  });

  it("falls back to the state's own word", () => {
    render(Poster, { ...dune, state: "part" });
    expect(screen.getByText(wordFor("part"))).toBeInTheDocument();
  });

  it("carries no tag where no state was given", () => {
    const { container } = render(Poster, dune);
    expect(container.querySelector(".tag")).toBeNull();
  });

  it("takes a caption in place of a tag", () => {
    render(Poster, {
      title: "Ask for something",
      note: "Search for anything",
    });
    expect(screen.getByText("Search for anything")).toBeInTheDocument();
  });

  it("carries no caption where none was given", () => {
    const { container } = render(Poster, dune);
    expect(container.querySelector(".sub")).toBeNull();
  });
});

describe("the frame around a thing that is not one yet", () => {
  it("draws it open", () => {
    const { container } = render(Poster, {
      title: "Ask for something",
      outline: true,
    });
    expect(container.querySelector(".art.outline")).not.toBeNull();
  });

  it("closes the frame of a thing that exists", () => {
    const { container } = render(Poster, dune);
    expect(container.querySelector(".art.outline")).toBeNull();
  });
});

describe("when artwork arrives for a poster already on screen", () => {
  it("drops the lettering standing in for it", async () => {
    const { container, rerender } = render(Poster, dune);
    expect(container.querySelector(".blank")).toHaveTextContent(dune.title);

    await rerender({ ...dune, artwork });

    expect(container.querySelector(".blank")).toBeNull();
    expect(container.querySelector("img")).toHaveAttribute("src", artwork);
    expect(container.querySelector(".t")).toHaveTextContent(dune.title);
  });
});
