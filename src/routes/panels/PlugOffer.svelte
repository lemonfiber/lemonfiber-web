<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Switch from "../../components/Switch.svelte";
  import {
    describedLines,
    grantingLine,
    reachesLines,
    removalLines,
    takingLines,
    updateLines,
    verificationLines,
    writesLines,
  } from "../../lib/plugged";
  import { unvettedLines } from "../../lib/unvetted";
  import {
    inputsGiven,
    inputsOf,
    installRecipes,
    reproofLines,
  } from "../../lib/proving";
  import PlugInputs from "./PlugInputs.svelte";
  import PlugRecipes from "./PlugRecipes.svelte";
  import { heldLines } from "../../lib/waiting";
  import {
    approvables,
    carriedBy,
    installOf,
    type Offered,
    type Plug,
  } from "../../lib/plugging";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** The reading standing for a yes. */
    offered: Offered;
    /** Whether asking is under way, which silences the yes. */
    busy: boolean;
    /** Agree to the reading, carrying its name and each value approved. */
    onyes: (plug: Plug) => void;
    /** Put the reading away without agreeing to it. */
    onleave: () => void;
  }

  let { offered, busy, onyes, onleave }: Props = $props();

  const titleId = $props.id();

  /** Every value approved so far, as its reading writes the approval. */
  let approved = $state<readonly string[]>([]);

  /** What has been typed for each input the reading asks, by its name. */
  let given = $state<Readonly<Record<string, string>>>({});

  const install = $derived(installOf(offered));
  const demanded = $derived(
    offered.doing === "plugin-run" ? offered.demand.recipe : undefined,
  );
  const recipes = $derived(
    demanded === undefined ? install?.would.recipes : [demanded],
  );
  const reads = $derived(demanded !== undefined || install !== undefined);
  const asked = $derived.by(() => {
    if (demanded !== undefined) return carriedBy(demanded);
    return install === undefined ? [] : approvables(install);
  });
  const inputs = $derived(
    demanded === undefined
      ? inputsOf(installRecipes(install?.would.recipes))
      : inputsOf([demanded]),
  );
  const answered = $derived(
    inputs.every((input) => (given[input.name] ?? "") !== ""),
  );

  /** The sections of the reading, each with its heading, in reading order. */
  const sections = $derived.by(() => {
    const drawn: { title: string; lines: readonly string[] }[] = [];
    if (offered.doing === "plugin-update") {
      drawn.push({
        title: m.plug_section_update(),
        lines: updateLines(offered.update),
      });
    }
    if (offered.doing === "plugin-remove") {
      drawn.push({
        title: m.plug_section_removal(),
        lines: removalLines(offered.removal),
      });
    }
    if (offered.doing === "plugin-prove") {
      drawn.push({
        title: m.plug_section_proving(),
        lines: reproofLines(offered.proof),
      });
    }
    if (install !== undefined) {
      drawn.push(
        { title: m.plug_section_plugin(), lines: describedLines(install) },
        { title: m.plug_section_writes(), lines: writesLines(install) },
        { title: m.plug_section_reaches(), lines: reachesLines(install) },
        { title: m.plug_section_verified(), lines: verificationLines(install) },
      );
      if (install.waiting.length > 0) {
        drawn.push({
          title: m.waits_title(),
          lines: heldLines(install.waiting),
        });
      }
    }
    const overlay = unvettedLines(offered.unvetted);
    if (overlay.length > 0) {
      drawn.push({ title: m.overlay_title(), lines: overlay });
    }
    return drawn;
  });

  /** Approve one value, or take the approval back. */
  function flip(approval: string): void {
    approved = approved.includes(approval)
      ? approved.filter((one) => one !== approval)
      : [...approved, approval];
  }

  /** The yes this reading is answered with, carrying what was typed for its inputs. */
  function yesTo(sent: readonly string[]): Plug {
    const { offer } = offered;
    const agreed =
      sent.length === 0
        ? { offer, approved }
        : { offer, approved, inputs: sent };
    switch (offered.doing) {
      case "plugin-install":
        return { doing: offered.doing, source: offered.source, ...agreed };
      case "plugin-update":
        return {
          doing: offered.doing,
          plugin: offered.plugin,
          source: offered.source,
          ...agreed,
        };
      case "plugin-run":
        return {
          doing: offered.doing,
          plugin: offered.plugin,
          recipe: offered.demand.recipe.id,
          ...agreed,
        };
      case "plugin-remove":
      case "plugin-prove":
        return { doing: offered.doing, plugin: offered.plugin, offer };
    }
  }

  /** Agree to the reading as it was read, and forget what was typed for it. */
  function agree(): void {
    const sent = inputsGiven(inputs, given);
    given = {};
    onyes(yesTo(sent));
  }

  const YES = {
    "plugin-install": m.action_plug_install_yes,
    "plugin-update": m.action_plug_update_yes,
    "plugin-remove": m.action_plug_remove_yes,
    "plugin-prove": m.action_plug_prove_yes,
    "plugin-run": m.action_plug_run_yes,
  } as const;

  const yes = $derived(YES[offered.doing]({ offer: offered.offer }));
</script>

<!--
  A reading, drawn whole before its yes: for an update or a removal what stops
  and what goes back first, then what the plugin is, everything it would write,
  everywhere it and its recipes would reach, how it is proved and checked, each
  service it would leave held back with what it waits for, and
  every recipe with each call it makes and each value it could carry, every
  privileged shape a service of it would take, and every credential of another
  service that would cross to it. A value that would leave the machine or the
  service it was read from, a privileged shape and a credential are each
  approved on a switch of their own, off until turned on, so agreeing to the
  plugin is never agreeing to what it sends or to what it is given.
  The yes names the reading it agrees to, and lemonfiber refuses it where what
  is there has moved since.
-->
<section class="offer" aria-labelledby={titleId}>
  <h3 id={titleId}>{m.plug_offer_title()}</h3>
  <p class="prose">
    <Said text={m.plug_offer_prose({ offer: offered.offer })} />
  </p>

  {#each sections as section (section.title)}
    <div class="part">
      <h4>{section.title}</h4>
      <ul class="lines">
        {#each section.lines as line, at (at)}
          <li><Said text={line} /></li>
        {/each}
      </ul>
    </div>
  {/each}

  {#if reads}
    <PlugRecipes recipes={recipes ?? []} {approved} onflip={flip} />
  {/if}

  {#if install !== undefined}
    <div class="part">
      <h4>{m.plug_section_taking()}</h4>
      {#if install.taking.length > 0}
        <ul class="pairs">
          {#each install.taking as taking (taking.approval)}
            <li>
              <ul class="lines">
                {#each takingLines(taking) as line, place (place)}
                  <li><Said text={line} /></li>
                {/each}
              </ul>
              <Switch
                on={approved.includes(taking.approval)}
                label={m.plug_approve({ approval: taking.approval })}
                onclick={() => {
                  flip(taking.approval);
                }}
              />
            </li>
          {/each}
        </ul>
      {:else}
        <p class="prose"><Said text={m.plug_taking_none()} /></p>
      {/if}
    </div>

    <div class="part">
      <h4>{m.plug_section_granting()}</h4>
      {#if install.granting.length > 0}
        <ul class="pairs">
          {#each install.granting as granting (granting.approval)}
            <li>
              <p class="prose"><Said text={grantingLine(granting)} /></p>
              <Switch
                on={approved.includes(granting.approval)}
                label={m.plug_approve({ approval: granting.approval })}
                onclick={() => {
                  flip(granting.approval);
                }}
              />
            </li>
          {/each}
        </ul>
      {:else}
        <p class="prose"><Said text={m.plug_granting_none()} /></p>
      {/if}
    </div>
  {/if}

  {#if inputs.length > 0}
    <PlugInputs
      {inputs}
      {given}
      ongive={(name: string, value: string) => {
        given = { ...given, [name]: value };
      }}
    />
  {/if}

  {#if asked.length > 0}
    <p class="prose">
      {m.plug_approved_count({
        approved: approved.length,
        asked: asked.length,
      })}
    </p>
  {/if}

  <div class="acts">
    <Action label={yes} weight="firm" off={busy || !answered} onclick={agree} />
    <Action label={m.action_leave_as_is()} onclick={onleave} />
  </div>
</section>

<style>
  .offer {
    display: grid;
    gap: var(--sp-3);
    padding: var(--sp-4) var(--panel-pad);
    border-bottom: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  h3,
  h4 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }

  .part {
    display: grid;
    gap: var(--sp-2);
  }

  .lines,
  .pairs {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .pairs > li {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-3);
    align-items: start;
    justify-content: space-between;
  }

  .lines li,
  .prose {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
