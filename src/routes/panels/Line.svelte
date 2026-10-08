<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Field from "../../components/Field.svelte";
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import Segmented from "../../components/Segmented.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import { linesOf } from "../../lib/came";
  import type { Freshness } from "../../lib/freshness";
  import { lineLines, type Shared } from "../../lib/shared";
  import {
    declarationTyped,
    everyExceeded,
    exceededChosen,
    minutesTyped,
    type Exceeded,
    type Sharer,
  } from "../../lib/sharing";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** How the line is shared, or why it could not be read. */
    line: Reading<Shared> | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
    /**
     * What declaring how the line is shared asks for. Left out where nothing
     * answers it, which draws the reading alone.
     */
    sharer?: Sharer | undefined;
  }

  let { line, freshness, sharer }: Props = $props();

  /** The region a row sits in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** Each limit as typed; empty is left as it is. */
  let typed = $state({ down: "", up: "", active: "", line: "", cap: "" });

  /** What happens when the cap is reached. */
  let exceeded = $state<Exceeded>("pause");

  /** How many minutes to lift the limits for, as typed. */
  let minutes = $state("");

  /** Put the reader where the row they were standing in was. */
  function landing(): void {
    asked.focus();
  }

  /** The words for what happens when a cap is reached. */
  function wordOfExceeded(when: Exceeded): string {
    switch (when) {
      case "pause":
        return m.line_exceeded_pause();
      case "throttle":
        return m.line_exceeded_throttle();
      case "continue":
        return m.line_exceeded_continue();
    }
  }

  const said = $derived(line?.ok === true ? lineLines(line.value) : undefined);
  const problem = $derived(
    line?.ok === false ? line.problem.message : undefined,
  );
  const declared = $derived(declarationTyped(typed, exceeded));
  const lifted = $derived(minutesTyped(minutes));
  const work = $derived(sharer?.work ?? []);
  const silent = $derived(sharer?.busy === true);
</script>

<!--
  How the line is shared between the household and the stack, and declaring it.

  Every limit is written the way the command line takes it, and lemonfiber
  reads it: a share of the measured line, or a figure. A limit left empty is
  left as it is. What happens when a cap is reached is asked only where a cap
  is typed. Declaring is made at once and answered with how the line is now
  shared; lifting the limits for a while is the same request, naming minutes.
  Every download is paused, or resumed, at once, and answered with what each
  download client read back.
-->
<Panel title={m.panel_line()} {freshness} flush>
  <div class="scope">
    {#if said !== undefined}
      <ul class="standing" aria-label={m.line_said()}>
        {#each said as one, at (at)}
          <li><Said text={one} /></li>
        {/each}
      </ul>
    {:else if problem !== undefined}
      <Value state="unknown" absent={problem} />
    {:else}
      <Skeleton width="18rem" label={m.waiting_answer()} />
    {/if}
  </div>

  {#if sharer !== undefined}
    <div class="form" role="group" aria-label={m.line_declare()}>
      <div class="fields">
        <Field
          label={m.line_down()}
          value={typed.down}
          hint={m.line_share_hint()}
          oninput={(value: string) => {
            typed.down = value;
          }}
        />
        <Field
          label={m.line_up()}
          value={typed.up}
          hint={m.line_share_hint()}
          oninput={(value: string) => {
            typed.up = value;
          }}
        />
        <Field
          label={m.line_active()}
          value={typed.active}
          hint={m.line_active_hint()}
          oninput={(value: string) => {
            typed.active = value;
          }}
        />
        <Field
          label={m.line_line()}
          value={typed.line}
          hint={m.line_line_hint()}
          oninput={(value: string) => {
            typed.line = value;
          }}
        />
        <Field
          label={m.line_cap()}
          value={typed.cap}
          hint={m.line_cap_hint()}
          oninput={(value: string) => {
            typed.cap = value;
          }}
        />
      </div>
      {#if declared?.cap !== undefined}
        <Segmented
          label={m.line_exceeded()}
          options={everyExceeded.map((one) => ({
            value: one,
            label: wordOfExceeded(one),
          }))}
          selected={exceeded}
          onselect={(value: string) => {
            exceeded = exceededChosen(value, exceeded);
          }}
        />
      {/if}
      <div class="acts">
        {#if declared === undefined}
          <Action label={m.action_line_declare()} weight="firm" off />
        {:else}
          {@const declaring = declared}
          <Action
            label={m.action_line_declare()}
            weight="firm"
            off={silent}
            onclick={() => {
              sharer.onask({ doing: "bandwidth", declared: declaring });
              landing();
            }}
          />
        {/if}
      </div>
      <div class="lift">
        <Field
          label={m.line_minutes()}
          value={minutes}
          figure
          hint={minutes.trim() !== "" && lifted === undefined
            ? m.line_minutes_unread()
            : undefined}
          oninput={(value: string) => {
            minutes = value;
          }}
        />
        {#if lifted === undefined}
          <Action label={m.action_line_lift()} off />
        {:else}
          {@const lifting = lifted}
          <Action
            label={m.action_line_lift()}
            off={silent}
            onclick={() => {
              sharer.onask({ doing: "bandwidth", minutes: lifting });
              landing();
            }}
          />
        {/if}
      </div>
    </div>
    <div class="pausing" role="group" aria-label={m.line_pausing()}>
      <Action
        label={m.action_downloads_pause()}
        off={silent}
        onclick={() => {
          sharer.onask({ doing: "downloads-pause" });
          landing();
        }}
      />
      <Action
        label={m.action_downloads_resume()}
        off={silent}
        onclick={() => {
          sharer.onask({ doing: "downloads-resume" });
          landing();
        }}
      />
    </div>
  {/if}

  <div
    class="asked"
    class:parted={work.length > 0}
    role="status"
    aria-label={m.line_asked()}
    tabindex="-1"
    bind:this={asked}
  >
    {#if sharer !== undefined}
      {#each work as one (one.id)}
        {@const reading = readingOf(one)}
        {#snippet dropping()}
          <Action
            label={m.action_hide_record()}
            onclick={() => {
              sharer.ondrop(one.id);
              landing();
            }}
          />
        {/snippet}
        <Item
          state={reading.state}
          eyebrow={reading.eyebrow}
          title={titleOfDoing(one.doing, one.scoped)}
          prose={reading.prose}
          lines={one.at === "done"
            ? { named: m.came_heading(), said: linesOf(one.came) }
            : undefined}
          actions={dropping}
        />
      {/each}
    {/if}
  </div>
</Panel>

<style>
  .scope {
    padding: var(--sp-4) var(--panel-pad) var(--sp-3);
  }

  .standing {
    display: grid;
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
    max-width: 76ch;
  }

  li {
    font-size: var(--text-prose);
    color: var(--muted);
    overflow-wrap: anywhere;
  }

  .form {
    display: grid;
    gap: var(--sp-3);
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
  }

  .fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: var(--sp-3);
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }

  .pausing {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
  }

  .lift {
    display: grid;
    grid-template-columns: minmax(0, 16rem) auto;
    gap: var(--sp-3);
    align-items: end;
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
</style>
