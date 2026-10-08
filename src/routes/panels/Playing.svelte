<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Panel from "../../components/Panel.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Freshness } from "../../lib/freshness";
  import { playedOf, sessionLine, type Playing } from "../../lib/playing";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What the media server is playing now, or why it could not be read. */
    playing: Reading<Playing>;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { playing, freshness }: Props = $props();
</script>

<!--
  What the media server is playing now, across the house: who is watching what,
  on which device, and whether it is paused. A media server that could not be
  asked says so, rather than reading as nobody watching.
-->
<Panel title={m.panel_playing()} {freshness} flush>
  <div class="scope">
    {#if playing.ok}
      {#if !playing.value.available}
        <p><Said text={m.playing_unasked()} /></p>
      {:else if playing.value.sessions.length === 0}
        <p><Said text={m.playing_none()} /></p>
      {/if}
      {#each playing.value.findings as finding, at (at)}
        <p>{finding}</p>
      {/each}
    {/if}
    {#if !playing.ok}
      <Value state="unknown" absent={playing.problem.message} />
    {/if}
  </div>

  {#if playing.ok && playing.value.sessions.length > 0}
    <ul class="sessions" aria-label={m.playing_said()}>
      {#each playing.value.sessions as session, place (place)}
        <li>
          <h3>{playedOf(session)}</h3>
          <p>{sessionLine(session)}</p>
        </li>
      {/each}
    </ul>
  {/if}
</Panel>

<style>
  .scope {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4) var(--panel-pad) var(--sp-3);
  }

  .scope:empty {
    display: none;
  }

  p {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
    overflow-wrap: anywhere;
  }

  .sessions {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .sessions > li {
    display: grid;
    gap: var(--sp-1);
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  h3 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }
</style>
