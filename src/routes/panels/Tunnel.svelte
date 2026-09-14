<script lang="ts">
  import Panel from "../../components/Panel.svelte";
  import Skeleton from "../../components/Skeleton.svelte";
  import Tag from "../../components/Tag.svelte";
  import Value from "../../components/Value.svelte";
  import type { Freshness } from "../../lib/freshness";
  import { reasonOf, type Tunnel, type Tunnelled } from "../../lib/wire";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** The tunnel, as the stream last read it. */
    tunnel: Tunnelled | undefined;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { tunnel, freshness }: Props = $props();

  const shown = $derived(tunnel?.panel === "ready" ? tunnel.data : undefined);
  const reason = $derived(reasonOf(tunnel));
  const matches = $derived(shown?.egress_matches === true);

  /**
   * What the tunnel is forwarding, or what having nothing forwarded costs.
   *
   * A provider that forwards no port is an ordinary thing to be running under
   * and is not a fault, so what it says is what it means for sharing rather
   * than an absence dressed as one.
   */
  function port(read: Tunnel): string {
    const forwarded = read.forwarded_port ?? undefined;
    return forwarded === undefined
      ? m.tunnel_port_none()
      : m.tunnel_port_forwarded({ number: forwarded });
  }
</script>

<!--
  Where your downloading leaves from, and whether it genuinely leaves that way.

  The address and the country are what the tunnel says about itself. The match
  is the only line here that is evidence rather than a claim: it is the download
  program's own exit address compared against the tunnel's, and it is the one
  thing that can say the tunnel is up and carrying nothing.

  So the match takes the mark and the tone. A tunnel connected to a country an
  operator chose, with their downloading going out past it, reads on this panel
  as the emergency it is rather than as four lines that each look fine.

  A stack with no tunnel configured has no panel at all. That is the screen
  above's to decide, because a panel that drew itself as empty would be a
  permanent red mark for a choice somebody made on purpose.
-->
{#snippet unfilled()}
  <Value state="unknown" absent={reason} />
{/snippet}

<Panel
  title={m.panel_tunnel()}
  {freshness}
  flush={shown !== undefined}
  dead={reason === undefined ? undefined : unfilled}
>
  {#if shown !== undefined}
    <div class="tunnel">
      <p class="marks">
        <Tag
          label={matches ? m.tunnel_carrying() : m.tunnel_leaking()}
          tone={matches ? "calm" : "alarm"}
          state={matches ? "known" : "stopped"}
        />
        <Tag label={shown.country} />
      </p>

      <p class="address">
        <Value state="known" figure={shown.exit_ip} />
      </p>

      <p class="prose">
        <span class="word"
          >{matches ? m.tunnel_leaving_from() : m.tunnel_mismatch()}</span
        >
      </p>
      <p class="quiet"><span class="word">{port(shown)}</span></p>
    </div>
  {:else}
    <Skeleton width="12rem" label={m.waiting_answer()} />
  {/if}
</Panel>

<style>
  .tunnel {
    padding: var(--sp-4) var(--panel-pad);
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }

  /* The match and the country read as one line, and wrap onto a second rather
     than running out of the panel. */
  .marks {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-tight);
    margin: 0 0 var(--sp-2);
  }

  /* The one thing on this panel somebody reads out loud or compares against
     another screen, so it takes the size a row's own subject takes. */
  .address {
    margin: 0 0 var(--sp-1);
    font-size: var(--text-item);
  }

  .prose {
    margin: 0 0 var(--sp-1);
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .quiet {
    margin: 0;
    font-size: var(--text-note);
    color: var(--faint);
    max-width: 76ch;
  }
</style>
