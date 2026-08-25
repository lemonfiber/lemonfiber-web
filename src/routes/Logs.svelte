<script lang="ts">
  import Note from "../components/Note.svelte";
  import Panel from "../components/Panel.svelte";
  import Skeleton from "../components/Skeleton.svelte";
  import Value from "../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Freshness } from "../lib/freshness";
  import type { Logged } from "../lib/wire";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** What the services said lately, or why they could not be asked. */
    scrollback: Reading<readonly Logged[]> | undefined;
    /** When this screen's source last answered. */
    freshness: Freshness;
  }

  let { scrollback, freshness }: Props = $props();

  const lines = $derived(
    scrollback?.ok === true ? scrollback.value : undefined,
  );
  const problem = $derived(
    scrollback?.ok === false ? scrollback.problem.message : undefined,
  );
  const listed = $derived(lines !== undefined && lines.length > 0);
</script>

<!--
  What every service has said lately, one line to a line.

  The name of the service that wrote a line is never shortened: a shortened one
  no longer says which service wrote it, which is the only thing the column is
  there for. What the width decides is where the name goes — beside the line
  while the name and forty characters of line both fit, and on a row of its own
  where they do not. The forty is the terminal viewer's own figure for a column
  of text worth reading, and `ch` in the figure face is the same measure the
  terminal counts in.

  A line wraps and is never cut. A run with nothing to break on — a path, a URL,
  a hash — is broken at the edge rather than taken sideways off the screen.

  Two things the terminal viewer draws are not drawn here. It reads the severity
  a line declares about itself and colours by it; the answer this screen is drawn
  from carries the line and not that reading, so nothing here is coloured — a
  screen that guessed from the stream instead would paint this stack's ordinary
  progress red, which is the one thing the terminal's own rule forbids. And the
  stamp a container puts on its own line is carried unparsed and is not set in a
  column of its own, for the same reason the terminal leaves it out: containers
  disagree with the host clock and with each other.
-->
<div class="screen">
  <Note prose={m.logs_ended()} />

  <Panel title={m.panel_scrollback()} {freshness} flush={listed}>
    {#if lines !== undefined && listed}
      <ul class="scrollback">
        {#each lines as line, at (at)}
          <li class="line">
            <span class="who">{line.service}</span>
            <span class="words">{line.line}</span>
          </li>
        {/each}
      </ul>
    {:else if lines !== undefined}
      <Value state="unknown" absent={m.logs_none()} />
    {:else if problem !== undefined}
      <Value state="unknown" absent={problem} />
    {:else}
      <Skeleton width="22rem" label={m.waiting_answer()} />
    {/if}
  </Panel>
</div>

<style>
  /* Not the column the screens of several panels stand in. This one is a lead
     paragraph and a single panel, and the paragraph carries its own space
     under it, which a gap would be added to rather than folded into. */
  .screen {
    min-width: 0;
  }

  /* A name wider than the panel scrolls inside the panel's own border rather
     than taking the page sideways with it, which is what a wide table does
     here. A name is never shortened, so there is always a width at which one
     will not fit. */
  .scrollback {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
    overflow-x: auto;
  }

  /* The name and the line, side by side while both fit. The line's own floor is
     forty characters, so the name column takes the room left over and never the
     room the line needs; where that leaves the line less than forty, the whole
     of it wraps onto a row of its own under the name. The floor gives way to the
     width of the row before it gives way to the window, which is what keeps a
     narrow screen from scrolling sideways. */
  .line {
    display: flex;
    flex-wrap: wrap;
    column-gap: var(--sp-3);
    padding: var(--sp-1) var(--panel-pad);
    border-bottom: 1px solid var(--line-soft);
    font-family: var(--mono);
    font-size: var(--text-note);
  }

  .line:last-child {
    border-bottom: 0;
  }

  .who {
    flex: 0 0 auto;
    white-space: nowrap;
    color: var(--faint);
  }

  .words {
    flex: 1 1 40ch;
    min-width: min(40ch, 100%);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
</style>
