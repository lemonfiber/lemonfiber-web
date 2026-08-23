<script lang="ts">
  import { type State, toneFor, wordFor } from "../lib/state";

  interface Props {
    state: State;
    /** Announced to a screen reader; the shape alone is not read aloud. */
    label?: string | undefined;
  }

  let { state, label }: Props = $props();

  const tone = $derived(toneFor(state));
  const described = $derived(label ?? wordFor(state));
</script>

<!--
  Every state gets its own shape, not only its own colour. A coloured square
  asks the reader to work out what the colour means; a tick, a clock, a stop
  square and a question do not — and shape survives greyscale, which colour
  alone does not.
-->
<svg
  class="mark"
  class:calm={tone === "calm"}
  class:watch={tone === "watch"}
  class:alarm={tone === "alarm"}
  class:unknown={state === "unknown"}
  viewBox="0 0 24 24"
  role="img"
  aria-label={described}
>
  {#if state === "known"}
    <path d="M4.5 12.6l4.6 4.6L19.5 6.6" />
  {:else if state === "quiet"}
    <circle cx="12" cy="12" r="8.6" stroke-dasharray="3.2 3.2" />
    <path d="M12 7.4V12l3.1 2" />
  {:else if state === "unknown"}
    <circle cx="12" cy="12" r="8.6" stroke-dasharray="1.5 3.4" />
    <path d="M9.4 9.6a2.7 2.7 0 1 1 3.2 3.1v1.2M12.5 17.1v.1" />
  {:else if state === "stopped"}
    <circle cx="12" cy="12" r="8.6" />
    <rect
      x="9"
      y="9"
      width="6"
      height="6"
      rx="1"
      fill="currentColor"
      stroke="none"
    />
  {:else}
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 3.4a8.6 8.6 0 0 1 0 17.2Z" fill="currentColor" stroke="none" />
  {/if}
</svg>

<style>
  .mark {
    width: 13px;
    height: 13px;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* A marker always carries its colour: a grey tick asks the reader whether
     grey means good or unknown, which is a question no marker should raise. */
  .calm {
    color: var(--ok);
  }
  .watch {
    color: var(--fiber-deep);
  }
  .alarm {
    color: var(--alarm);
  }

  /* Except this one. Not knowing is an absence, so it is the one state with no
     colour of its own. */
  .unknown {
    color: var(--faint);
  }
</style>
