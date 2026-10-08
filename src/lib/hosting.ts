/**
 * What this machine keeps running when no terminal is open, and how the
 * asking reads.
 *
 * Two requests, each named as the command line names it, and each about one
 * of the long-running commands the reading lists, by lemonfiber's own name for
 * it. Installing hands one to the machine's service manager and starts it;
 * removing takes it back off. The reading is what is read before either: what
 * each one does for as long as it runs, the command it runs, and where it
 * stands. Neither answers with anything to read first, and both change the
 * machine, so each is asked about before it is sent.
 *
 * The guard on the data location is the one that is started against forms,
 * and it is given the forms chosen on the overview. lemonfiber refuses to
 * install it over none.
 */
import type { Arguments } from "../api/acting";
import type { Asker, Family } from "./asker";
import type { Came } from "./came";
import type { Hosted } from "./removed";
import type { Hosting, Question, Requested } from "./work";
import { listed } from "./listed";
import * as m from "../paraglide/messages.js";

/** Every request the hosting panel makes. */
export const everyHosting: readonly Hosting[] = [
  "hosting-install",
  "hosting-remove",
];

/** Whether a record is of something the hosting panel asked for. */
export function isHosting(doing: Requested): doing is Hosting {
  const hosting: readonly Requested[] = everyHosting;
  return hosting.includes(doing);
}

/** One long-running command, as the reading lists it. */
export type Command = Hosted["commands"][number];

/** lemonfiber's name for the one command that is started against forms. */
export const GUARD = "watch";

/** Whether a command is started against the forms it is given. */
export function guardsForms(command: Command): boolean {
  return command.name === GUARD;
}

/**
 * What can be asked of a command where it stands: keeping one that is not
 * kept, taking back one that is installed in any state, and nothing for one
 * this machine's service manager cannot keep or one standing somewhere this
 * page has no word for.
 */
export function actOf(command: Command): Hosting | undefined {
  switch (command.standing) {
    case "not-hosted":
      return "hosting-install";
    case "hosted":
    case "installed-unverified":
    case "stopped":
    case "orphaned":
      return "hosting-remove";
    case "unsupported":
      return undefined;
    default:
      return undefined;
  }
}

/** One asking, about one command. */
export type Host =
  /** The command handed to the machine, against the forms given where it takes them. */
  | {
      readonly doing: "hosting-install";
      readonly command: Command;
      readonly forms: readonly string[];
    }
  /** The command taken back off the machine. */
  | { readonly doing: "hosting-remove"; readonly command: Command };

/** What to send for one asking. */
export function givenForHost(host: Host): Arguments {
  const kept = { kept: host.command.name };
  if (host.doing === "hosting-remove" || !guardsForms(host.command)) {
    return kept;
  }
  return { ...kept, forms: [...host.forms] };
}

/**
 * What has to be agreed before an asking is sent: the command, what it does
 * while it runs, and, for the guard, the forms it guards.
 */
export function questionOfHost(host: Host): Question {
  const { name, guarantees, command } = host.command;
  if (host.doing === "hosting-remove") {
    return {
      eyebrow: m.confirm_mend_eyebrow(),
      title: m.confirm_unhost_title({ name }),
      prose: m.confirm_unhost_prose({ guarantees }),
      yes: m.action_unhost_yes(),
    };
  }
  return {
    eyebrow: m.confirm_mend_eyebrow(),
    title: m.confirm_host_title({ name }),
    prose: guardsForms(host.command)
      ? m.confirm_host_prose_forms({
          guarantees,
          command,
          forms: listed(host.forms),
        })
      : m.confirm_host_prose({ guarantees, command }),
    yes: m.action_host_yes(),
  };
}

/**
 * Whether two askings are the same request about the same command with the
 * same forms. A yes to keeping one running is no yes to another, and a guard
 * over other forms is a different guard.
 */
export function sameHost(one: Host | undefined, other: Host): boolean {
  if (one?.doing !== other.doing) return false;
  return (
    JSON.stringify(givenForHost(one)) === JSON.stringify(givenForHost(other))
  );
}

/** How the hosting panel's requests are asked for. */
export const hosting: Family<Host> = {
  owns: isHosting,
  question: questionOfHost,
  given: givenForHost,
  same: sameHost,
};

/**
 * Whether what a piece of work came to changed what this machine keeps
 * running, which is what the hosting panel draws. A rehearsal changed nothing.
 */
export function changedTheHosting(came: Came): boolean {
  return (
    came.kind === "hosting" &&
    came.report.changed !== undefined &&
    came.report.changed !== null &&
    !came.report.changed.rehearsed
  );
}

/**
 * Everything the hosting panel is given to act with, and what pressing its
 * controls asks for.
 */
export type Hoster = Asker<Host>;
