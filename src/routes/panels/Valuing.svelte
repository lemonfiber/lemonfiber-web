<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Item from "../../components/Item.svelte";
  import { linesOf } from "../../lib/came";
  import { unvettedLines } from "../../lib/unvetted";
  import { changeLines } from "../../lib/values";
  import { standingValue, type Offered, type Valuer } from "../../lib/valuing";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What changing the settings asks for, and what came of it. */
    valuer: Valuer;
  }

  let { valuer }: Props = $props();

  const titleId = $props.id();

  /** The region the records sit in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** Put the reader where what they asked for is answered. */
  function landing(): void {
    asked.focus();
  }

  /** The yes to a reading: the same change, carrying the reading's name. */
  function agree(reading: Offered): void {
    const { offer } = reading;
    valuer.onask(
      reading.doing === "settings-set"
        ? { doing: "settings-set", values: reading.values, offer }
        : { doing: "settings-clear", settings: reading.settings, offer },
    );
    landing();
  }

  const offered = $derived(standingValue(valuer.work));
  const parted = $derived(valuer.work.length > 0);
</script>

<!--
  What changing the settings would do and what it came to. A change is read
  first: asked as a rehearsal it writes nothing and answers with each setting
  it moves, every entry it rewrites, what it restarts and every service it
  starts or leaves held back, and the operator's own overlay where it changes
  a service, drawn above its yes, and the yes carries the name
  that reading gave itself.
-->
<div
  class="asked"
  class:parted
  role="status"
  aria-label={m.values_asked()}
  tabindex="-1"
  bind:this={asked}
>
  {#if offered !== undefined}
    {@const reading = offered}
    {#key reading.offer}
      <section class="offer" aria-labelledby={titleId}>
        <h3 id={titleId}>{m.values_offer_title()}</h3>
        <p class="prose">
          <Said text={m.values_offer_prose({ offer: reading.offer })} />
        </p>
        <ul class="lines">
          {#each [...changeLines(reading.change), ...unvettedLines(reading.unvetted)] as line, at (at)}
            <li><Said text={line} /></li>
          {/each}
        </ul>
        <div class="acts">
          <Action
            label={m.action_values_yes({ offer: reading.offer })}
            weight="firm"
            off={valuer.busy}
            onclick={() => {
              agree(reading);
            }}
          />
          <Action
            label={m.action_leave_as_is()}
            onclick={() => {
              valuer.ondrop(reading.id);
              landing();
            }}
          />
        </div>
      </section>
    {/key}
  {/if}

  {#each valuer.work as one (one.id)}
    {@const said = readingOf(one)}
    {#snippet dropping()}
      <Action
        label={m.action_hide_record()}
        onclick={() => {
          valuer.ondrop(one.id);
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

<style>
  .offer {
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

  .lines {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
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

  /* The rule appears only when there is something under it, so a panel nobody
     has asked anything of ends at its own border rather than at a spare line. */
  .parted {
    border-top: 1px solid var(--line);
  }

  /* Focus is put here after a change is asked about, and it is not a place the
     tab order stops at, so the ring would mark somewhere nobody steered to. */
  .asked:focus {
    outline: none;
  }
</style>
