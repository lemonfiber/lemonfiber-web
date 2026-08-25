import { unreachable, type Reading } from "@lemonfiber/sdk-ts";
import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Term from "./Term.svelte";
import type { Explaining } from "../api/explaining";
import type { Word } from "../lib/wire";
import { explained } from "../routes/fixture";
import * as m from "../paraglide/messages.js";

/** The word as the sentence around it reads, which is not the word it files. */
const anchor = "linking";

/** An asking that answers every word the same way. */
const answering = (answer: Reading<Word>): Explaining =>
  vi.fn(() => Promise.resolve(answer));

/** An asking that has not answered yet, and the hand that lets it. */
const pending = (): { explain: Explaining; answer: () => void } => {
  let release!: () => void;
  const held = new Promise<Reading<Word>>((resolve) => {
    release = () => {
      resolve({ ok: true, value: explained });
    };
  });
  return { explain: () => held, answer: release };
};

/** The word, wired to one asking. */
const given = (explain: Explaining, read = false) => ({
  term: anchor,
  word: explained.word,
  explain,
  read,
});

/** One word, with an answer behind it. */
const known = (): Explaining => answering({ ok: true, value: explained });

/** One word, with nothing behind it. */
const silent = (): Explaining =>
  answering({ ok: false, problem: unreachable() });

const pressing = () => screen.getByRole("button", { name: anchor });

describe("Term", () => {
  it("reads as the word the sentence uses", () => {
    render(Term, given(known()));
    expect(pressing()).toBeInTheDocument();
  });

  it("says nothing, and asks nothing, until it is asked", () => {
    const explain = known();
    render(Term, given(explain));

    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    expect(pressing()).toHaveAttribute("aria-expanded", "false");
    expect(explain).not.toHaveBeenCalled();
  });

  it("explains itself in the words the answer carried", async () => {
    render(Term, given(known()));

    await userEvent.click(pressing());

    const note = await screen.findByRole("note");
    expect(note).toHaveTextContent(explained.word);
    expect(note).toHaveTextContent(explained.short);
  });

  // The sentence says "linking" and the table files "hardlink". What is asked
  // about is the table's word, or there is nothing to find.
  it("asks about the word the table files, not the word the sentence uses", async () => {
    const explain = known();
    render(Term, given(explain));

    await userEvent.click(pressing());

    expect(explain).toHaveBeenCalledWith(explained.word);
  });

  it("holds a place while the answer is on its way", async () => {
    const { explain, answer } = pending();
    render(Term, given(explain));

    await userEvent.click(pressing());

    expect(await screen.findByRole("status")).toHaveTextContent(
      m.waiting_answer(),
    );
    answer();
    expect(await screen.findByText(explained.short)).toBeInTheDocument();
  });

  it("says plainly when no explanation came back", async () => {
    render(Term, given(silent()));

    await userEvent.click(pressing());

    expect(await screen.findByText(m.word_unanswered())).toBeInTheDocument();
  });

  it("asks once, however often it is opened", async () => {
    const explain = known();
    render(Term, given(explain));
    const button = pressing();

    await userEvent.click(button);
    await screen.findByText(explained.short);
    await userEvent.click(button);
    await userEvent.click(button);

    expect(await screen.findByText(explained.short)).toBeInTheDocument();
    expect(explain).toHaveBeenCalledTimes(1);
  });

  it("asks again after an answer that never came", async () => {
    const explain = silent();
    render(Term, given(explain));
    const button = pressing();

    await userEvent.click(button);
    await screen.findByText(m.word_unanswered());
    await userEvent.click(button);
    await userEvent.click(button);

    expect(await screen.findByText(m.word_unanswered())).toBeInTheDocument();
    expect(explain).toHaveBeenCalledTimes(2);
  });

  it("names its explanation as its own description", async () => {
    render(Term, given(known()));
    const button = pressing();

    await userEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button.getAttribute("aria-describedby")).toBe(
      (await screen.findByRole("note")).id,
    );
  });

  it("closes again when pressed a second time", async () => {
    render(Term, given(known()));
    const button = pressing();

    await userEvent.click(button);
    await userEvent.click(button);

    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    expect(button).not.toHaveAttribute("aria-describedby");
  });

  it("closes on escape, and leaves focus where it was", async () => {
    render(Term, given(known()));
    const button = pressing();

    await userEvent.click(button);
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it("stays open for a key that is not escape", async () => {
    render(Term, given(known()));

    await userEvent.click(pressing());
    await userEvent.keyboard("x");

    expect(await screen.findByRole("note")).toBeInTheDocument();
  });

  it("is reached and opened by the keyboard alone", async () => {
    render(Term, given(known()));

    await userEvent.tab();
    expect(pressing()).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("note")).toBeInTheDocument();
  });

  it("stops asking to be pressed once it has been read", () => {
    const { container } = render(Term, given(known(), true));
    expect(container.querySelector("button")).toHaveClass("read");
  });

  it("asks to be pressed until then", () => {
    const { container } = render(Term, given(known()));
    expect(container.querySelector("button")).not.toHaveClass("read");
  });
});
