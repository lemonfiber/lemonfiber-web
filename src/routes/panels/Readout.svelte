<script lang="ts">
  import type { ReadName } from "@lemonfiber/sdk-ts";
  import Action from "../../components/Action.svelte";
  import Command from "../../components/Command.svelte";
  import Panel from "../../components/Panel.svelte";
  import Said from "../../components/Said.svelte";
  import ShowAll from "../../components/ShowAll.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Sought } from "../../lib/finding";
  import type { Freshness } from "../../lib/freshness";
  import type { Readout } from "../../lib/readout";
  import { Shortening } from "../../lib/shortening.svelte";

  interface Props {
    /** The read it is drawn from, which silences it where the signed-in key cannot use it. */
    reads?: ReadName | undefined;
    /** What the panel is called. */
    title: string;
    /** What it shows, in a sentence. */
    prose: string;
    /**
     * What the list of things it shows is called. Left out where the reading
     * never lists anything, which draws no list.
     */
    named?: string | undefined;
    /** The reading, told, or why it could not be read. */
    readout: Reading<Readout>;
    /** When this panel's source last answered. */
    freshness: Freshness;
    /**
     * What following one listed thing asks for. Left out where nothing
     * answers it, which draws no control to follow anything.
     */
    onfollow?: ((sought: Sought) => void) | undefined;
  }

  let { reads, title, prose, named, readout, freshness, onfollow }: Props =
    $props();

  /** Whether the list is shown whole. */
  const short = new Shortening();
</script>

<!--
  A reading told as lines: what it says as a whole, any command it hands over
  to be copied whole, then each thing it lists under a heading of its own, in
  the order the stack gives them. A reading that could not be read says why, in
  the stack's words, and nothing else.
-->
<Panel {title} {freshness} {reads} answer={readout} flush>
  <div class="scope">
    <p><Said text={prose} /></p>
    {#if readout.ok}
      <ul class="lines">
        {#each readout.value.lines as line, at (at)}
          <li><Said text={line} /></li>
        {/each}
      </ul>
      {#each readout.value.commands ?? [] as command, at (at)}
        <Command label={command.label} text={command.text} />
      {/each}
    {:else}
      <Value state="unknown" absent={readout.problem.message} />
    {/if}
  </div>

  {#if readout.ok && readout.value.entries.length > 0}
    <ol class="entries" aria-label={named}>
      {#each short.of(readout.value.entries) as entry, place (place)}
        <li>
          <h3><Said text={entry.head} /></h3>
          <ul class="lines">
            {#each entry.lines as line, at (at)}
              <li><Said text={line} /></li>
            {/each}
          </ul>
          {#if onfollow !== undefined && entry.follow !== undefined}
            {@const follow = entry.follow}
            {@const following = onfollow}
            <div>
              <Action
                label={follow.label}
                onclick={() => {
                  following(follow.sought);
                }}
              />
            </div>
          {/if}
        </li>
      {/each}
    </ol>
    <ShowAll items={readout.value.entries} shortening={short} />
  {/if}
</Panel>

<style>
  .scope {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4) var(--panel-pad) var(--sp-3);
  }

  p {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .entries {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .entries > li {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
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

  .lines li {
    font-size: var(--text-prose);
    color: var(--muted);
  }
</style>
