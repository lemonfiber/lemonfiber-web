/**
 * First-run setup, as the web console walks it: which screen a stack opens
 * on, what each step says and asks, and what an answer sends.
 *
 * lemonfiber keeps the walk. Every step answers with where setup now stands,
 * read off the progress it keeps on the machine, so a reload, a second tab or
 * a run begun in a terminal all land on the same step. What was answered never
 * comes back, and no credential is ever shown again.
 *
 * A step that only informs says what it is for and claims no finding:
 * lemonfiber does not yet report what such a step found.
 *
 * What lemonfiber writes into a report is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type {
  ByKind,
  Choice,
  Reading,
  SetupAnswerBody,
} from "@lemonfiber/sdk-ts";
import { originWords } from "./configured";
import * as m from "../paraglide/messages.js";

/** Where setup stands, and what it is still asking for. */
export type Wizard = ByKind["wizard"]["data"];

/** One step of setup. */
export type WizardStep = Wizard["at"];

/** What proving a credential just given came to. */
export type Proof = NonNullable<Wizard["proof"]>;

/** One setting apply will write, as it is safe to show. */
export type Planned = Wizard["plan"][number];

/** One answer, tagged by the question it belongs to. */
export type Answer = SetupAnswerBody;

/** One way out of an apply that stopped part-way. */
export type Recovery = Choice;

/** The two steps whose answer is a credential proven as it is given. */
export type Proving = "credentials" | "provider";

/** Every step, in the order the operator meets it. */
export const everyStep: readonly WizardStep[] = [
  "welcome",
  "preflight",
  "prerequisites",
  "protocols",
  "vpn",
  "data-location",
  "credentials",
  "provider",
  "service-user",
  "library",
  "household",
  "notifications",
  "autostart",
  "review",
];

/** Every way out of an apply that stopped part-way, safest first. */
export const everyRecovery: readonly Recovery[] = [
  "resume",
  "roll-back",
  "start-over",
];

/** One request a step makes of setup. */
export type Move =
  /** On past a step that only informs. */
  | { readonly move: "next" }
  /** Back to the question before. */
  | { readonly move: "back" }
  /** One answer to the question setup is on. */
  | { readonly move: "answer"; readonly answer: Answer }
  /** The reviewed answers written. */
  | { readonly move: "apply" }
  /** One way out of an apply that stopped part-way. */
  | { readonly move: "recover"; readonly choice: Recovery };

/** What the operator's page opens on. */
export type Entry =
  /** Nothing has answered yet. */
  | "waiting"
  /** The console, for a machine that is set up. */
  | "console"
  /** The wizard, on the step setup is on. */
  | "wizard"
  /** The recovery screen, for an apply that stopped part-way. */
  | "recovery"
  /** The answer could not be read, so nothing is drawn over it. */
  | "unknown";

/** Which screen a reading of where setup stands opens on. */
export function entryOf(read: Reading<Wizard> | undefined): Entry {
  if (read === undefined) return "waiting";
  if (!read.ok) return "unknown";
  const { offered, phase } = read.value;
  if (!offered) return "console";
  return phase === "applying" ? "recovery" : "wizard";
}

/** A step that asks a question, as against one that only informs. */
export type Asking = Exclude<
  WizardStep,
  "welcome" | "preflight" | "prerequisites" | "review"
>;

/** Whether a step asks a question, rather than being acknowledged. */
export function asks(step: WizardStep): step is Asking {
  return (
    step !== "welcome" &&
    step !== "preflight" &&
    step !== "prerequisites" &&
    step !== "review"
  );
}

/** What a step is called, in at most three words. */
export function titleOfStep(step: WizardStep): string {
  switch (step) {
    case "welcome":
      return m.wizard_welcome_title();
    case "preflight":
      return m.wizard_preflight_title();
    case "prerequisites":
      return m.wizard_prerequisites_title();
    case "protocols":
      return m.wizard_protocols_title();
    case "vpn":
      return m.wizard_vpn_title();
    case "data-location":
      return m.wizard_data_title();
    case "credentials":
      return m.wizard_credentials_title();
    case "provider":
      return m.wizard_provider_title();
    case "service-user":
      return m.wizard_user_title();
    case "library":
      return m.wizard_library_title();
    case "household":
      return m.wizard_household_title();
    case "notifications":
      return m.wizard_notifications_title();
    case "autostart":
      return m.wizard_autostart_title();
    case "review":
      return m.wizard_review_title();
  }
}

/** What a step is for, in a sentence or two. */
export function proseOfStep(step: WizardStep): string {
  switch (step) {
    case "welcome":
      return m.wizard_welcome_prose();
    case "preflight":
      return m.wizard_preflight_prose();
    case "prerequisites":
      return m.wizard_prerequisites_prose();
    case "protocols":
      return m.wizard_protocols_prose();
    case "vpn":
      return m.wizard_vpn_prose();
    case "data-location":
      return m.wizard_data_prose();
    case "credentials":
      return m.wizard_credentials_prose();
    case "provider":
      return m.wizard_provider_prose();
    case "service-user":
      return m.wizard_user_prose();
    case "library":
      return m.wizard_library_prose();
    case "household":
      return m.wizard_household_prose();
    case "notifications":
      return m.wizard_notifications_prose();
    case "autostart":
      return m.wizard_autostart_prose();
    case "review":
      return m.wizard_review_prose();
  }
}

/**
 * The steps still ahead, beginning with the one setup is on: every question
 * that applies on this machine and has no answer yet, then the review.
 */
export function stepsAhead(wizard: Wizard): readonly WizardStep[] {
  const ahead = new Set<WizardStep>([wizard.at, ...wizard.unanswered]);
  ahead.add("review");
  return everyStep.filter((step) => ahead.has(step));
}

/** What proving a credential came to, in a line naming whose it was. */
export function proofLine(proof: Proof, proving: Proving): string {
  const indexer = proving === "credentials";
  switch (proof.outcome) {
    case "valid":
      return indexer
        ? m.wizard_proof_indexer_valid({ observed: proof.observed })
        : m.wizard_proof_provider_valid({ observed: proof.observed });
    case "rejected":
      return indexer
        ? m.wizard_proof_indexer_rejected({ detail: proof.detail })
        : m.wizard_proof_provider_rejected({ detail: proof.detail });
    case "unreachable":
      return m.wizard_proof_unreachable({ detail: proof.detail });
    case "degraded":
      return m.wizard_proof_degraded({ detail: proof.detail });
    default:
      return m.wizard_proof_other();
  }
}

/** Whether a proof leaves the credential unproven, so entering it again is offered. */
export function unproven(proof: Proof): boolean {
  return proof.outcome !== "valid";
}

/** One setting apply will write, in a line: its name, its value and whose it is. */
export function plannedLine(setting: Planned): string {
  const said = { key: setting.key, origin: originWords(setting.origin) };
  return setting.secret
    ? m.wizard_planned_secret(said)
    : m.wizard_planned({ ...said, value: setting.value });
}

/** What a way out of an interrupted apply is called. */
export function titleOfRecovery(choice: Recovery): string {
  switch (choice) {
    case "resume":
      return m.action_wizard_resume();
    case "roll-back":
      return m.action_wizard_roll_back();
    case "start-over":
      return m.action_wizard_start_over();
  }
}

/** What a way out of an interrupted apply does, in a sentence. */
export function proseOfRecovery(choice: Recovery): string {
  switch (choice) {
    case "resume":
      return m.wizard_resume_prose();
    case "roll-back":
      return m.wizard_roll_back_prose();
    case "start-over":
      return m.wizard_start_over_prose();
  }
}

/** A path as a data folder takes it: absolute, trimmed, or nothing. */
export function folderTyped(typed: string): string | undefined {
  const path = typed.trim();
  return path.startsWith("/") && path.length > 1 ? path : undefined;
}

/** A whole number from `least` to `most` as typed, or nothing. */
export function wholeTyped(
  typed: string,
  least: number,
  most: number,
): number | undefined {
  const trimmed = typed.trim();
  if (!/^\d+$/.test(trimmed)) return undefined;
  const value = Number(trimmed);
  return value >= least && value <= most ? value : undefined;
}

/** The highest user or group number a container may run as. */
export const MOST_ID = 4_294_967_295;

/** The highest port number. */
export const MOST_PORT = 65_535;

/** The port a Usenet provider answers on over TLS, as most of them do. */
export const NNTP_TLS_PORT = 563;

/** How the library may be served, as setup offers it. */
export type Library = Extract<Answer, { library: unknown }>["library"];

/** How much the operator wants to be told. */
export type Appetite = Extract<
  Answer,
  { notifications: unknown }
>["notifications"];

/** Every way the library may be served, the one that serves nothing first. */
export const everyLibrary: readonly Library[] = [
  "none",
  "jellyfin-docker",
  "jellyfin-native",
];

/** Every amount the operator may be told, the quietest first. */
export const everyAppetite: readonly Appetite[] = [
  "problems-only",
  "with-completions",
  "everything",
];

/** The one of `every` a control's value names, or `kept` where it names none. */
export function chosenFrom<T extends string>(
  every: readonly T[],
  value: string,
  kept: T,
): T {
  return every.find((one) => one === value) ?? kept;
}

/** What a way of serving the library is called. */
export function wordOfLibrary(library: Library): string {
  switch (library) {
    case "none":
      return m.wizard_library_none();
    case "jellyfin-docker":
      return m.wizard_library_docker();
    case "jellyfin-native":
      return m.wizard_library_host();
  }
}

/** What an amount of telling is called. */
export function wordOfAppetite(appetite: Appetite): string {
  switch (appetite) {
    case "problems-only":
      return m.wizard_told_problems();
    case "with-completions":
      return m.wizard_told_completions();
    case "everything":
      return m.wizard_told_everything();
  }
}
