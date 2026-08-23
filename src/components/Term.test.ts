import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Term from "./Term.svelte";

const word = {
  term: "linking",
  name: "Hardlink",
  meaning: "One file in two places, taking the room of one.",
};

describe("Term", () => {
  it("reads as the word the sentence uses", () => {
    render(Term, word);
    expect(screen.getByRole("button", { name: word.term })).toBeInTheDocument();
  });

  it("says nothing until it is asked", () => {
    render(Term, word);
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: word.term })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("explains itself when pressed", async () => {
    render(Term, word);

    await userEvent.click(screen.getByRole("button", { name: word.term }));

    const note = screen.getByRole("note");
    expect(note).toHaveTextContent(word.name);
    expect(note).toHaveTextContent(word.meaning);
  });

  it("names its explanation as its own description", async () => {
    render(Term, word);
    const button = screen.getByRole("button", { name: word.term });

    await userEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button.getAttribute("aria-describedby")).toBe(
      screen.getByRole("note").id,
    );
  });

  it("closes again when pressed a second time", async () => {
    render(Term, word);
    const button = screen.getByRole("button", { name: word.term });

    await userEvent.click(button);
    await userEvent.click(button);

    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    expect(button).not.toHaveAttribute("aria-describedby");
  });

  it("closes on escape, and leaves focus where it was", async () => {
    render(Term, word);
    const button = screen.getByRole("button", { name: word.term });

    await userEvent.click(button);
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it("stays open for a key that is not escape", async () => {
    render(Term, word);
    const button = screen.getByRole("button", { name: word.term });

    await userEvent.click(button);
    await userEvent.keyboard("x");

    expect(screen.getByRole("note")).toBeInTheDocument();
  });

  it("is reached and opened by the keyboard alone", async () => {
    render(Term, word);

    await userEvent.tab();
    expect(screen.getByRole("button", { name: word.term })).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("note")).toBeInTheDocument();
  });

  it("stops asking to be pressed once it has been read", () => {
    const { container } = render(Term, { ...word, read: true });
    expect(container.querySelector("button")).toHaveClass("read");
  });

  it("asks to be pressed until then", () => {
    const { container } = render(Term, word);
    expect(container.querySelector("button")).not.toHaveClass("read");
  });
});
