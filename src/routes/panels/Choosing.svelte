<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Field from "../../components/Field.svelte";
  import Item from "../../components/Item.svelte";
  import Segmented from "../../components/Segmented.svelte";
  import { linesOf } from "../../lib/came";
  import {
    choosable,
    standingFill,
    type Choosable,
    type Filler,
  } from "../../lib/filling";
  import type { Wiring } from "../../lib/wiring";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What the stack wires to what, as last read. */
    wiring: Wiring;
    /** What choosing a filler asks for, and what came of it. */
    filler: Filler;
  }

  let { wiring, filler }: Props = $props();

  const offerId = $props.id();

  /** The region the records sit in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** Put the reader where what they asked for is answered. */
  function landing(): void {
    asked.focus();
  }

  /** The service picked for each capability, as the operator has it now. */
  let picked = $state<Readonly<Record<string, string>>>({});

  /** The reason typed for each capability. */
  let reasons = $state<Readonly<Record<string, string>>>({});

  const choices = $derived(choosable(wiring));
  const offer = $derived(standingFill(filler.work));
  const parted = $derived(filler.work.length > 0);

  /** The service picked for one capability, or the one filling it now. */
  function pickedFor(one: Choosable): string {
    return picked[one.capability] ?? one.chosen ?? "";
  }

  /** The reason typed for one capability, or nothing where none was. */
  function reasonFor(capability: string): string | undefined {
    const typed = (reasons[capability] ?? "").trim();
    return typed === "" ? undefined : typed;
  }
</script>

<!--
  Choosing which service fills a capability several of them claim. What the
  choice would come to is asked first: as a rehearsal the request writes
  nothing and answers with what would fill it, what it takes the place of,
  what asks for it and anything it would leave unfilled, and names that offer.
  There is no bare yes. The yes stands under that record and carries the
  offer's name, so what is written is what was read or lemonfiber refuses.
-->
<section class="choosing" aria-label={m.fill_said()}>
  <p class="prose"><Said text={m.fill_prose()} /></p>
  {#each choices as one (one.capability)}
    {@const service = pickedFor(one)}
    <div class="choice">
      <h3>{one.capability}</h3>
      <Segmented
        label={m.fill_candidates({ capability: one.capability })}
        options={one.candidates.map((candidate) => ({
          value: candidate,
          label: candidate,
        }))}
        selected={service}
        onselect={(value: string) => {
          picked = { ...picked, [one.capability]: value };
        }}
      />
      <Field
        label={m.fill_reason()}
        value={reasons[one.capability] ?? ""}
        oninput={(value: string) => {
          reasons = { ...reasons, [one.capability]: value };
        }}
      />
      <div class="acts">
        <Action
          label={m.action_fill_preview({ capability: one.capability })}
          off={filler.busy || service === ""}
          onclick={() => {
            filler.onask({
              doing: "wiring-fill",
              capability: one.capability,
              service,
              reason: reasonFor(one.capability),
            });
            landing();
          }}
        />
      </div>
    </div>
  {/each}

  <div
    class="asked"
    class:parted
    role="status"
    aria-label={m.fill_asked()}
    tabindex="-1"
    bind:this={asked}
  >
    {#if offer !== undefined}
      <section class="plan" aria-labelledby={offerId}>
        <h3 id={offerId}>{m.fill_plan_title({ service: offer.service })}</h3>
        <p class="prose"><Said text={m.fill_plan_prose()} /></p>
        <div class="acts">
          <Action
            label={m.action_fill_yes()}
            weight="firm"
            off={filler.busy}
            onclick={() => {
              filler.onask({
                doing: "wiring-fill",
                capability: offer.capability,
                service: offer.service,
                reason: offer.reason,
                offer: offer.offer,
              });
              landing();
            }}
          />
          <Action
            label={m.action_leave_as_is()}
            onclick={() => {
              filler.ondrop(offer.id);
              landing();
            }}
          />
        </div>
      </section>
    {/if}

    {#each filler.work as one (one.id)}
      {@const said = readingOf(one)}
      {#snippet dropping()}
        <Action
          label={m.action_hide_record()}
          onclick={() => {
            filler.ondrop(one.id);
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
</section>

<style>
  .choosing {
    display: grid;
    border-top: 1px solid var(--line);
  }

  .prose {
    margin: 0;
    padding: var(--sp-3) var(--panel-pad) 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .plan .prose {
    padding: 0;
  }

  .choice {
    display: grid;
    gap: var(--sp-2);
    justify-items: start;
    padding: var(--sp-3) var(--panel-pad);
    overflow-wrap: anywhere;
  }

  h3 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
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

  /* Focus is put here after a choice is asked about, and it is not a place the
     tab order stops at, so the ring would mark somewhere nobody steered to. */
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
</style>
