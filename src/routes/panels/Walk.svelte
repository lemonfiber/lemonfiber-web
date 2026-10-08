<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Field from "../../components/Field.svelte";
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import { linesOf } from "../../lib/came";
  import { questionOfFind, type Finder } from "../../lib/finding";
  import type { Freshness } from "../../lib/freshness";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What walking one thing through asks for, and what came of it. */
    finder: Finder;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { finder, freshness }: Props = $props();

  /** The region a row sits in, bound as soon as the panel draws one. */
  let asked!: HTMLDivElement;

  /** What to add, as typed; empty is something likely to work. */
  let item = $state("");

  /** Put the reader where the row they were standing in was. */
  function landing(): void {
    asked.focus();
  }

  const work = $derived(
    finder.work.filter((one) => one.doing === "walkthrough"),
  );
  const asking = $derived(
    finder.asked?.doing === "walkthrough" ? finder.asked : undefined,
  );
  const question = $derived(
    asking === undefined ? undefined : questionOfFind(asking),
  );
  const silent = $derived(finder.busy || finder.asked !== undefined);
  const parted = $derived(question !== undefined || work.length > 0);
</script>

<!--
  Walking one thing through, from searching for it to having it ready to watch.

  Nothing comes back to read before a walk starts, and it fetches something, so
  what it does is asked before it is sent. Naming nothing asks lemonfiber for
  something likely to work. The steps it took are in the record once it ends.
-->
<Panel title={m.panel_walk()} {freshness} flush>
  <div class="scope">
    <p><Said text={m.walk_prose()} /></p>
  </div>

  <div class="form">
    <Field
      label={m.walk_item()}
      value={item}
      hint={m.walk_item_hint()}
      oninput={(value: string) => {
        item = value;
      }}
    />
    <div class="acts">
      <Action
        label={m.action_walk()}
        weight="firm"
        off={silent}
        onclick={() => {
          const named = item.trim();
          finder.onask({
            doing: "walkthrough",
            item: named === "" ? undefined : named,
          });
          landing();
        }}
      />
    </div>
  </div>

  <div
    class="asked"
    class:parted
    role="status"
    aria-label={m.walk_asked()}
    tabindex="-1"
    bind:this={asked}
  >
    {#if asking !== undefined && question !== undefined}
      {#snippet answering()}
        <Action
          label={question.yes}
          weight="firm"
          onclick={() => {
            finder.onask(asking);
            landing();
          }}
        />
        <Action
          label={m.action_leave_as_is()}
          onclick={() => {
            finder.onleave();
            landing();
          }}
        />
      {/snippet}
      <Item
        state="stopped"
        eyebrow={question.eyebrow}
        title={question.title}
        prose={question.prose}
        actions={answering}
      />
    {/if}

    {#each work as one (one.id)}
      {@const said = readingOf(one)}
      {#snippet dropping()}
        <Action
          label={m.action_hide_record()}
          onclick={() => {
            finder.ondrop(one.id);
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

  .scope p {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .form {
    display: grid;
    gap: var(--sp-3);
    padding: var(--sp-3) var(--panel-pad);
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

  /* Focus is put here after a row is taken away, and it is not a place the tab
     order stops at, so the ring would mark somewhere nobody steered to. */
  .asked:focus {
    outline: none;
  }
</style>
