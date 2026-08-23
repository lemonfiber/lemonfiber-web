<script lang="ts">
  import type { Snippet } from "svelte";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** The source that has stopped answering. */
    service: string;
    /** Buttons. Omitted where there is nothing to press. */
    actions?: Snippet | undefined;
  }

  let { service, actions }: Props = $props();

  const gone = $derived(m.panel_dead_source({ service }));
  const scope = m.panel_dead_scope();
</script>

<!--
  What a panel says in place of the figures it cannot stand behind. It names
  the source, and then says how far the damage reaches: this box and no
  further. An operator who is told a figure cannot be trusted, and not which
  ones, has to distrust the whole screen.

  The drawing is the box with a broken edge — the same dashed language the
  quiet and never-measured marks use. It is hidden from a screen reader, which
  is already being told the same thing in words.
-->
<div class="note">
  <svg class="ic" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" stroke-dasharray="3 3" />
    <path d="M9.5 12h5" />
  </svg>
  <strong class="gone">{gone}</strong>
  <p class="scope">{scope}</p>
  {#if actions !== undefined}
    <div class="acts">{@render actions()}</div>
  {/if}
</div>

<style>
  .note {
    display: grid;
    justify-items: center;
    gap: var(--sp-2);
    padding: var(--sp-6) var(--panel-pad);
    text-align: center;
    color: var(--text);
    font-size: var(--text-prose);
  }

  .ic {
    width: 26px;
    height: 26px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
    color: var(--muted);
  }

  .scope {
    margin: 0;
    max-width: 46ch;
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--sp-2);
    margin-top: var(--sp-2);
  }
</style>
