/**
 * Keeping a copy of the stack, putting one back, and gathering what somebody
 * helping would need, and how the asking reads.
 *
 * Three requests, each named as the command line names it. Taking a backup has
 * nothing to read first, so it is asked about before it is sent. Putting one
 * back is asked for twice: once by the archive's name alone, which changes
 * nothing and answers with what the archive holds and what restoring it would
 * overwrite, and then with the yes, which names the listing it was read in so
 * lemonfiber can refuse to spend it on one that has since moved on.
 *
 * A support bundle is described before it is written: what it would hold, how
 * large it would be and where it would go. Writing it sends the same terms the
 * description was read under, so what is written is what was read.
 *
 * The words live in `messages/`. What lemonfiber writes into a listing or a
 * bundle is its own and is passed through unchanged.
 */
import type { Arguments } from "../api/acting";
import { sameDoing, type Asker, type Family } from "./asker";
import type { Came } from "./came";
import type { Relocation } from "./kept";
import type { Question, Requested, Upkeep, Work } from "./work";
import * as m from "../paraglide/messages.js";

/** Every request the backups and support panels make. */
export const everyUpkeep: readonly Upkeep[] = ["backup", "restore", "support"];

/** Whether a record is of something the backups or support panel asked for. */
export function isUpkeep(doing: Requested): doing is Upkeep {
  const upkeep: readonly Requested[] = everyUpkeep;
  return upkeep.includes(doing);
}

/** How a support bundle is made: how much of the logs, and what is shown. */
export interface Terms {
  /** How many log lines are taken from each service. */
  readonly logs: number;
  /** Whether media filenames are shown rather than replaced. */
  readonly filenames: boolean;
}

/** One asking, with whatever it names. */
export type Keep =
  /** A backup of the whole stack. */
  | { readonly doing: "backup" }
  /** What an archive holds and what putting it back would overwrite. */
  | { readonly doing: "restore"; readonly archive: string }
  /** The archive put back, agreed to under the listing it was read in. */
  | {
      readonly doing: "restore";
      readonly archive: string;
      readonly offer: string;
      readonly repoint: boolean;
    }
  /** What a bundle made on these terms would hold, with nothing written. */
  | { readonly doing: "support"; readonly terms: Terms }
  /** The bundle written, on the terms it was described under. */
  | { readonly doing: "support"; readonly terms: Terms; readonly write: true };

/**
 * What to send for one asking.
 *
 * Each field is one the named action's command takes. A field it has nowhere
 * to put is refused rather than dropped, so nothing else goes with it.
 */
export function givenForKeep(keep: Keep): Arguments {
  switch (keep.doing) {
    case "backup":
      return {};
    case "restore":
      return "offer" in keep
        ? {
            archive: keep.archive,
            confirm: true,
            offer: keep.offer,
            repoint: keep.repoint,
          }
        : { archive: keep.archive };
    case "support":
      return {
        write: "write" in keep,
        logs: keep.terms.logs,
        filenames: keep.terms.filenames,
      };
  }
}

/**
 * What has to be agreed before an asking is sent, or nothing where what comes
 * back is the thing to read before agreeing, or is itself the agreeing.
 */
export function questionOfKeep(keep: Keep): Question | undefined {
  if (keep.doing !== "backup") return undefined;
  return {
    eyebrow: m.confirm_keep_eyebrow(),
    title: m.confirm_backup_title(),
    prose: m.confirm_backup_prose(),
    yes: m.action_backup_yes(),
  };
}

/**
 * Whether what a piece of work came to changed which backups there are.
 *
 * A backup written adds one and may prune older ones. A listing, a restore and
 * a bundle leave the list as it was.
 */
export function changedTheBackups(came: Came): boolean {
  return came.kind === "backup" && !came.report.rehearsed;
}

/** A standing listing, and the record it came back on. */
export interface Listing {
  /** The record, which is what putting the listing away puts away. */
  readonly id: string;
  /** The archive it is about, by the name it was written under. */
  readonly archive: string;
  /** What the listing named itself, which the agreement names back. */
  readonly agreement: string;
  /** Where the archive's data location differs from this machine's. */
  readonly relocation: Relocation | undefined;
}

/**
 * The listing standing on the screen, where one is.
 *
 * Only the newest restore counts. A listing asked for again replaces the one
 * before it, and one that has been answered — or is being answered — is no
 * longer a listing anybody can agree to.
 */
export function standingListing(work: readonly Work[]): Listing | undefined {
  const newest = work.find((one) => one.doing === "restore");
  if (newest?.at !== "done") return undefined;
  const { came, given } = newest;
  if (came.kind !== "restore" || given.archive === undefined) return undefined;
  if (came.report.done !== undefined && came.report.done !== null) {
    return undefined;
  }
  return {
    id: newest.id,
    archive: given.archive,
    agreement: came.report.would.agreement,
    relocation: came.report.would.relocation ?? undefined,
  };
}

/** A standing description of a bundle, and the record it came back on. */
export interface Described {
  /** The record, which is what putting the description away puts away. */
  readonly id: string;
  /** The terms it was described under, which writing it sends again. */
  readonly terms: Terms;
  /** Every file it would hold, by its name inside the bundle, in full. */
  readonly pieces: readonly { readonly name: string; readonly body: string }[];
}

/**
 * The description standing on the screen, where one is.
 *
 * Only the newest bundle counts, and only one that wrote nothing: a bundle
 * that has been written is an outcome, not a description.
 */
export function standingBundle(work: readonly Work[]): Described | undefined {
  const newest = work.find((one) => one.doing === "support");
  if (newest?.at !== "done") return undefined;
  const { came, given } = newest;
  if (came.kind !== "bundle" || given.write === true) return undefined;
  return {
    id: newest.id,
    terms: {
      logs: given.logs ?? LOG_LINES,
      filenames: given.filenames ?? false,
    },
    pieces: came.report.contents.pieces,
  };
}

/**
 * Where the newest bundle asked for was written, where it was written at all.
 *
 * Only the newest counts, because its record is the one on the screen, and
 * the one a reader pressing save means.
 */
export function writtenBundle(work: readonly Work[]): string | undefined {
  const newest = work.find((one) => one.doing === "support");
  if (newest?.at !== "done" || newest.came.kind !== "bundle") return undefined;
  return newest.came.report.path ?? undefined;
}

/** Handing a written bundle to the browser, to be saved. */
export interface Saver {
  /** Whether the bundle is being asked for, which silences the control. */
  readonly busy: boolean;
  /** Why the last one asked for was not handed over, where it was not. */
  readonly said: string | undefined;
  /** What saving the bundle written to this path asks for. */
  readonly onsave: (path: string) => void;
}

/** How many log lines a bundle takes from each service unless told otherwise. */
export const LOG_LINES = 200;

/**
 * A count of log lines as typed, or nothing where what was typed is not one.
 *
 * A count is a whole number above nothing. Anything else would be sent as a
 * request lemonfiber has to refuse for a reason already visible here.
 */
export function linesTyped(typed: string): number | undefined {
  const trimmed = typed.trim();
  if (!/^\d+$/u.test(trimmed)) return undefined;
  const count = Number(trimmed);
  return count > 0 && Number.isSafeInteger(count) ? count : undefined;
}

/** How the backups and support panels' requests are asked for. */
export const upkeep: Family<Keep> = {
  owns: isUpkeep,
  question: questionOfKeep,
  given: givenForKeep,
  same: sameDoing,
};

/**
 * Everything the backups and support panels are given to act with, and what
 * pressing their controls asks for.
 */
export type Keeper = Asker<Keep>;
