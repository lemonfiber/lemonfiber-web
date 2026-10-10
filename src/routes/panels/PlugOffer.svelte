<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Switch from "../../components/Switch.svelte";
  import {
    describedLines,
    pairLines,
    reachesLines,
    recipeLines,
    removalLines,
    takingLines,
    updateLines,
    verificationLines,
    writesLines,
  } from "../../lib/plugged";
  import {
    approvables,
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

  const install = $derived(installOf(offered));
  const asked = $derived(install === undefined ? [] : approvables(install));

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
    if (install !== undefined) {
      drawn.push(
        { title: m.plug_section_plugin(), lines: describedLines(install) },
        { title: m.plug_section_writes(), lines: writesLines(install) },
        { title: m.plug_section_reaches(), lines: reachesLines(install) },
        { title: m.plug_section_verified(), lines: verificationLines(install) },
      );
    }
    return drawn;
  });

  /** Approve one value, or take the approval back. */
  function flip(approval: string): void {
    approved = approved.includes(approval)
      ? approved.filter((one) => one !== approval)
      : [...approved, approval];
  }

  /** Agree to the reading as it was read. */
  function agree(): void {
    const { offer } = offered;
    if (offered.doing === "plugin-install") {
      onyes({ doing: offered.doing, source: offered.source, offer, approved });
    } else if (offered.doing === "plugin-update") {
      onyes({ doing: offered.doing, plugin: offered.plugin, offer, approved });
    } else {
      onyes({ doing: offered.doing, plugin: offered.plugin, offer });
    }
  }

  const yes = $derived(
    offered.doing === "plugin-install"
      ? m.action_plug_install_yes({ offer: offered.offer })
      : offered.doing === "plugin-update"
        ? m.action_plug_update_yes({ offer: offered.offer })
        : m.action_plug_remove_yes({ offer: offered.offer }),
  );
</script>

<!--
  A reading, drawn whole before its yes: for an update or a removal what stops
  and what goes back first, then what the plugin is, everything it would write,
  everywhere it and its recipes would reach, how it is proved and checked, and
  every recipe with each call it makes and each value it could carry, and every
  privileged shape a service of it would take. A value that would leave the
  machine or the service it was read from, and a privileged shape, is each
  approved on its own switch, so agreeing to the plugin is never agreeing to
  what it sends or to what it is given.
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

  {#if install !== undefined}
    <div class="part">
      <h4>{m.plug_section_recipes()}</h4>
      {#each install.would.recipes ?? [] as recipe (recipe.id)}
        <div class="recipe">
          <h5>{recipe.title}</h5>
          <ul class="lines">
            {#each recipeLines(recipe) as line, at (at)}
              <li><Said text={line} /></li>
            {/each}
          </ul>
          <ul class="pairs">
            {#each recipe.pairs as pair, at (at)}
              <li>
                <ul class="lines">
                  {#each pairLines(pair) as line, place (place)}
                    <li><Said text={line} /></li>
                  {/each}
                </ul>
                {#if pair.approval !== undefined}
                  {@const approval = pair.approval}
                  <Switch
                    on={approved.includes(approval)}
                    label={m.plug_approve({ approval })}
                    onclick={() => {
                      flip(approval);
                    }}
                  />
                {/if}
              </li>
            {/each}
          </ul>
        </div>
      {:else}
        <p class="prose"><Said text={m.plug_recipes_none()} /></p>
      {/each}
    </div>

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
    <Action label={yes} weight="firm" off={busy} onclick={agree} />
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
  h4,
  h5 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }

  h5 {
    font-weight: 500;
  }

  .part,
  .recipe {
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
