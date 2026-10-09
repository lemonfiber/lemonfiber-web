<script lang="ts">
  import BigFigure from "../../components/BigFigure.svelte";
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import { bytes } from "../../lib/figures";
  import { spanFor, type Freshness } from "../../lib/freshness";
  import {
    figureOf,
    reasonOf,
    wordOfLink,
    type Disk,
    type Figure,
    type Space,
  } from "../../lib/wire";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** The disk, as the stream last described it. */
    disk: Disk | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { disk, freshness }: Props = $props();

  const reason = $derived(reasonOf(disk));
  const shown = $derived(disk?.panel === "ready" ? read(disk.data) : undefined);

  /** What the panel says, from what the source last read off the volume. */
  interface Shown {
    readonly free: Figure;
    readonly config: Figure;
    readonly link: string;
    readonly until: string;
  }

  /**
   * What is free, what an import costs, when the disk runs out, and what is
   * free where the settings and databases are kept.
   */
  function read(space: Space): Shown {
    const exhaustion = space.exhaustion ?? undefined;
    return {
      free: figureOf(space.free, bytes),
      config: figureOf(space.config_free, bytes),
      link: wordOfLink(space.hardlink),
      until:
        exhaustion === undefined
          ? m.space_not_filling()
          : m.space_until_full({ span: spanFor(exhaustion.secs) }),
    };
  }
</script>

<!--
  What is left on the disk, when it runs out, and whether an import costs a
  second copy of every file.

  A volume that could not be read this refresh carries its last figure dimmed
  rather than a zero: no free space and no answer about free space are opposite
  readings, and the one that reads as an emergency is the one that is not.

  The settings and databases every service keeps can sit on another volume
  than the media, and fill apart from it: once they fill, every service stops.
  What is free there is its own reading, said under the media's, and read the
  same way.
-->
{#snippet unfilled()}
  <Value state="unknown" absent={reason} />
{/snippet}

<Panel
  title={m.panel_space()}
  {freshness}
  dead={reason === undefined ? undefined : unfilled}
>
  {#if shown !== undefined}
    <BigFigure
      state={shown.free.state}
      figure={shown.free.figure}
      absent={m.value_cannot_say()}
      eyebrow={m.eyebrow_free_space()}
      beside={shown.link}
      caption={shown.until}
    />
    <dl class="config">
      <dt>{m.space_config_label()}</dt>
      <dd>
        <Value
          state={shown.config.state}
          figure={shown.config.figure}
          absent={m.value_cannot_say()}
        />
      </dd>
    </dl>
  {:else}
    <Skeleton width="7rem" label={m.waiting_answer()} />
  {/if}
</Panel>

<style>
  .config {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-1) var(--sp-2);
    align-items: baseline;
    margin: var(--sp-3) 0 0;
    padding-top: var(--sp-3);
    border-top: 1px solid var(--line);
    font-size: var(--text-note);
  }

  dt {
    color: var(--muted);
  }

  dd {
    margin: 0;
  }
</style>
