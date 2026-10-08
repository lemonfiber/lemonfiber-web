<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import { linesOf } from "../../lib/came";
  import type { Freshness } from "../../lib/freshness";
  import { standingMaterial, type Pairer } from "../../lib/pairing";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What the pairing panel can ask for, and what has come of asking. */
    pairer: Pairer;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { pairer, freshness }: Props = $props();

  const materialId = $props.id();

  /** The region a row sits in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** Put the reader where the row they were standing in was. */
  function landing(): void {
    asked.focus();
  }

  const standing = $derived(standingMaterial(pairer.work));
  const parted = $derived(pairer.work.length > 0);
</script>

<!--
  Pairing the companion app with this stack.

  Each asking makes fresh material: the line a phone's code carries and a
  person types, with the short form of the certificate's fingerprint to check
  on the phone before it trusts this machine. It carries no password, and the
  phone still signs in with the operator's own. What would make every paired
  phone refuse this machine is said with it, now rather than when it happens.

  The code a camera reads is not drawn here; the line it carries is.
-->
<Panel title={m.panel_pairing()} {freshness} flush>
  <div class="scope">
    <p><Said text={m.pairing_prose()} /></p>
  </div>

  <div class="controls">
    <Action
      label={m.action_pair()}
      weight="firm"
      off={pairer.busy}
      onclick={() => {
        pairer.onask({ doing: "companion-pair" });
        landing();
      }}
    />
  </div>

  <div
    class="asked"
    class:parted
    role="status"
    aria-label={m.pairing_asked()}
    tabindex="-1"
    bind:this={asked}
  >
    {#if standing !== undefined}
      <section class="material" aria-labelledby={materialId}>
        <h3 id={materialId}>{m.pairing_title()}</h3>
        <p class="prose"><Said text={m.pairing_written()} /></p>
        <code class="written">{standing.written}</code>
        <p class="prose"><Said text={m.pairing_compare()} /></p>
        <code class="form">{standing.compare}</code>
      </section>
    {/if}

    {#each pairer.work as one (one.id)}
      {@const said = readingOf(one)}
      {#snippet dropping()}
        <Action
          label={m.action_hide_record()}
          onclick={() => {
            pairer.ondrop(one.id);
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

  .material {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4) var(--panel-pad);
    border-bottom: 1px solid var(--line);
  }

  h3 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }

  /* The line is typed character for character, so it is set in the figure
     face and broken anywhere rather than pushed past the panel's edge. */
  .written,
  .form {
    font-family: var(--mono);
    font-size: var(--text-prose);
    overflow-wrap: anywhere;
  }
</style>
