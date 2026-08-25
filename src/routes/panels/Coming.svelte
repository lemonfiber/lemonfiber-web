<script lang="ts">
  import Meter from "../../components/Meter.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import { rate, share } from "../../lib/figures";
  import { spanFor, type Freshness } from "../../lib/freshness";
  import {
    figureOf,
    reasonOf,
    type Transfer,
    type Transfers,
  } from "../../lib/wire";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** The active downloads, as the stream last listed them. */
    transfers: Transfers | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { transfers, freshness }: Props = $props();

  const moving = $derived(
    transfers?.panel === "ready" ? transfers.data : undefined,
  );
  const reason = $derived(reasonOf(transfers));

  /**
   * How long is left, where enough is moving to say.
   */
  function left(transfer: Transfer): string {
    const eta = transfer.eta ?? undefined;
    return eta === undefined ? m.value_cannot_say() : spanFor(eta.secs);
  }
</script>

<!--
  What is arriving now: how far each one has got, how fast, and how long is left.

  The bar carries the state its speed does. A download whose client has gone
  quiet keeps the length it reached and loses its colour, so the row says the
  figure is the last one given rather than showing a stalled bar as a live one.
-->
{#snippet unfilled()}
  <Value state="unknown" absent={reason} />
{/snippet}

<Panel
  title={m.panel_downloading()}
  {freshness}
  dead={reason === undefined ? undefined : unfilled}
>
  {#if moving === undefined}
    <Skeleton width="14rem" label={m.waiting_answer()} />
  {:else if moving.length === 0}
    <Value state="unknown" absent={m.moving_nothing()} />
  {:else}
    <ul class="moving">
      {#each moving as transfer (transfer.name)}
        {@const speed = figureOf(transfer.speed, rate)}
        <li>
          <p class="what">{transfer.name}</p>
          <Meter
            part={share(transfer.progress)}
            label={m.meter_how_far()}
            state={speed.state}
          />
          <p class="beside">
            <Value
              state={speed.state}
              figure={speed.figure}
              absent={m.value_cannot_say()}
              unmarked
            />
            <span class="left">{left(transfer)}</span>
          </p>
        </li>
      {/each}
    </ul>
  {/if}
</Panel>

<style>
  .moving {
    display: grid;
    gap: var(--sp-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: grid;
    gap: var(--sp-2);
    min-width: 0;
  }

  .what {
    margin: 0;
    font-size: var(--text-prose);
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  /* The speed and the time left read as one line under the bar, and the time
     left keeps the ink a fact standing beside a figure takes. */
  .beside {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-3);
    margin: 0;
    font-size: var(--text-note);
  }

  .left {
    color: var(--faint);
    white-space: nowrap;
  }
</style>
