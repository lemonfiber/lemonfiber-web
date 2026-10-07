import { screen, waitFor, within } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { chosenForm, declared } from "./fixture";
import { namesItsForms, wordOfDoing } from "../lib/work";
import * as m from "../paraglide/messages.js";
import { here } from "./served";
import { answering, refusing, console_, choose } from "./Console.testing";

describe("the forms the stack declares", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("lists them, in the stack's own words", async () => {
    console_();

    for (const form of declared) {
      expect(await screen.findByText(form.description)).toBeInTheDocument();
    }
  });

  // Three actions have lost their subject without a form, and nothing this page
  // could read listed the forms before the listing existed.
  it("offers what needs a form only once one has been taken up", async () => {
    console_();
    await screen.findByText(declared[0]?.description ?? "");

    for (const doing of namesItsForms) {
      expect(
        screen.getByRole("button", { name: wordOfDoing(doing, false) }),
      ).toHaveAttribute("aria-disabled", "true");
    }

    await choose(chosenForm);

    for (const doing of namesItsForms) {
      expect(
        screen.getByRole("button", { name: wordOfDoing(doing, true) }),
      ).toHaveAttribute("aria-disabled", "false");
    }
  });
});

/** The panel saying what starting the form chosen would do. */
const rehearsal = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_rehearsal() });

/** What the preview's first line says for the form a story takes up. */
const rehearsalLead = (): string => {
  const form = declared.find((one) => one.id === chosenForm);
  return m.rehearsal_lead({ form: form?.name ?? "" });
};

/** What the preview's first line says for that form and the core together. */
const bothLead = (): string => {
  const form = declared.find((one) => one.id === chosenForm);
  return m.rehearsal_lead({ form: `${form?.name ?? ""}, Core` });
};

describe("what starting a form would do", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  // Said before the control that starts it is pressed, which is the only
  // moment saying it is any use.
  it("asks what starting the form chosen would come to, and says it", async () => {
    const urls: string[] = [];
    console_({
      sending: (url, init) => {
        urls.push(url);
        return answering(url, init);
      },
    });
    await screen.findByText(declared[0]?.description ?? "");

    await choose(chosenForm);

    expect(await within(rehearsal()).findByText(rehearsalLead())).toBeVisible();
    expect(urls).toContain(`${here}/api/forms?form=${chosenForm}`);
    expect(rehearsal()).toHaveTextContent("SABnzbd");
  });

  // One answer for all of them, since a program two forms share starts once.
  it("names every form chosen to one asking, in the order chosen", async () => {
    const urls: string[] = [];
    console_({
      sending: (url, init) => {
        urls.push(url);
        return answering(url, init);
      },
    });
    await screen.findByText(declared[0]?.description ?? "");

    await choose(chosenForm);
    await within(rehearsal()).findByText(rehearsalLead());
    await choose("core");

    expect(await within(rehearsal()).findByText(bothLead())).toBeVisible();
    expect(urls).toContain(`${here}/api/forms?form=${chosenForm}&form=core`);
  });

  // An answer about a choice the reader has moved on from would be read as the
  // answer about the one they are looking at.
  it("drops an answer that arrives after the choice moved on", async () => {
    let answer!: () => void;
    const held = new Promise<void>((resolve) => {
      answer = resolve;
    });
    console_({
      sending: async (url, init) => {
        if (url.endsWith(`form=${chosenForm}`)) await held;
        return answering(url, init);
      },
    });
    await screen.findByText(declared[0]?.description ?? "");

    await choose(chosenForm);
    await choose("core");
    await within(rehearsal()).findByText(bothLead());
    answer();
    await held;

    await waitFor(() => {
      expect(rehearsal()).toHaveTextContent(bothLead());
    });
    expect(rehearsal()).not.toHaveTextContent(rehearsalLead());
  });

  it("goes back to asking for a choice once the form is put down", async () => {
    console_();
    await screen.findByText(declared[0]?.description ?? "");

    await choose(chosenForm);
    await within(rehearsal()).findByText(rehearsalLead());
    await choose(chosenForm);

    expect(rehearsal()).toHaveTextContent(m.rehearsal_choose());
  });

  it("passes on being turned away while asking", async () => {
    const refused = vi.fn();
    console_({
      sending: (url, init) =>
        url.includes("form=") ? refusing(url, init) : answering(url, init),
      onrefused: refused,
    });
    await screen.findByText(declared[0]?.description ?? "");

    await choose(chosenForm);

    await waitFor(() => {
      expect(refused).toHaveBeenCalled();
    });
  });
});
