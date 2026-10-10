/**
 * What installing, updating or removing a plugin would come to, or came to,
 * in lines a reader can carry.
 *
 * A reading is drawn whole before its yes: what the plugin would write, what
 * it and its recipes would reach, what has to be proved before it counts as
 * installed and what the stack's own checks then make of it, and every value a
 * recipe would carry elsewhere, a released one with the service it was read
 * from and why it leaves. An update is read as one account and a removal says
 * what stops and what it leaves unfilled before either happens.
 *
 * What lemonfiber writes into a report is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { listed } from "./listed";
import { installedLines } from "./plugins";
import type { Plugging } from "./requested";
import { undoLines } from "./undone";
import * as m from "../paraglide/messages.js";

/** What is installed, and what one act on a plugin came to. */
export type Plugs = ByKind["plugins"]["data"];

/** What an install would come to, or came to. */
export type PluginInstall = NonNullable<Plugs["install"]>;

/** What an update would come to, or came to, as one account. */
export type PluginUpdate = NonNullable<Plugs["update"]>;

/** What a removal would come to, or came to. */
export type PluginRemoval = NonNullable<Plugs["removal"]>;

/** One plugin's install, as it was decided. */
type Would = PluginInstall["would"];

/** One recipe, as an operator agrees to what it does. */
export type PluginRecipe = NonNullable<Would["recipes"]>[number];

/** One value a recipe could carry to one destination. */
export type PluginPair = PluginRecipe["pairs"][number];

/** One call a recipe makes. */
type PluginStep = PluginRecipe["steps"][number];

/** One proof that has to hold before a plugin counts as installed. */
type PluginProving = PluginInstall["proofs"][number];

/** What asking one proof came to. */
type PluginVerdict = NonNullable<PluginProving["came_to"]>;

/** One change installing a plugin makes to the machine. */
type PluginChange = PluginInstall["changes"][number];

/** How one placed service is reached. */
type PluginReached = NonNullable<Would["services"][number]["reached"]>;

/** What a record of something the plugins panel asked for is headed. */
export function titleOfPlug(doing: Plugging): string {
  switch (doing) {
    case "plugin-install":
      return m.doing_plug_install_title();
    case "plugin-update":
      return m.doing_plug_update_title();
    case "plugin-remove":
      return m.doing_plug_remove_title();
  }
}

/** A value a report may leave out, kept where it says something. */
function said(value: string | null | undefined): value is string {
  return value !== undefined && value !== null && value !== "";
}

/** One change an install makes, in a line naming where it lands. */
function changeLine(change: PluginChange): string {
  const { path } = change;
  switch (change.puts) {
    case "directory":
      return m.plug_writes_directory({ path });
    case "document":
      return m.plug_writes_document({ path });
    case "key":
      return m.plug_writes_key({ path });
    case "region":
      return m.plug_writes_region({ path });
    default:
      return m.plug_writes_other({ path });
  }
}

/**
 * What an install would write, line by line: every change in the order it is
 * made, every bundled setting it changes and why, and every ask it leaves
 * contested.
 */
export function writesLines(install: PluginInstall): readonly string[] {
  const lines = install.changes.map((change) => changeLine(change));
  for (const one of install.overrides) {
    lines.push(m.plug_overrides({ setting: one.setting, why: one.why }));
  }
  for (const one of install.contests) {
    lines.push(
      m.plug_contests({
        capability: one.capability,
        by: one.by,
        claimants: listed(one.claimants),
      }),
    );
  }
  if (lines.length === 0) lines.push(m.plug_writes_nothing());
  return lines;
}

/** How one placed service is reached, in a line. */
function reachedLine(service: string, reached: PluginReached): string {
  const port = String(reached.port);
  return reached.tier === "household"
    ? m.plug_reached_household({ service, hostname: reached.hostname, port })
    : m.plug_reached_loopback({ service, port });
}

/**
 * What an install would reach, line by line: how each service it places is
 * reached, every destination outside the stack a recipe could reach, and every
 * credential it says it will hold.
 */
export function reachesLines(install: PluginInstall): readonly string[] {
  const { would } = install;
  const lines: string[] = [];
  for (const placed of would.services) {
    const { reached } = placed;
    lines.push(
      reached === undefined || reached === null
        ? m.plug_reached_none({ service: placed.service })
        : reachedLine(placed.service, reached),
    );
  }
  const declared = would.declared;
  const reaches = declared?.reaches ?? [];
  lines.push(
    reaches.length === 0
      ? m.plug_reaches_nothing()
      : m.plug_reaches({ destinations: listed(reaches) }),
  );
  for (const secret of declared?.secrets ?? []) {
    lines.push(
      m.plug_secret({ id: secret.id, of: secret.of, why: secret.why }),
    );
  }
  return lines;
}

/** What asking one proof came to, in a line. */
function verdictLine(proof: string, verdict: PluginVerdict): string {
  switch (verdict.outcome) {
    case "passed":
      return m.plug_proof_passed({ proof });
    case "failed":
      return m.plug_proof_failed({ proof, faults: verdict.faults.join(" ") });
    case "unproven":
      return m.plug_proof_unproven({ proof, why: verdict.why });
    case "failing-as-declared":
      return m.plug_proof_declared({
        proof,
        count: verdict.declared.length,
      });
    default:
      return m.plug_proof_other({ proof });
  }
}

/** One proof, in lines: what it asks and establishes, and what it came to. */
function proofLines(proof: PluginProving): readonly string[] {
  const of = said(proof.of) ? proof.of : undefined;
  const lines = [
    of === undefined
      ? m.plug_proof({ proof: proof.proof, asks: proof.asks })
      : m.plug_proof_of({ proof: proof.proof, asks: proof.asks, of }),
    proof.establishes,
    proof.why,
  ];
  const verdict = proof.came_to;
  if (verdict !== undefined && verdict !== null) {
    lines.push(verdictLine(proof.proof, verdict));
  }
  return lines;
}

/**
 * How an install is verified, line by line: every proof that has to hold
 * before it counts as installed, and what the stack's own checks made of it,
 * or that they are made once it is installed.
 */
export function verificationLines(install: PluginInstall): readonly string[] {
  const lines = install.proofs.flatMap((proof) => proofLines(proof));
  if (install.proofs.length === 0) lines.push(m.plug_proofs_none());
  const evidence = install.against;
  if (evidence === "recordings") lines.push(m.plug_against_recordings());
  if (evidence === "service") lines.push(m.plug_against_service());
  const { verified } = install;
  if (verified === undefined || verified === null) {
    lines.push(m.plug_verified_after());
    return lines;
  }
  for (const one of verified.broke) {
    lines.push(m.plug_broke({ title: one.now.title }));
  }
  for (const one of verified.unsettled) {
    lines.push(m.plug_unsettled({ title: one.now.title }));
  }
  if (verified.broke.length + verified.unsettled.length === 0) {
    lines.push(m.plug_verified_clean());
  }
  return lines;
}

/** One call a recipe makes, in a line. */
function stepLine(step: PluginStep): string {
  const said = { method: step.method, path: step.path, to: step.to };
  const { adapter } = step;
  return adapter === undefined || adapter === null
    ? m.plug_step_outside(said)
    : m.plug_step({ ...said, adapter: adapter.kind });
}

/**
 * One value a recipe could carry, in lines: where it goes, whose it is, and
 * for a released value the service it was read from and why it leaves.
 */
export function pairLines(pair: PluginPair): readonly string[] {
  const where = { value: pair.value, to: pair.to };
  const lines = [
    said(pair.origin)
      ? m.plug_pair({ ...where, origin: pair.origin })
      : m.plug_pair_unowned(where),
  ];
  const { release, from } = pair;
  if (release !== undefined) {
    lines.push(
      from === undefined
        ? m.plug_release({ value: pair.value, release })
        : m.plug_release_from({ value: pair.value, from, release }),
    );
  }
  if (pair.approval !== undefined) {
    lines.push(m.plug_approval({ approval: pair.approval }));
  }
  return lines;
}

/** One recipe, in lines: what it does and why, and every call it makes. */
export function recipeLines(recipe: PluginRecipe): readonly string[] {
  return [
    recipe.why,
    ...recipe.steps.map((step) => stepLine(step)),
    ...(recipe.pairs.length === 0 ? [m.plug_pairs_none()] : []),
  ];
}

/**
 * What the plugin is, as its reading names it: what it does, its version,
 * where it comes from and what vouches for it, what it runs and fills, and
 * what it declares about itself.
 */
export function describedLines(install: PluginInstall): readonly string[] {
  const { would } = install;
  const lines = [...installedLines(would, [])];
  const declared = would.declared;
  if (declared === undefined) return lines;
  if (said(declared.license)) {
    lines.push(m.plug_license({ license: declared.license }));
  }
  if (said(declared.upstream)) {
    lines.push(m.plug_upstream({ upstream: declared.upstream }));
  }
  if (declared.reviewed !== undefined) {
    lines.push(declared.reviewed ? m.plug_reviewed() : m.plug_reviewed_not());
  }
  const claims = declared.claims ?? [];
  if (claims.length > 0) lines.push(m.plug_claims({ claims: listed(claims) }));
  return lines;
}

/** What stops while it runs, in a line. */
function interruptsLine(interrupts: readonly string[]): string {
  return interrupts.length === 0
    ? m.plug_interrupts_none()
    : m.plug_interrupts({ services: listed(interrupts) });
}

/**
 * What an update would come to beyond the new version's own install: the
 * versions on either side, what stops, and what putting the old version's
 * changes back would come to.
 */
export function updateLines(update: PluginUpdate): readonly string[] {
  return [
    m.plug_update({ plugin: update.plugin, from: update.from, to: update.to }),
    interruptsLine(update.interrupts),
    ...undoLines(update.went_back),
  ];
}

/**
 * What a removal would come to: what stops, every capability it leaves with
 * nothing filling it, and what putting its changes back would come to.
 */
export function removalLines(removal: PluginRemoval): readonly string[] {
  return [
    interruptsLine(removal.interrupts),
    ...removal.leaves.map((one) =>
      m.plug_leaves({ capability: one.capability, plugin: one.filled_by }),
    ),
    ...undoLines(removal.went_back),
  ];
}

/** What an install that ran came to, line by line. */
function installedOutcome(install: PluginInstall): readonly string[] {
  const { would } = install;
  const lines: string[] = [
    install.recorded
      ? m.plug_installed({ plugin: would.plugin, version: would.version })
      : m.plug_installed_not({ plugin: would.plugin }),
  ];
  for (const ran of install.recipes_ran) {
    lines.push(
      ran.held
        ? m.plug_recipe_held({ recipe: ran.recipe })
        : m.plug_recipe_failed({ recipe: ran.recipe, why: ran.why ?? "" }),
    );
  }
  for (const one of install.verified?.broke ?? []) {
    lines.push(m.plug_broke({ title: one.now.title }));
  }
  const { reversed } = install;
  if (reversed !== undefined && reversed !== null) {
    lines.push(...undoLines(reversed));
  }
  return lines;
}

/** What an update that ran came to, line by line. */
function updatedOutcome(update: PluginUpdate): readonly string[] {
  const lines: string[] = [
    update.install.recorded
      ? m.plug_updated({ plugin: update.plugin, to: update.to })
      : m.plug_updated_not({ plugin: update.plugin, from: update.from }),
  ];
  if (said(update.stopped)) lines.push(update.stopped);
  const { restored } = update;
  if (restored !== undefined && restored !== null) {
    lines.push(
      restored.running
        ? m.plug_restored({ version: restored.version })
        : m.plug_restored_stopped({ version: restored.version }),
    );
  }
  return lines;
}

/**
 * What a record of an act on a plugin says it came to, line by line. A
 * reading says it wrote nothing and names itself; the reading is drawn whole
 * beside its yes.
 */
export function pluggedLines(report: Plugs): readonly string[] {
  if (report.rehearsed) {
    const offer = report.agreement ?? "";
    return [
      m.came_rehearsed(),
      ...(offer === "" ? [] : [m.plug_offer_named({ offer })]),
    ];
  }
  const { install, update, removal } = report;
  if (update !== undefined && update !== null) return updatedOutcome(update);
  if (install !== undefined && install !== null) {
    return installedOutcome(install);
  }
  if (removal !== undefined && removal !== null) {
    return [
      removal.removed
        ? m.plug_removed({ plugin: removal.plugin })
        : m.plug_removed_not({ plugin: removal.plugin }),
      ...undoLines(removal.went_back),
    ];
  }
  return [m.plug_count({ count: report.installed.length })];
}
