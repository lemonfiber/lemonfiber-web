/**
 * Proving an installed plugin again and running one of its recipes by name,
 * in lines a reader can carry, and the proofs any act on a plugin asks.
 *
 * Asked bare, proving says what it would ask and what is kept against the
 * plugin, and asks nothing; a run says what the recipe would call and carry,
 * and runs nothing. Neither is marked a rehearsal by lemonfiber: a proof that
 * asked nothing and a recipe that ran nothing are the reading.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { said } from "./said";
import * as m from "../paraglide/messages.js";

/** What is installed, and what one act on a plugin came to. */
type Plugs = ByKind["plugins"]["data"];

/** What asking an installed plugin's adapters again came to. */
export type PluginReproof = NonNullable<Plugs["proof"]>;

/** What asking for one of a plugin's recipes by name came to. */
export type PluginDemand = NonNullable<Plugs["demand"]>;

/** One recipe, as a plugin's reading lists it. */
export type PluginRecipe = PluginDemand["recipe"];

/** One value a recipe asks the operator for when it runs. */
export type RecipeInput = NonNullable<PluginRecipe["inputs"]>[number];

/** One proof that has to hold. */
type PluginProving = PluginReproof["proofs"][number];

/** What asking one proof came to. */
type PluginVerdict = NonNullable<PluginProving["came_to"]>;

/** One answer kept against a plugin, which a pass clears. */
type Kept = PluginReproof["kept"][number];

/**
 * Whether a report is a reading: marked a rehearsal, a proof that asked
 * nothing, or a recipe that ran nothing.
 */
export function isReading(report: Plugs): boolean {
  if (report.rehearsed) return true;
  const { proof, demand } = report;
  if (proof !== undefined && proof !== null) return !proof.asked;
  if (demand !== undefined && demand !== null) {
    return demand.ran === undefined || demand.ran === null;
  }
  return false;
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
    case "open":
      return m.plug_proof_open({ proof, why: verdict.why });
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
export function proofLines(proof: PluginProving): readonly string[] {
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

/** One answer kept against a plugin, in a line. */
function keptLine(kept: Kept): string {
  return m.plug_kept({
    capability: kept.capability,
    operation: kept.operation,
    why: kept.why,
  });
}

/**
 * What proving again would ask, line by line: every proof, then every answer
 * kept against the plugin, which a pass clears, or that none is kept.
 */
export function reproofLines(proof: PluginReproof): readonly string[] {
  const lines = proof.proofs.flatMap((one) => proofLines(one));
  if (proof.proofs.length === 0) lines.push(m.plug_reproof_nothing());
  lines.push(...proof.kept.map((one) => keptLine(one)));
  if (proof.kept.length === 0) lines.push(m.plug_kept_none());
  return lines;
}

/**
 * What proving again came to, line by line: what each proof came to, then
 * whether what was kept against the plugin is cleared.
 */
export function reprovedLines(proof: PluginReproof): readonly string[] {
  const lines = proof.proofs.flatMap((one) => {
    const verdict = one.came_to;
    return verdict === undefined || verdict === null
      ? []
      : [verdictLine(one.proof, verdict)];
  });
  lines.push(
    proof.cleared
      ? m.plug_reproof_cleared({ plugin: proof.plugin })
      : m.plug_reproof_kept({ plugin: proof.plugin }),
  );
  return lines;
}

/** What running a recipe by name came to, or nothing where it ran nothing. */
export function demandedLines(
  demand: PluginDemand,
): readonly string[] | undefined {
  const { ran } = demand;
  if (ran === undefined || ran === null) return undefined;
  const recipe = demand.recipe.title;
  return [
    ran.held
      ? m.plug_recipe_held({ recipe })
      : m.plug_recipe_failed({ recipe, why: ran.why ?? "" }),
  ];
}

/** Every recipe of a plugin's that runs only when asked for by name. */
export function demandRecipes(
  recipes: readonly PluginRecipe[] | undefined,
): readonly PluginRecipe[] {
  return (recipes ?? []).filter((one) => one.on === "demand");
}

/**
 * Every value these recipes ask the operator for, once each by its name, in
 * the order they declare them.
 */
export function inputsOf(
  recipes: readonly PluginRecipe[],
): readonly RecipeInput[] {
  const seen = new Set<string>();
  return recipes
    .flatMap((recipe) => recipe.inputs ?? [])
    .filter((input) => {
      if (seen.has(input.name)) return false;
      seen.add(input.name);
      return true;
    });
}

/** Every recipe an install or an update runs, which is each not run by name. */
export function installRecipes(
  recipes: readonly PluginRecipe[] | undefined,
): readonly PluginRecipe[] {
  return (recipes ?? []).filter((one) => one.on !== "demand");
}

/** What each input was given, as the request carries it: `name=value`. */
export function inputsGiven(
  asked: readonly RecipeInput[],
  given: Readonly<Record<string, string>>,
): readonly string[] {
  return asked.map((input) => `${input.name}=${given[input.name] ?? ""}`);
}
