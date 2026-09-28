import { render, screen, waitFor, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import {
  API_VERSION,
  type ByKind,
  type Fetching,
  type Kind,
  type Sending,
} from "@lemonfiber/sdk-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { allWell, diagnosis } from "./findings";
import { agreement, carried, offer, undone } from "./mended";
import { gradingOf } from "../lib/verdict";
import * as m from "../paraglide/messages.js";

const key = ["a", "run", "key"].join("-");
const here = "http://127.0.0.1:7777";
const job = "9f2c41ab7d0e5c63";

/** One envelope, rendered as an endpoint renders it. */
const enveloped = <K extends Kind>(kind: K, data: ByKind[K]["data"]): string =>
  JSON.stringify({ api_version: API_VERSION, kind, data });

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () => Promise.resolve({ ok: false, body: null });

/** One reply, as a transport hands it over. */
interface Says {
  readonly status: number;
  readonly body: string;
}

/** What was asked of the stack, in the order it was asked. */
interface Asked {
  /** Each action, by the address it was posted to and what it carried. */
  readonly posted: { readonly at: string; readonly body: string }[];
  /** How many times the checks were read. */
  checked: number;
}

/**
 * A stack that answers the checks with a run holding a warning, answers every
 * action with a name for the work, and redeems each name for the next of what
 * it was given — holding at the last.
 */
function stack(
  becoming: readonly Says[],
  asked: Asked,
  reply: Says = { status: 202, body: enveloped("job", { job, action: "x" }) },
): Sending {
  let redeemed = 0;
  return (url, init) => {
    const said = (answer: Says) =>
      Promise.resolve({
        ok: answer.status >= 200 && answer.status < 300,
        status: answer.status,
        text: () => Promise.resolve(answer.body),
      });
    if (init.method === "POST") {
      asked.posted.push({ at: url.replace(here, ""), body: init.body ?? "" });
      return said(reply);
    }
    if (url.includes("/api/jobs/")) {
      const next = becoming[Math.min(redeemed, becoming.length - 1)];
      redeemed += 1;
      return said(next ?? reply);
    }
    if (url.includes("/api/checks")) {
      asked.checked += 1;
      return said({ status: 200, body: enveloped("doctor", diagnosis) });
    }
    return said({ status: 404, body: "" });
  };
}

const opened = (sending: Sending): void => {
  render(Console, {
    reaching: { at: here, token: key, sending, fetching: silent },
    onrefused: vi.fn(),
    pausing: () => Promise.resolve(),
  });
};

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.mending_asked() });

const fresh = (): Asked => ({ posted: [], checked: 0 });

describe("putting right what the checks found", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/checks");
  });

  // Seeing the offer changes nothing, so it is asked for at once and what
  // comes back is read before anything is agreed to.
  it("asks what can be put right at once, and shows the offer before any yes", async () => {
    const sent = fresh();
    opened(stack([{ status: 200, body: enveloped("repair", offer) }], sent));
    await screen.findByText(m.action_offer_repairs());

    await press(m.action_offer_repairs());

    expect(
      await screen.findByText(m.mending_offer_title()),
    ).toBeInTheDocument();
    expect(sent.posted).toStrictEqual([
      { at: "/api/actions/repair", body: "{}" },
    ]);
  });

  it("puts right what was chosen, naming the offer it was read in", async () => {
    const sent = fresh();
    opened(
      stack(
        [
          { status: 200, body: enveloped("repair", offer) },
          { status: 200, body: enveloped("repair", carried) },
        ],
        sent,
      ),
    );
    await screen.findByText(m.action_offer_repairs());
    await press(m.action_offer_repairs());
    await screen.findByText(m.mending_offer_title());

    await press(m.mending_choose({ check: "services.health" }));
    await press(m.action_repair_chosen());

    expect(sent.posted.at(-1)).toStrictEqual({
      at: "/api/actions/repair",
      body: JSON.stringify({
        confirm: true,
        offer: agreement,
        agreed: ["services.health"],
      }),
    });
    expect(
      await within(asked()).findByText(
        m.came_repair_fixed({ check: "services.health" }),
      ),
    ).toBeInTheDocument();
  });

  // A repair carried out changes what the checks would find.
  it("asks the checks again once a repair has been carried out", async () => {
    const sent = fresh();
    opened(
      stack(
        [
          { status: 200, body: enveloped("repair", offer) },
          { status: 200, body: enveloped("repair", carried) },
        ],
        sent,
      ),
    );
    await screen.findByText(m.action_offer_repairs());
    await press(m.action_offer_repairs());
    await screen.findByText(m.mending_offer_title());
    const before = sent.checked;

    await press(m.mending_choose({ check: "services.health" }));
    await press(m.action_repair_chosen());

    await waitFor(() => {
      expect(sent.checked).toBe(before + 1);
    });
  });

  it("takes the offer away once it has been answered", async () => {
    const sent = fresh();
    opened(
      stack(
        [
          { status: 200, body: enveloped("repair", offer) },
          { status: 200, body: enveloped("repair", carried) },
        ],
        sent,
      ),
    );
    await screen.findByText(m.action_offer_repairs());
    await press(m.action_offer_repairs());
    await screen.findByText(m.mending_offer_title());

    await press(m.mending_choose({ check: "services.health" }));
    await press(m.mending_choose({ check: "services.health" }));
    await press(m.mending_choose({ check: "storage.permissions" }));
    await press(m.action_repair_chosen());

    await waitFor(() => {
      expect(screen.queryByText(m.mending_offer_title())).toBeNull();
    });
    expect(sent.posted.at(-1)?.body).toContain(
      '"agreed":["storage.permissions"]',
    );
  });

  // A refusal is lemonfiber's own sentence, and reads as a refusal.
  it("says a refused agreement in lemonfiber's words", async () => {
    const moved =
      "The offer has changed since it was read, so nothing was done.";
    const sent = fresh();
    opened(stack([], sent, { status: 409, body: moved }));
    await screen.findByText(m.action_offer_repairs());

    await press(m.action_offer_repairs());

    expect(await within(asked()).findByText(moved)).toBeInTheDocument();
    expect(within(asked()).getByText(m.eyebrow_refused())).toBeInTheDocument();
  });
});

describe("what is asked before anything changes", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/checks");
  });

  it("says what the checks that disturb will do, and sends nothing yet", async () => {
    const sent = fresh();
    opened(stack([], sent));
    await screen.findByText(m.action_diagnose());

    await press(m.action_diagnose());

    expect(
      within(asked()).getByText(m.confirm_diagnose_prose()),
    ).toBeInTheDocument();
    expect(sent.posted).toStrictEqual([]);
  });

  it("runs them on a yes, and draws the run they came back with", async () => {
    const sent = fresh();
    opened(stack([{ status: 200, body: enveloped("doctor", allWell) }], sent));
    await screen.findByText(m.action_diagnose());

    await press(m.action_diagnose());
    await press(m.action_diagnose_yes());

    expect(sent.posted).toStrictEqual([
      {
        at: "/api/actions/diagnose",
        body: JSON.stringify({ disruptive: true }),
      },
    ]);
    // The banner grades the run that came back, and the record says so too.
    await waitFor(() => {
      expect(
        screen.getAllByText(gradingOf("healthy").lead).length,
      ).toBeGreaterThanOrEqual(2);
    });
  });

  it("accepts the warning named, and no other", async () => {
    const sent = fresh();
    opened(stack([{ status: 200, body: enveloped("doctor", allWell) }], sent));
    const warning = diagnosis.findings.find(
      (finding) => finding.check === "storage.headroom",
    );
    const label = m.action_accept({ check: warning?.title ?? "" });
    await screen.findByText(label);

    await press(label);
    await press(m.action_accept_yes());

    expect(sent.posted).toStrictEqual([
      {
        at: "/api/actions/accept",
        body: JSON.stringify({ check: "storage.headroom" }),
      },
    ]);
  });

  it("puts the last repair back on a yes, and says what went back", async () => {
    const sent = fresh();
    opened(stack([{ status: 200, body: enveloped("undo", undone) }], sent));
    await screen.findByText(m.action_undo_last());

    await press(m.action_undo_last());
    await press(m.action_undo_yes());

    expect(sent.posted).toStrictEqual([
      { at: "/api/actions/undo", body: "{}" },
    ]);
    expect(
      await within(asked()).findByText(
        m.came_undo_reversed({ target: "sonarr", does: m.came_undo_restore() }),
      ),
    ).toBeInTheDocument();
    // Putting a repair back changes what the checks would find.
    await waitFor(() => {
      expect(sent.checked).toBeGreaterThan(1);
    });
  });

  it("puts a record away when it is asked to", async () => {
    const sent = fresh();
    opened(stack([{ status: 200, body: enveloped("undo", undone) }], sent));
    await screen.findByText(m.action_undo_last());
    await press(m.action_undo_last());
    await press(m.action_undo_yes());
    await within(asked()).findByText(m.doing_undo_title());

    await press(m.action_hide_record());

    expect(within(asked()).queryByText(m.doing_undo_title())).toBeNull();
  });

  it("sends nothing when the answer is no", async () => {
    const sent = fresh();
    opened(stack([], sent));
    await screen.findByText(m.action_undo_last());

    await press(m.action_undo_last());
    await press(m.action_leave_as_is());

    expect(screen.queryByText(m.confirm_undo_title())).toBeNull();
    expect(sent.posted).toStrictEqual([]);
  });
});
