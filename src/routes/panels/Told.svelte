<script lang="ts">
  import Panel from "../../components/Panel.svelte";
  import Port from "../../components/Port.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Tag from "../../components/Tag.svelte";
  import Value from "../../components/Value.svelte";
  import type { Freshness } from "../../lib/freshness";
  import type { Tone } from "../../lib/state";
  import { toneOfAlert, wordOfSeverity, wordOfWay } from "../../lib/trouble";
  import type { Alert } from "../../lib/wire";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What the operator has been told, newest first. */
    alerts: readonly Alert[] | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { alerts, freshness }: Props = $props();

  /** One interruption, and everything the row sets out for it. */
  interface Said {
    /** Which way it went, in one word. */
    readonly way: string;
    /** How much it matters, in one word. */
    readonly weight: string;
    /** How loudly the row is drawn. */
    readonly tone: Tone;
    /** What happened, in the words the condition was raised with. */
    readonly summary: string;
    /** What to do about it, most likely first. */
    readonly remedies: readonly string[];
    /** Every check it speaks for, where it speaks for more than one. */
    readonly grouped: readonly string[];
  }

  const said = $derived(alerts?.map(read));
  const listed = $derived(said !== undefined && said.length > 0);

  /** What one interruption sets out. */
  function read(alert: Alert): Said {
    return {
      way: wordOfWay(alert.moment),
      weight: wordOfSeverity(alert.severity),
      tone: toneOfAlert(alert),
      summary: alert.summary,
      remedies: alert.remedies,
      grouped: alert.affected.length > 1 ? alert.affected : [],
    };
  }
</script>

<!--
  What the operator has already been told, on the one channel that needs nothing
  set up to reach them.

  Every other channel can be misconfigured, unreachable or switched off, and a
  condition that exists only on one of those is a condition nobody was told
  about. This panel is what makes that impossible: it is filled from the same
  moment the panels beside it are, so a stack this page can draw at all is one
  whose alerts it is drawing.

  A resolution is kept rather than dropped once the condition clears. A tunnel
  that dropped and came back is worth the operator knowing about, and a screen
  that showed only what is wrong now would have nothing to say about the hour
  they were away. It is drawn calm whatever weight it carries, since what it
  reports is something that has stopped being true.

  Where one event was grouped across several services the checks it speaks for
  are named under it, rather than the event being drawn once per service — which
  is the same thing said several times, and how a screen of alerts becomes one
  nobody reads.
-->
<Panel title={m.panel_told()} {freshness} flush={listed}>
  {#if said !== undefined && listed}
    {#each said as one, at (at)}
      <article class="told" class:alarm={one.tone === "alarm"}>
        <Port tone={one.tone} />
        <div class="what">
          <p class="marks">
            <Tag label={one.way} />
            <Tag label={one.weight} tone={one.tone} />
          </p>
          <h3>{one.summary}</h3>
          {#if one.remedies.length > 0}
            <p class="eyebrow">{m.finding_to_do()}</p>
            <ul class="listed">
              {#each one.remedies as action, which (which)}
                <li><span class="word">{action}</span></li>
              {/each}
            </ul>
          {/if}
          {#if one.grouped.length > 0}
            <p class="eyebrow">{m.told_speaks_for()}</p>
            <ul class="listed">
              {#each one.grouped as check, which (which)}
                <li><span class="check">{check}</span></li>
              {/each}
            </ul>
          {/if}
        </div>
      </article>
    {/each}
  {:else if said !== undefined}
    <Value state="known" absent={m.told_none()} />
  {:else}
    <Skeleton width="16rem" label={m.waiting_answer()} />
  {/if}
</Panel>

<style>
  .told {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--sp-4);
    align-items: start;
    padding: var(--sp-4) var(--panel-pad);
    background: var(--paper);
    border-bottom: 1px solid var(--line);
  }

  .told:last-child {
    border-bottom: 0;
  }

  /* Only the rows that want the operator take a ground of their own, as they do
     wherever else this interface sets out something wrong. */
  .alarm {
    background: var(--alarm-tint);
  }

  /* A condition is raised with a service name, a path or a hash in it, and one
     with nothing to break on is broken at the edge rather than taken sideways
     off the page. */
  .what {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .marks {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-tight);
    margin: 0 0 var(--sp-2);
  }

  h3 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }

  .eyebrow {
    margin: var(--sp-3) 0 var(--sp-1);
    font-size: var(--text-eyebrow);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
    color: var(--faint);
  }

  .listed {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
    max-width: 76ch;
    font-size: var(--text-prose);
  }

  .check {
    font-family: var(--mono);
    font-size: var(--text-note);
    color: var(--faint);
  }

  /* An alarm row stands on a tint rather than on the panel's own ground, where
     the faint step of the ink scale falls under the contrast small text owes. */
  .alarm .eyebrow,
  .alarm .check {
    color: var(--muted);
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }
</style>
