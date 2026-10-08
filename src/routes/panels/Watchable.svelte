<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Shelving } from "../shelving";
  import { holdingLine, shelfLines } from "../../lib/watchable";
  import type { Shelf } from "../../lib/yours";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** The member whose shelf this is, by the name they are known by. */
    name: string;
    /** How this surface asks what one member can watch. */
    shelving: Shelving;
  }

  let { name, shelving }: Props = $props();

  /** Whether the shelf is open. */
  let open = $state(false);

  /** What the last asking came to, or nothing while it is out. */
  let shelf = $state<Reading<Shelf> | undefined>(undefined);

  /** Open the shelf and ask it afresh, or close it. */
  async function press(): Promise<void> {
    open = !open;
    if (!open) return;
    shelf = undefined;
    shelf = await shelving(name);
  }
</script>

<!--
  What one member can watch, asked each time it is opened. The shelf is what
  the media server shows them with their limits already applied, so a title a
  limit hides is never here to be hidden again. While it is being asked, a bar
  holds its place; a shelf that could not be read says so rather than looking
  empty.
-->
<div class="watchable">
  <div class="acts">
    <Action
      label={open ? m.action_shelf_close({ name }) : m.action_shelf({ name })}
      onclick={() => {
        void press();
      }}
    />
  </div>

  {#if open && shelf === undefined}
    <Skeleton width="16rem" label={m.waiting_answer()} />
  {/if}
  {#if open && shelf !== undefined && !shelf.ok}
    <Value state="unknown" absent={shelf.problem.message} />
  {/if}
  {#if open && shelf?.ok === true}
    {#each shelfLines(shelf.value) as line, at (at)}
      <p><Said text={line} /></p>
    {/each}
    {#if shelf.value.holdings.length > 0}
      <ul class="lines" aria-label={m.watch_said({ name })}>
        {#each shelf.value.holdings as holding (holding.id)}
          <li><Said text={holdingLine(holding)} /></li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  .watchable {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }

  p {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .lines {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .lines li {
    font-size: var(--text-prose);
    color: var(--muted);
  }
</style>
