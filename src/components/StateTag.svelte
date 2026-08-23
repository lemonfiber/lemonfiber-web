<script lang="ts">
  import { type State, wordFor, toneFor } from "../lib/state";

  interface Props {
    state: State;
    label?: string | undefined;
  }

  let { state, label = undefined }: Props = $props();

  const tone = $derived(toneFor(state));
  const text = $derived(label ?? wordFor(state));
</script>

<span
  class="tag"
  class:calm={tone === "calm"}
  class:watch={tone === "watch"}
  class:alarm={tone === "alarm"}
  data-state={state}
>
  <svg class="st" aria-hidden="true" viewBox="0 0 24 24"><use href="#s-{state}" /></svg>
  {text}
</span>

<style>
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 7px;
    border: 1px solid var(--lf-color-line);
    border-radius: var(--lf-radius-sm);
    background: var(--lf-color-pith);
    color: var(--lf-color-text-muted);
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
  }
  .st {
    width: 13px;
    height: 13px;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .calm .st {
    color: var(--lf-color-leaf);
  }
  .watch {
    border-color: var(--lf-color-fiber);
    color: var(--lf-color-fiber-deep);
  }
  .alarm {
    border-color: var(--lf-color-alarm);
    color: var(--lf-color-alarm);
  }
</style>
