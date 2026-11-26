import { describe, expect, it } from "vitest";
import { notificationWords } from "./alerts";
import { whenOf } from "./instant";
import {
  backendEntry,
  deliveryLine,
  notifiedReadout,
  type Backend,
  type Delivery,
  type Notified,
} from "./notifying";
import { notified, ntfy, webhook } from "../api/health";
import * as m from "../paraglide/messages.js";

describe("where alerts go", () => {
  it("says where delivery stands, each back-end, and each record that could not be read", () => {
    const told = notifiedReadout(notified);
    expect(told.lines).toStrictEqual([
      m.notify_degraded(),
      m.notify_unread({ backend: "old", because: "Its record is damaged." }),
    ]);
    expect(told.entries.map((one) => one.head)).toStrictEqual([
      "phone",
      "kits-hook",
    ]);
  });

  it("has words for where delivery stands, and says so of a state it has none for", () => {
    const state = (said: string): string | undefined =>
      notifiedReadout({
        ...notified,
        unread: [],
        state: said,
      } as unknown as Notified).lines[0];
    expect(state("unconfigured")).toBe(m.notify_unconfigured());
    expect(state("ready")).toBe(m.notify_ready());
    expect(state("unreachable")).toBe(m.notify_unreachable());
    expect(state("sideways")).toBe(m.notify_state_other());
  });
});

describe("one back-end", () => {
  it("says what it is, who chose it, how far it is proven, where it is hosted, and every delivery", () => {
    const failure = deliveryLine({
      at: 1_791_400_000,
      kind: "problem",
      outcome: { failed: "503" },
    });
    expect(backendEntry(ntfy)).toStrictEqual({
      head: "phone",
      lines: [
        m.notify_reaches({
          kind: m.notify_kind_ntfy(),
          where: "ntfy.sh/house-alerts",
        }),
        m.notify_chosen_operator(),
        m.notify_proven({ when: whenOf(1_791_300_000) }),
        m.notify_hosted({ host: "ntfy.sh", leaves: "what happened, when" }),
        failure,
        failure,
        m.notify_retry({ attempt: 2, of: 5, when: whenOf(1_791_400_300) }),
      ],
    });
  });

  it("says a member chose it, that it is held, and that it never delivered", () => {
    expect(backendEntry(webhook).lines).toStrictEqual([
      m.notify_reaches({
        kind: m.notify_kind_webhook(),
        where: "hooks.example.org/kit",
      }),
      m.notify_chosen_member({ member: "kit" }),
      m.notify_held({ why: "Its last test was refused." }),
      m.notify_never_delivered(),
    ]);
    expect(backendEntry({ ...webhook, proof: "unproven" }).lines).toContain(
      m.notify_unproven(),
    );
  });

  it("has words for every kind, and says so of one it has none for", () => {
    const kind = (said: string): string | undefined =>
      backendEntry({ ...webhook, kind: said } as unknown as Backend).lines[0];
    const where = "hooks.example.org/kit";
    expect(kind("gotify")).toBe(
      m.notify_reaches({ kind: m.notify_kind_gotify(), where }),
    );
    expect(kind("apprise")).toBe(
      m.notify_reaches({ kind: m.notify_kind_apprise(), where }),
    );
    expect(kind("unifiedpush")).toBe(
      m.notify_reaches({ kind: m.notify_kind_unifiedpush(), where }),
    );
    expect(kind("sideways")).toBe(
      m.notify_reaches({ kind: m.notify_kind_other(), where }),
    );
  });
});

describe("one delivery", () => {
  it("says whether it was seen arriving, taken, or failed", () => {
    const when = whenOf(9);
    const kind = notificationWords("backup");
    const said = (outcome: unknown): string =>
      deliveryLine({ at: 9, kind: "backup", outcome } as Delivery);
    expect(said("confirmed")).toBe(m.notify_confirmed({ when, kind }));
    expect(said("sent")).toBe(m.notify_sent({ when, kind }));
    expect(said("sideways")).toBe(m.notify_outcome_other({ when, kind }));
  });
});
