<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import Segmented from "../../components/Segmented.svelte";
  import Switch from "../../components/Switch.svelte";
  import { linesOf } from "../../lib/came";
  import { bytes } from "../../lib/figures";
  import type { Freshness } from "../../lib/freshness";
  import { everyTier, labelOfTier, type Tier } from "../../lib/removed";
  import {
    standingForget,
    standingRemoval,
    tierChosen,
    type Remover,
  } from "../../lib/removing";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What forgetting and removing ask for, and what came of each. */
    remover: Remover;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { remover, freshness }: Props = $props();

  const forgetId = $props.id();

  /** The region a row sits in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** Which removal is to be listed. */
  let tier = $state<Tier>("stop");

  /** Whether what is still coming down is let finish before anything goes. */
  let wait = $state(false);

  /** Put the reader where the row they were standing in was. */
  function landing(): void {
    asked.focus();
  }

  const forgetting = $derived(standingForget(remover.work));
  const survey = $derived(standingRemoval(remover.work));
  const parted = $derived(remover.work.length > 0);
</script>

<!--
  Forgetting what lemonfiber keeps, and taking it off this machine.

  Each is listed first: unconfirmed, it removes nothing and answers with what
  it would reach. The yes stands under that listing and is the same request,
  confirmed. A removal's listing names itself, and the yes carries that name,
  so lemonfiber removes what was read or refuses. Taking the media says what
  everything going comes to over its yes. Where something is still coming
  down, the yes carries whether it is let finish first.
-->
<Panel title={m.panel_removal()} {freshness} flush>
  <div class="scope">
    <p><Said text={m.removal_prose()} /></p>
  </div>

  <div class="controls">
    <Action
      label={m.action_forget_list()}
      off={remover.busy}
      onclick={() => {
        remover.onask({ doing: "forget" });
        landing();
      }}
    />
    <Segmented
      label={m.removal_tier()}
      options={everyTier.map((one) => ({
        value: one,
        label: labelOfTier(one),
      }))}
      selected={tier}
      onselect={(value: string) => {
        tier = tierChosen(value, tier);
      }}
    />
    <Action
      label={m.action_remove_list()}
      off={remover.busy}
      onclick={() => {
        remover.onask({ doing: "uninstall", tier });
        wait = false;
        landing();
      }}
    />
  </div>

  <div
    class="asked"
    class:parted
    role="status"
    aria-label={m.removal_asked()}
    tabindex="-1"
    bind:this={asked}
  >
    {#if forgetting !== undefined}
      <section class="plan" aria-labelledby={`${forgetId}-forget`}>
        <h3 id={`${forgetId}-forget`}>{m.forget_plan_title()}</h3>
        <p class="prose"><Said text={m.forget_plan_prose()} /></p>
        <div class="acts">
          <Action
            label={m.action_forget_yes()}
            weight="firm"
            off={remover.busy}
            onclick={() => {
              remover.onask({ doing: "forget", confirm: true });
              landing();
            }}
          />
          <Action
            label={m.action_leave_as_is()}
            onclick={() => {
              remover.ondrop(forgetting.id);
              landing();
            }}
          />
        </div>
      </section>
    {/if}

    {#if survey !== undefined}
      <section class="plan" aria-labelledby={`${forgetId}-remove`}>
        <h3 id={`${forgetId}-remove`}>
          {m.remove_plan_title({ tier: labelOfTier(survey.tier) })}
        </h3>
        <p class="prose"><Said text={m.remove_plan_prose()} /></p>
        {#if survey.tier === "media"}
          <p class="prose">
            {m.remove_media_prose({ size: bytes(survey.bytes) })}
          </p>
        {/if}
        {#if survey.coming.length > 0}
          <div class="choice">
            <p class="prose"><Said text={m.remove_wait()} /></p>
            <Switch
              on={wait}
              label={m.remove_wait()}
              onclick={() => {
                wait = !wait;
              }}
            />
          </div>
        {/if}
        <div class="acts">
          <Action
            label={m.action_remove_yes()}
            weight="firm"
            off={remover.busy}
            onclick={() => {
              remover.onask({
                doing: "uninstall",
                tier: survey.tier,
                offer: survey.offer,
                wait,
              });
              landing();
            }}
          />
          <Action
            label={m.action_leave_as_is()}
            onclick={() => {
              remover.ondrop(survey.id);
              landing();
            }}
          />
        </div>
      </section>
    {/if}

    {#each remover.work as one (one.id)}
      {@const said = readingOf(one)}
      {#snippet dropping()}
        <Action
          label={m.action_hide_record()}
          onclick={() => {
            remover.ondrop(one.id);
            landing();
          }}
        />
      {/snippet}
      <Item
        state={said.state}
        eyebrow={said.eyebrow}
        title={titleOfDoing(one.doing, one.scoped)}
        prose={said.prose}
        lines={one.at === "done"
          ? { named: m.came_heading(), said: linesOf(one.came) }
          : undefined}
        actions={dropping}
      />
    {/each}
  </div>
</Panel>

<style>
  .scope {
    padding: var(--sp-4) var(--panel-pad) 0;
  }

  .scope p,
  .prose {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--panel-pad);
  }

  /* The rule appears only when there is something under it, so a panel nobody
     has asked anything of ends at its own border rather than at a spare line. */
  .parted {
    border-top: 1px solid var(--line);
  }

  /* Focus is put here after a row is taken away, and it is not a place the tab
     order stops at, so the ring would mark somewhere nobody steered to. */
  .asked:focus {
    outline: none;
  }

  .plan {
    display: grid;
    gap: var(--sp-3);
    padding: var(--sp-4) var(--panel-pad);
    border-bottom: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  h3 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }

  .choice {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--sp-4);
    align-items: center;
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
