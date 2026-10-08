/**
 * This copy of lemonfiber: the versions in play, and where it stands against
 * the newest release, in lines a reader can carry.
 *
 * Two readings. One names the running binary, the stack it operates, what the
 * container engine reports and the manifest generations it reads. The other
 * says whether a newer release is out, how this copy got onto the machine, and
 * exactly what to type to move it, where there is something exact to type, or
 * why not. Moving it is the terminal's: the tool that owns the copy does it,
 * and nothing here does.
 *
 * What lemonfiber writes into either reading is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { listed } from "./listed";
import * as m from "../paraglide/messages.js";

/** The versions in play. */
export type Versions = ByKind["version"]["data"];

/** Where this copy stands against the newest release. */
export type Standing = ByKind["self-update"]["data"];

/** The versions in play, line by line. */
export function versionLines(versions: Versions): readonly string[] {
  const { compose } = versions;
  return [
    m.copy_binary({ version: versions.binary }),
    m.copy_stack({ version: versions.stack }),
    compose === undefined || compose === null
      ? m.copy_engine_unasked()
      : m.copy_engine({ version: compose }),
    m.copy_schemas({ schemas: listed(versions.supported_schema.map(String)) }),
  ];
}

/** Where this copy stands, in a sentence. */
function standingLine(standing: Standing): string {
  switch (standing.standing) {
    case "current":
      return m.copy_current({ version: standing.running });
    case "update-available":
      return m.copy_available({
        version: standing.running,
        offered: standing.offered ?? m.copy_offered_unnamed(),
      });
    case "managed-externally":
      return m.copy_managed({
        version: standing.running,
        owner: standing.owner ?? m.copy_owner_unnamed(),
      });
    case "check-failed":
      return m.copy_untold({
        version: standing.running,
        why: standing.untold ?? m.copy_untold_unsaid(),
      });
    default:
      return m.copy_standing_other({ version: standing.running });
  }
}

/** How this copy got onto the machine, in a sentence. */
export function installedLine(installed: Standing["installed"]): string {
  switch (installed) {
    case "homebrew":
      return m.copy_installed_by({ tool: "Homebrew" });
    case "scoop":
      return m.copy_installed_by({ tool: "Scoop" });
    case "winget":
      return m.copy_installed_by({ tool: "winget" });
    case "cargo":
      return m.copy_installed_by({ tool: "cargo" });
    case "distribution":
      return m.copy_installed_distribution();
    case "installer":
      return m.copy_installed_installer();
    case "image":
      return m.copy_installed_image();
    case "elsewhere":
      return m.copy_installed_elsewhere();
    case "untellable":
      return m.copy_installed_untellable();
    default:
      return m.copy_installed_other();
  }
}

/** Where this copy stands and what moving it takes, line by line. */
export function standingLines(standing: Standing): readonly string[] {
  const lines = [standingLine(standing), installedLine(standing.installed)];
  const { at, command, instead, changed } = standing;
  if (at !== undefined && at !== null) lines.push(m.copy_at({ at }));
  if (command !== undefined && command !== null) {
    lines.push(m.copy_command({ command }));
  }
  if (instead !== undefined && instead !== null) lines.push(instead);
  if (changed !== undefined && changed !== null) lines.push(changed);
  lines.push(standing.carries, standing.afterwards);
  return lines;
}
