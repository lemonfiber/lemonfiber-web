<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Field from "../../components/Field.svelte";
  import Item from "../../components/Item.svelte";
  import { linesOf } from "../../lib/came";
  import { standingPlug, type Plug, type Plugger } from "../../lib/plugging";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import PlugOffer from "./PlugOffer.svelte";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What acting on a plugin asks for, and what came of it. */
    plugger: Plugger;
  }

  let { plugger }: Props = $props();

  const sourceId = $props.id();

  /** The region the records sit in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** Put the reader where what they asked for is answered. */
  function landing(): void {
    asked.focus();
  }

  /** Where the plugin to install comes from, as typed. */
  let source = $state("");

  const typed = $derived(source.trim());
  const offered = $derived(standingPlug(plugger.work));
  const parted = $derived(plugger.work.length > 0);

  /** Ask for one act, and put the reader where it is answered. */
  function ask(plug: Plug): void {
    plugger.onask(plug);
    landing();
  }
</script>

<!--
  Installing a plugin from a source the operator names, and what acting on
  any plugin came to. Every act is read first: asked bare it writes nothing
  and answers with everything it would do, drawn whole above its yes, and the
  yes carries the name that reading gave itself.
-->
<section class="plugging" aria-labelledby={sourceId}>
  <h3 id={sourceId}>{m.plug_install_title()}</h3>
  <p class="prose"><Said text={m.plug_install_prose()} /></p>
  <Field
    label={m.plug_source()}
    value={source}
    oninput={(value: string) => {
      source = value;
    }}
  />
  <div class="acts">
    <Action
      label={m.action_plug_read()}
      off={plugger.busy || typed === ""}
      onclick={() => {
        ask({ doing: "plugin-install", source: typed });
      }}
    />
  </div>
</section>

<div
  class="asked"
  class:parted
  role="status"
  aria-label={m.plug_asked()}
  tabindex="-1"
  bind:this={asked}
>
  {#if offered !== undefined}
    {#key offered.offer}
      <PlugOffer
        {offered}
        busy={plugger.busy}
        onyes={ask}
        onleave={() => {
          plugger.ondrop(offered.id);
          landing();
        }}
      />
    {/key}
  {/if}

  {#each plugger.work as one (one.id)}
    {@const said = readingOf(one)}
    {#snippet dropping()}
      <Action
        label={m.action_hide_record()}
        onclick={() => {
          plugger.ondrop(one.id);
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
  .plugging {
    display: grid;
    gap: var(--sp-2);
    justify-items: start;
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  h3 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }

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

  /* Focus is put here after an act is asked about, and it is not a place the
     tab order stops at, so the ring would mark somewhere nobody steered to. */
  .asked:focus {
    outline: none;
  }
</style>
