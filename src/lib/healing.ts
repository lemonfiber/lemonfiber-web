/**
 * The self-healing of stuck downloads: whether it acts, the strikes and grace
 * it acts after, every unhealthy item of the latest pass, what could not be
 * reached, and the newest runs.
 *
 * Each unhealthy item can be followed to its trace, by the title it is for
 * where a curator holds it and by its release where none does.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { stamped, whenOf } from "./instant";
import { listed } from "./listed";
import { given, lasting, type Entry, type Readout } from "./readout";
import * as m from "../paraglide/messages.js";

/** The self-healing of stuck downloads, as the latest pass found the queue. */
export type Healing = ByKind["queue"]["data"];

/** One unhealthy item. */
export type Wedged = NonNullable<Healing["items"]>[number];

/** One run that could act. */
export type Run = NonNullable<Healing["runs"]>[number];

/** One act a run takes on an item. */
type Act = NonNullable<Wedged["next"]>[number];

/** One act as a run took it. */
type Taken = NonNullable<Run["items"]>[number]["acts"][number];

/** Why an item is unhealthy, in words. */
function wedgeWord(wedge: Wedged["class"]): string {
  switch (wedge) {
    case "stalled":
      return m.queue_stalled();
    case "slow":
      return m.queue_slow();
    case "failed":
      return m.queue_failed();
    case "stuck-on-metadata":
      return m.queue_metadata();
    case "orphaned":
      return m.queue_orphaned();
    default:
      return m.queue_wedge_other();
  }
}

/** One act, in a word. */
export function actWord(act: Act): string {
  switch (act) {
    case "remove":
      return m.queue_act_remove();
    case "blocklist":
      return m.queue_act_blocklist();
    case "search":
      return m.queue_act_search();
    default:
      return m.queue_act_other();
  }
}

/** One act as a run took it, in a sentence. */
export function takenLine(taken: Taken): string {
  const act = actWord(taken.act);
  const why = taken.why ?? "";
  switch (taken.outcome) {
    case "done":
      return m.queue_taken_done({ act });
    case "would":
      return m.queue_taken_would({ act });
    case "refused":
      return m.queue_taken_refused({ act, why });
    case "fell-back":
      return m.queue_taken_fell_back({
        act,
        instead: given(taken.instead)
          ? actWord(taken.instead)
          : m.queue_act_other(),
        why,
      });
    default:
      return m.queue_taken_other({ act });
  }
}

/** One unhealthy item, as the entry a reading lists. */
export function wedgedEntry(item: Wedged): Entry {
  const named = item.title ?? item.release;
  const lines = [
    m.queue_held_by({ service: item.service }),
    wedgeWord(item.class),
    item.why,
    m.queue_strikes({ count: item.strikes }),
  ];
  if (given(item.title)) lines.push(m.queue_release({ release: item.release }));
  if (stamped(item.added_at)) {
    lines.push(m.queue_added({ when: whenOf(item.added_at) }));
  }
  if (stamped(item.in_grace_until)) {
    lines.push(m.queue_in_grace({ until: whenOf(item.in_grace_until) }));
  }
  const next = item.next ?? [];
  if (next.length > 0)
    lines.push(m.queue_next({ acts: listed(next.map(actWord)) }));
  return {
    head: named,
    lines,
    follow: {
      label: m.action_stuck_follow({ title: named }),
      sought: { term: named, season: undefined },
    },
  };
}

/** One run, as the entry a reading lists. */
export function runEntry(run: Run): Entry {
  const lines: string[] = [
    run.rehearsed ? m.queue_run_rehearsed() : m.queue_run_acted(),
  ];
  const items = run.items ?? [];
  if (items.length === 0) lines.push(m.queue_run_nothing());
  for (const item of items) {
    lines.push(
      m.queue_run_item({
        named: item.title ?? item.release,
        why: item.why,
        acts: listed(item.acts.map(takenLine)),
      }),
    );
  }
  return { head: m.queue_run({ when: whenOf(run.at) }), lines };
}

/** The self-healing of stuck downloads, told. */
export function healingReadout(healing: Healing): Readout {
  const lines: string[] = [
    healing.healing === "on" ? m.queue_healing_on() : m.queue_healing_off(),
    m.queue_rule({
      count: healing.strikes_needed,
      grace: lasting(healing.grace_s),
    }),
    stamped(healing.classified_at)
      ? m.queue_classified({ when: whenOf(healing.classified_at) })
      : m.queue_never_classified(),
  ];
  if (healing.incomplete) lines.push(m.queue_incomplete());
  if (given(healing.mismatch)) lines.push(healing.mismatch);
  for (const one of healing.unreachable ?? []) {
    lines.push(m.queue_unreached({ service: one.service, why: one.why }));
  }
  const items = healing.items ?? [];
  if (items.length === 0) lines.push(m.queue_none());
  return {
    lines,
    entries: [...items.map(wedgedEntry), ...(healing.runs ?? []).map(runEntry)],
  };
}
