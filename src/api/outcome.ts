/**
 * What a finished action's envelope came to, sorted by the kind it names.
 *
 * Work answered at once and work redeemed later both end in the envelope the
 * equivalent command renders, so both are read here, the one way. The generated
 * types are what know which payload goes with which kind, and a payload read
 * under the wrong one is fields with changed meanings — so an envelope naming a
 * kind nothing here reads is kept as unread rather than guessed at.
 */
import { isKind, type Envelope } from "@lemonfiber/sdk-ts";
import type { Came } from "../lib/came";

/**
 * What one envelope says a piece of work came to.
 *
 * Asked of each subject's kinds in turn, so the question for any one kind is a
 * single comparison and no list of them grows past what a reader takes in.
 */
export function outcomeOf(envelope: Envelope): Came {
  return (
    ofTheStack(envelope) ??
    ofTheChecks(envelope) ??
    ofWhatIsKept(envelope) ??
    ofTheHousehold(envelope) ??
    ofTheSettings(envelope) ?? { kind: "unread" }
  );
}

/**
 * Read an envelope about running the stack, or nothing where it is about
 * something else.
 */
function ofTheStack(envelope: Envelope): Came | undefined {
  if (isKind(envelope, "lifecycle")) {
    return { kind: "lifecycle", report: envelope.data };
  }
  if (isKind(envelope, "seed")) return { kind: "seed", report: envelope.data };
  if (isKind(envelope, "watch")) {
    return { kind: "watch", report: envelope.data };
  }
  if (isKind(envelope, "hosting")) {
    return { kind: "hosting", report: envelope.data };
  }
  return undefined;
}

/**
 * Read an envelope about the checks and repairs, or nothing where it is about
 * something else.
 */
function ofTheChecks(envelope: Envelope): Came | undefined {
  if (isKind(envelope, "doctor")) {
    return { kind: "doctor", report: envelope.data };
  }
  if (isKind(envelope, "repair")) {
    return { kind: "repair", report: envelope.data };
  }
  if (isKind(envelope, "undo")) return { kind: "undo", report: envelope.data };
  return undefined;
}

/**
 * Read an envelope about what is kept on this machine, or nothing where it is
 * about something else.
 */
function ofWhatIsKept(envelope: Envelope): Came | undefined {
  if (isKind(envelope, "backup")) {
    return { kind: "backup", report: envelope.data };
  }
  if (isKind(envelope, "restore")) {
    return { kind: "restore", report: envelope.data };
  }
  if (isKind(envelope, "bundle")) {
    return { kind: "bundle", report: envelope.data };
  }
  if (isKind(envelope, "stored")) {
    return { kind: "stored", report: envelope.data };
  }
  if (isKind(envelope, "uninstall")) {
    return { kind: "uninstall", report: envelope.data };
  }
  if (isKind(envelope, "stop-seeding")) {
    return { kind: "stop-seeding", report: envelope.data };
  }
  if (isKind(envelope, "space")) {
    return { kind: "space", report: envelope.data };
  }
  return undefined;
}

/**
 * Read an envelope about the household and what it asks for, or nothing where
 * it is about something else.
 */
function ofTheHousehold(envelope: Envelope): Came | undefined {
  if (isKind(envelope, "invitation")) {
    return { kind: "invitation", report: envelope.data };
  }
  if (isKind(envelope, "household")) {
    return { kind: "household", report: envelope.data };
  }
  if (isKind(envelope, "trace")) {
    return { kind: "trace", report: envelope.data };
  }
  if (isKind(envelope, "walkthrough")) {
    return { kind: "walkthrough", report: envelope.data };
  }
  return undefined;
}

/**
 * Read an envelope about the settings, or nothing where it is about something
 * else.
 */
function ofTheSettings(envelope: Envelope): Came | undefined {
  if (isKind(envelope, "quality")) {
    return { kind: "quality", report: envelope.data };
  }
  if (isKind(envelope, "upgrade")) {
    return { kind: "upgrade", report: envelope.data };
  }
  if (isKind(envelope, "config")) {
    return { kind: "config", report: envelope.data };
  }
  if (isKind(envelope, "pairing")) {
    return { kind: "pairing", report: envelope.data };
  }
  if (isKind(envelope, "bandwidth")) {
    return { kind: "bandwidth", report: envelope.data };
  }
  if (isKind(envelope, "pausing")) {
    return { kind: "pausing", report: envelope.data };
  }
  if (isKind(envelope, "update")) {
    return { kind: "update", report: envelope.data };
  }
  return undefined;
}
