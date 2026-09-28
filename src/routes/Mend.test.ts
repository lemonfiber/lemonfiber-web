import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Checks from "./Checks.svelte";
import { allWell, diagnosis } from "./findings";
import { agreement, mender, offer, offered, putBack } from "./mended";
import type { Freshness } from "../lib/freshness";
import type { Mender } from "../lib/mending";
import type { Diagnosis } from "../lib/wire";
import type { Work } from "../lib/work";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 6 };

/** The checks screen, with what can be asked about them beside the findings. */
function mending(
  over: Partial<Mender> = {},
  read: Reading<Diagnosis> | undefined = { ok: true, value: diagnosis },
): void {
  render(Checks, {
    diagnosis: read,
    freshness: answered,
    mender: { ...mender, ...over },
  });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_mending() });

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.mending_asked() });

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

describe("what can be asked about the checks", () => {
  it("draws nothing where nothing answers it", () => {
    render(Checks, {
      diagnosis: { ok: true, value: allWell },
      freshness: answered,
    });
    expect(
      screen.queryByRole("region", { name: m.panel_mending() }),
    ).toBeNull();
  });

  it("stands under the findings, so it is read after what it is for", () => {
    mending();
    expect(screen.getAllByRole("region").at(-1)).toBe(panel());
  });

  it.each([
    [m.action_offer_repairs(), { doing: "repair" }],
    [m.action_diagnose(), { doing: "diagnose" }],
    [m.action_undo_last(), { doing: "undo" }],
  ] as const)("asks for %s when it is pressed", async (label, asking) => {
    const onask = vi.fn();
    mending({ onask });

    await press(label);

    expect(onask).toHaveBeenCalledWith(asking);
  });

  // Each control says which warning it accepts, because a reader listing the
  // controls is given the names and nothing around them.
  it("offers to accept each warning still asking for the operator, by name", async () => {
    const onask = vi.fn();
    mending({ onask });
    const warning = diagnosis.findings.find(
      (finding) => finding.check === "storage.headroom",
    );

    await press(m.action_accept({ check: warning?.title ?? "" }));

    expect(onask).toHaveBeenCalledWith({
      doing: "accept",
      check: "storage.headroom",
      title: warning?.title,
    });
  });

  it("offers to accept nothing where no warning is asking", () => {
    mending({}, { ok: true, value: allWell });
    expect(
      screen.queryByRole("group", { name: m.mending_warnings() }),
    ).toBeNull();
  });

  it("offers to accept nothing where the checks did not answer", () => {
    mending(
      {},
      {
        ok: false,
        problem: {
          kind: "unreachable",
          message: "lemonfiber is not answering.",
        },
      },
    );
    expect(
      screen.queryByRole("group", { name: m.mending_warnings() }),
    ).toBeNull();
  });

  it("offers to accept nothing already set aside", () => {
    const setAside: Diagnosis = {
      ...diagnosis,
      findings: diagnosis.findings.map((finding) =>
        finding.verdict.outcome === "warn"
          ? {
              ...finding,
              verdict: { ...finding.verdict, state: "suppressed" },
            }
          : finding,
      ),
    };
    mending({}, { ok: true, value: setAside });
    expect(
      screen.queryByRole("group", { name: m.mending_warnings() }),
    ).toBeNull();
  });

  it("silences every control while a request is in flight", () => {
    mending({ busy: true });
    expect(
      screen.getByRole("button", { name: m.action_offer_repairs() }),
    ).toHaveAttribute("aria-disabled", "true");
  });
});

describe("what is asked before anything changes", () => {
  it("says what the checks that disturb will do before the yes", () => {
    mending({ asked: { doing: "diagnose" } });

    expect(
      within(asked()).getByText(m.confirm_diagnose_prose()),
    ).toBeInTheDocument();
  });

  it("silences the other controls while the question stands", () => {
    mending({ asked: { doing: "undo" } });
    expect(
      screen.getByRole("button", { name: m.action_diagnose() }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("sends the same asking again on a yes", async () => {
    const onask = vi.fn();
    mending({ asked: { doing: "undo" }, onask });

    await press(m.action_undo_yes());

    expect(onask).toHaveBeenCalledWith({ doing: "undo" });
  });

  it("withdraws the question on a no, and sends nothing", async () => {
    const onask = vi.fn();
    const onleave = vi.fn();
    mending({ asked: { doing: "undo" }, onask, onleave });

    await press(m.action_leave_as_is());

    expect(onleave).toHaveBeenCalled();
    expect(onask).not.toHaveBeenCalled();
  });

  it("stands the reader in the region the question was in", async () => {
    mending({ asked: { doing: "undo" } });

    await press(m.action_leave_as_is());

    expect(asked()).toHaveFocus();
  });
});

describe("the offer", () => {
  it("says what each repair would do, and what else it changes, before anything is chosen", () => {
    mending({ work: [offered] });

    const [restart, permissions] = offer.offered;
    expect(
      within(asked()).getAllByText(restart?.does ?? "").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        m.mending_effects({ effects: permissions?.effects.join(" ") ?? "" }),
      ),
    ).toBeInTheDocument();
  });

  it("says whether each repair can be put back afterwards", () => {
    mending({ work: [offered] });
    expect(screen.getByText(m.mending_reversible())).toBeInTheDocument();
    expect(screen.getByText(m.mending_irreversible())).toBeInTheDocument();
  });

  it("chooses a repair by the check it answers", async () => {
    const onpick = vi.fn();
    mending({ work: [offered], onpick });

    await press(m.mending_choose({ check: "services.health" }));

    expect(onpick).toHaveBeenCalledWith("services.health");
  });

  it("shows which repairs are chosen", () => {
    mending({ work: [offered], picked: ["services.health"] });
    expect(
      screen.getByRole("button", {
        name: m.mending_choose({ check: "services.health" }),
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("puts nothing right until something is chosen", () => {
    mending({ work: [offered] });
    expect(
      screen.getByRole("button", { name: m.action_repair_chosen() }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  // The yes names the offer it was read in, so lemonfiber can refuse to spend
  // it on one that has moved on.
  it("puts right what was chosen, naming the offer it was read in", async () => {
    const onask = vi.fn();
    mending({ work: [offered], picked: ["services.health"], onask });

    await press(m.action_repair_chosen());

    expect(onask).toHaveBeenCalledWith({
      doing: "repair",
      offer: agreement,
      agreed: ["services.health"],
    });
  });

  it("puts the offer away when it is left as it is", async () => {
    const ondrop = vi.fn();
    mending({ work: [offered], ondrop });

    await press(m.action_leave_as_is());

    expect(ondrop).toHaveBeenCalledWith(offered.id);
  });
});

describe("what came of asking", () => {
  it("heads each record with what was asked for, and says what it came to", () => {
    mending({ work: [putBack] });

    const came = within(asked()).getByRole("list", {
      name: m.came_heading(),
    });
    expect(within(came).getByText(/sonarr/)).toBeInTheDocument();
    expect(within(asked()).getByText(m.doing_undo_title())).toBeInTheDocument();
  });

  // A refusal is lemonfiber's own sentence, and reads as a refusal rather than
  // as a page that lost the thread.
  it("says a refusal in lemonfiber's words, as a refusal", () => {
    const said =
      "The offer has changed since it was read, so nothing was done.";
    const refused: Work = {
      id: "21",
      doing: "repair",
      scoped: false,
      given: {},
      at: "declined",
      said,
    };
    mending({ work: [refused] });

    expect(within(asked()).getByText(said)).toBeInTheDocument();
    expect(within(asked()).getByText(m.eyebrow_refused())).toBeInTheDocument();
  });

  it("says a page that could not ask lost track, not that it was refused", () => {
    const lost: Work = {
      id: "22",
      doing: "diagnose",
      scoped: false,
      given: {},
      at: "adrift",
      job: "5c63",
      said: "lemonfiber is not answering.",
    };
    mending({ work: [lost] });

    expect(
      within(asked()).getByText(m.eyebrow_lost_track()),
    ).toBeInTheDocument();
    expect(within(asked()).queryByText(m.eyebrow_refused())).toBeNull();
  });

  it("puts a record away when it is asked to, and stands the reader where it was", async () => {
    const ondrop = vi.fn();
    mending({ work: [putBack], ondrop });

    await press(m.action_hide_record());

    expect(ondrop).toHaveBeenCalledWith(putBack.id);
    expect(asked()).toHaveFocus();
  });
});
