import { screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type Dashboard from "./Dashboard.svelte";
import {
  chosenForm,
  controls,
  declared,
  notAnswering,
  rehearsed,
} from "./fixture";
import { bytes } from "../lib/figures";
import { SHORT } from "../lib/shortening.svelte";
import { namesItsForms, takesForms, wordOfDoing } from "../lib/work";
import * as m from "../paraglide/messages.js";
import { answered, read, board } from "./Dashboard.testing";

describe("what starting a form would do", () => {
  const panel = (): HTMLElement =>
    screen.getByRole("region", { name: m.panel_rehearsal() });

  /** The screen with one form chosen, and what asking about it answered. */
  const previewing = (
    preview: Parameters<typeof Dashboard>[1]["controls"]["preview"],
    over: Partial<Parameters<typeof Dashboard>[1]> = {},
  ): void => {
    board({
      programs: read,
      controls: {
        ...controls,
        chosen: [chosenForm],
        preview,
        previewed: answered,
      },
      ...over,
    });
  };

  /** The same answer, with part of it replaced. */
  const saying = (over: Partial<typeof rehearsed>) => ({
    ok: true as const,
    value: { ...rehearsed, ...over },
  });

  it("asks for a form to be chosen while none is", () => {
    board();
    expect(panel()).toHaveTextContent(m.rehearsal_choose());
  });

  // Several forms are one answer, and its first line names every one of them.
  it("answers for every form chosen at once", () => {
    board({
      programs: read,
      controls: {
        ...controls,
        chosen: ["core", chosenForm],
        preview: saying({ forms: ["core", chosenForm] }),
        previewed: answered,
      },
    });
    expect(panel()).toHaveTextContent(
      m.rehearsal_lead({ form: "Core, Media" }),
    );
  });

  it("waits for the answer", () => {
    previewing(undefined);
    expect(within(panel()).getByText(m.waiting_answer())).toBeInTheDocument();
  });

  it("says in the source's own words why it could not be asked", () => {
    previewing({
      ok: false,
      problem: { kind: "unreachable", message: "Nothing answered." },
    });
    expect(panel()).toHaveTextContent("Nothing answered.");
  });

  // Never phrased as having happened: the first thing read is that nothing has.
  it("says first that nothing has started", () => {
    previewing({ ok: true, value: rehearsed });
    expect(panel()).toHaveTextContent(m.rehearsal_lead({ form: "Media" }));
  });

  it("names what would start, by the names the services go by", () => {
    previewing({ ok: true, value: rehearsed });
    const starting = within(panel()).getAllByRole("list")[0];
    expect(starting).toHaveTextContent("Sonarr");
    expect(starting).toHaveTextContent("Radarr");
    expect(starting).toHaveTextContent("jellyfin");
  });

  it("says so where nothing would start", () => {
    previewing(saying({ services: [] }));
    expect(panel()).toHaveTextContent(m.rehearsal_nothing_starts());
  });

  it("names what would be left out, with what it needs and who asked", () => {
    previewing({ ok: true, value: rehearsed });
    expect(panel()).toHaveTextContent(m.rehearsal_would_leave_out());
    expect(panel()).toHaveTextContent("SABnzbd");
    expect(panel()).toHaveTextContent(m.needs_usenet());
    expect(panel()).toHaveTextContent(m.programs_asked_by({ forms: "Media" }));
  });

  it("says nothing of leaving out where nothing would be", () => {
    previewing(saying({ filtered: [] }));
    expect(panel()).not.toHaveTextContent(m.rehearsal_would_leave_out());
  });

  // An estimate set as a bare figure reads as a measurement of something
  // running, and nothing is.
  it("gives the memory as the stack's estimate", () => {
    previewing({ ok: true, value: rehearsed });
    expect(panel()).toHaveTextContent(
      m.rehearsal_estimate({ size: bytes(1536 * 1024 * 1024) }),
    );
  });

  it("names the services the estimate leaves out", () => {
    previewing({ ok: true, value: rehearsed });
    expect(panel()).toHaveTextContent(m.rehearsal_unestimated());
    const unestimated = within(panel()).getAllByRole("list").at(-1);
    expect(unestimated).toHaveTextContent("jellyfin");
  });

  it("says nothing of them where every service declares one", () => {
    previewing(saying({ footprint: { estimated_mib: 1536, unestimated: [] } }));
    expect(panel()).not.toHaveTextContent(m.rehearsal_unestimated());
  });

  // A zero where nothing declared an estimate would read as needing nothing.
  it("gives no figure where no service declares an estimate", () => {
    previewing(
      saying({
        footprint: { estimated_mib: 0, unestimated: rehearsed.services },
      }),
    );
    expect(panel()).toHaveTextContent(m.rehearsal_no_estimate());
    expect(panel()).not.toHaveTextContent(bytes(0));
  });

  it("names forms and services by their ids where nothing has named them", () => {
    previewing(
      { ok: true, value: rehearsed },
      {
        programs: undefined,
        controls: {
          ...controls,
          forms: undefined,
          chosen: [chosenForm],
          preview: { ok: true, value: rehearsed },
          previewed: answered,
        },
      },
    );
    expect(panel()).toHaveTextContent(m.rehearsal_lead({ form: "media" }));
    expect(panel()).toHaveTextContent("sonarr");
  });
});

describe("what the controls reach", () => {
  // Sending a request lemonfiber would refuse for a reason already on the
  // screen makes an operator read a refusal to learn what they could see.
  it("silences what cannot be asked for without a form", () => {
    board();

    for (const doing of namesItsForms) {
      expect(
        screen.getByRole("button", { name: wordOfDoing(doing, false) }),
      ).toHaveAttribute("aria-disabled", "true");
    }
  });

  it("offers them once a form has been chosen", () => {
    board({ controls: { ...controls, chosen: [chosenForm] } });

    for (const doing of namesItsForms) {
      expect(
        screen.getByRole("button", { name: wordOfDoing(doing, true) }),
      ).toHaveAttribute("aria-disabled", "false");
    }
  });

  // Naming no form means the whole stack for these two, so they say the whole
  // stack rather than saying nothing.
  it("says starting and stopping reach the whole stack when nothing is chosen", () => {
    board();

    expect(screen.getByText(m.running_scope_none())).toBeInTheDocument();
    for (const doing of ["up", "down"] as const) {
      expect(
        screen.getByRole("button", { name: wordOfDoing(doing, false) }),
      ).toHaveAttribute("aria-disabled", "false");
    }
  });

  it("says they reach only what was chosen once something is", () => {
    board({ controls: { ...controls, chosen: [chosenForm] } });

    expect(screen.getByText(m.running_scope_some())).toBeInTheDocument();
    for (const doing of takesForms) {
      expect(
        screen.getByRole("button", { name: wordOfDoing(doing, true) }),
      ).toBeInTheDocument();
    }
  });
});

describe("the forms the stack declares", () => {
  it("names each of them in the stack's own words", () => {
    board();

    for (const form of declared) {
      expect(
        screen.getByRole("heading", { name: form.name }),
      ).toBeInTheDocument();
      expect(screen.getByText(form.description)).toBeInTheDocument();
    }
  });

  it("says which of them the controls act on", () => {
    board({ controls: { ...controls, chosen: [chosenForm] } });

    const chose = declared.find((form) => form.id === chosenForm);

    expect(chose).toBeDefined();
    expect(
      screen.getByRole("button", {
        name: m.forms_choose({ name: chose?.name ?? "" }),
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("asks for a form to be taken up when its control is pressed", async () => {
    const onchoose = vi.fn();
    board({ controls: { ...controls, onchoose } });

    await userEvent.click(
      screen.getByRole("button", {
        name: m.forms_choose({ name: declared[0]?.name ?? "" }),
      }),
    );

    expect(onchoose).toHaveBeenCalledWith(declared[0]?.id);
  });

  it("says plainly when the stack declares none", () => {
    board({
      controls: { ...controls, forms: { ok: true, value: { forms: [] } } },
    });

    expect(screen.getByText(m.forms_none())).toBeInTheDocument();
  });

  // The words are the source's own, which is worth more than any reading of
  // them.
  it("says in the source's own words why they could not be listed", () => {
    board({
      controls: {
        ...controls,
        forms: {
          ok: false,
          problem: { kind: "unreachable", message: notAnswering },
        },
      },
    });

    expect(screen.getByText(notAnswering)).toBeInTheDocument();
  });
});

describe("a long list of forms", () => {
  /** As many forms as are shown before the rest is asked for, and three more. */
  const many = Array.from({ length: SHORT + 3 }, (_, at) => ({
    id: `form-${String(at)}`,
    name: `Form ${String(at)}`,
    description: "One more form.",
    composable: true,
  }));
  const panel = (): HTMLElement =>
    screen.getByRole("region", { name: m.panel_forms() });

  it("lists the first few and any chosen further down, the rest one press away", async () => {
    const chosen = many.at(-1)?.id ?? "";
    board({
      controls: {
        ...controls,
        forms: { ok: true, value: { forms: many } },
        chosen: [chosen],
      },
    });
    expect(
      within(panel()).getByText(`Form ${String(SHORT + 2)}`),
    ).toBeVisible();
    expect(within(panel()).queryByText(`Form ${String(SHORT)}`)).toBeNull();

    await userEvent.click(
      within(panel()).getByRole("button", {
        name: m.action_show_all({ count: many.length }),
      }),
    );

    expect(within(panel()).getByText(`Form ${String(SHORT)}`)).toBeVisible();
  });
});
