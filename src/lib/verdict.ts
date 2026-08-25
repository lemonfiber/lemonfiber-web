/**
 * What a diagnostic run said, in the words this interface already has.
 *
 * Two vocabularies, kept apart. A run amounts to one of four gradings, and each
 * check inside it answers with one of five outcomes — and neither of those is
 * the five-way grading of how much a figure can be trusted. A verdict is a
 * severity and a word here rather than a `State`, so nothing on a screen is
 * announced by a word belonging to a different question.
 *
 * Nothing here decides anything. The grading and the outcome are the server's;
 * what this chooses is how loudly each is drawn and which sentence it reads as.
 */
import type { Category, Outcome, Overall, Remedy, Verdict } from "./wire";
import type { Tone } from "./state";
import * as m from "../paraglide/messages.js";

/** Every grading a run can be given, in the order the contract declares them. */
export const everyOverall: readonly Overall[] = [
  "healthy",
  "degraded",
  "broken",
  "unknown",
];

/** Every way a check can turn out, in the order the contract declares them. */
export const everyOutcome: readonly Outcome[] = [
  "pass",
  "warn",
  "fail",
  "unverified",
  "skipped",
];

/** Every family a check can belong to, in the order the contract declares them. */
export const everyCategory: readonly Category[] = [
  "environment",
  "storage",
  "network",
  "vpn",
  "credentials",
  "services",
  "providers",
  "queue",
  "config",
];

/** What a run's grading has to tell the whole screen. */
export interface Grading {
  /** What the run came to, in one clause. */
  readonly lead: string;
  /** What that means for everything below it. */
  readonly prose: string;
}

/**
 * How badly a run's grading wants the operator.
 *
 * A run that could not establish health is calm: not knowing is not an
 * emergency, and giving it a severity would make it compete with one.
 */
export function toneOfOverall(overall: Overall): Tone {
  switch (overall) {
    case "healthy":
    case "unknown":
      return "calm";
    case "degraded":
      return "watch";
    case "broken":
      return "alarm";
  }
}

/**
 * What a run's grading says, as a clause and what follows from it.
 */
export function gradingOf(overall: Overall): Grading {
  switch (overall) {
    case "healthy":
      return {
        lead: m.overall_healthy_lead(),
        prose: m.overall_healthy_prose(),
      };
    case "degraded":
      return {
        lead: m.overall_degraded_lead(),
        prose: m.overall_degraded_prose(),
      };
    case "broken":
      return { lead: m.overall_broken_lead(), prose: m.overall_broken_prose() };
    case "unknown":
      return {
        lead: m.overall_unknown_lead(),
        prose: m.overall_unknown_prose(),
      };
  }
}

/**
 * How badly one check's outcome wants the operator.
 *
 * A check that could not run and one that did not apply are both calm, and
 * neither of them is a pass — which the word beside it says, and which the
 * grading of the whole run has already counted.
 */
export function toneOfOutcome(outcome: Outcome): Tone {
  switch (outcome) {
    case "pass":
    case "unverified":
    case "skipped":
      return "calm";
    case "warn":
      return "watch";
    case "fail":
      return "alarm";
  }
}

/**
 * How it turned out, in one word.
 */
export function wordOfOutcome(outcome: Outcome): string {
  switch (outcome) {
    case "pass":
      return m.outcome_pass();
    case "warn":
      return m.outcome_warn();
    case "fail":
      return m.outcome_fail();
    case "unverified":
      return m.outcome_unverified();
    case "skipped":
      return m.outcome_skipped();
  }
}

/**
 * The family the check belongs to.
 */
export function wordOfCategory(category: Category): string {
  switch (category) {
    case "environment":
      return m.category_environment();
    case "storage":
      return m.category_storage();
    case "network":
      return m.category_network();
    case "vpn":
      return m.category_vpn();
    case "credentials":
      return m.category_credentials();
    case "services":
      return m.category_services();
    case "providers":
      return m.category_providers();
    case "queue":
      return m.category_queue();
    case "config":
      return m.category_config();
  }
}

/**
 * What a check said beyond how it turned out.
 *
 * One shape over five verdicts, so a screen reads a finding without a branch
 * per outcome: the evidence behind a pass, the reason a check could not run or
 * did not apply, and what a warning or a failure means and what to do about it.
 */
export interface Account {
  /** What happened, in one plain sentence. */
  readonly summary: string | undefined;
  /** What it means for the operator. */
  readonly meaning: string | undefined;
  /** What to do, most likely first. */
  readonly remedies: readonly Remedy[];
}

/** A verdict that says nothing beyond its outcome. */
const SILENT: Account = {
  summary: undefined,
  meaning: undefined,
  remedies: [],
};

/**
 * What a verdict says for itself.
 *
 * The two verdicts that carry a problem carry its fields beside the outcome
 * rather than under a name of their own, and the generated types for those two
 * hold the outcome and nothing else — so those fields are read off the answer
 * and checked as they are read. A verdict carrying something other than what is
 * named here reads as one that said nothing, which is a finding with its title
 * and its outcome rather than one with an empty sentence under it.
 */
export function accountOf(verdict: Verdict): Account {
  switch (verdict.outcome) {
    case "pass":
      return { ...SILENT, summary: verdict.note ?? undefined };
    case "skipped":
      return { ...SILENT, summary: verdict.reason };
    case "unverified":
      return {
        summary: verdict.reason,
        meaning: undefined,
        remedies: [verdict.remedy],
      };
    case "warn":
    case "fail":
      return troubled(verdict);
  }
}

/** The problem a warning or a failure carries, read off the answer. */
function troubled(verdict: Verdict): Account {
  const held = verdict as unknown as Record<string, unknown>;
  const summary = held["summary"];
  const meaning = held["meaning"];
  return {
    summary: typeof summary === "string" ? summary : undefined,
    meaning: typeof meaning === "string" ? meaning : undefined,
    remedies: listed(held["remedies"]).filter(isRemedy),
  };
}

/** Whatever arrived where a list was expected, as a list. */
function listed(held: unknown): readonly unknown[] {
  return Array.isArray(held) ? (held as readonly unknown[]) : [];
}

/** Whether one thing in that list is a remedy. */
function isRemedy(held: unknown): held is Remedy {
  if (typeof held !== "object" || held === null) return false;
  const fields = held as Record<string, unknown>;
  return typeof fields["action"] === "string";
}
