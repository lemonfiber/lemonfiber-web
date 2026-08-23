<script module lang="ts">
  /**
   * One option in a set where taking one gives up the others.
   *
   * The words are the caller's, so a group of choices is data a screen holds
   * rather than a shape this file has to know the names of.
   */
  export interface Choice {
    /** What it is called when it is chosen. Never shown. */
    value: string;
    /** The word on it. */
    label: string;
  }
</script>

<script lang="ts">
  interface Props {
    /** The name the whole group is announced by. */
    label: string;
    /** The options, in the order they are shown. */
    options: readonly Choice[];
    /** The `value` of the option that is taken. */
    selected: string;
    /** What taking another option asks for. */
    onselect?: ((value: string) => void) | undefined;
  }

  let { label, options, selected, onselect }: Props = $props();

  let group: HTMLDivElement;

  /** Which way along the row a key reaches. Every key but the arrows: nowhere. */
  function stepFor(key: string): number {
    if (key === "ArrowLeft" || key === "ArrowUp") return -1;
    if (key === "ArrowRight" || key === "ArrowDown") return 1;
    return 0;
  }

  /** Moves to the option an arrow key reaches from `from`, wrapping at both ends. */
  function reach(event: KeyboardEvent, from: number): void {
    const step = stepFor(event.key);
    if (step === 0) return;
    event.preventDefault();

    const wanted = (from + step + options.length) % options.length;
    for (const [at, control] of group.querySelectorAll("button").entries()) {
      if (at !== wanted) continue;
      control.focus();
      control.click();
    }
  }
</script>

<!--
  Two or three options where taking one gives up the others.

  A radio group, never a row of toggles: `aria-pressed` on each of three
  buttons announces three separate things each switched on or off, and a radio
  group announces one choice with three positions — "Appearance, radio group,
  Auto, selected, 2 of 3".

  Arrow keys move along it and take what they reach, wrapping at both ends,
  and only the option that is taken is reachable by tab. A column of settings
  costs one stop per setting rather than one per option.

  It is controlled, as the two-position switch is: it shows what it was told
  to show and asks for the rest.
-->
<div class="seg" bind:this={group} role="radiogroup" aria-label={label}>
  {#each options as option, at (option.value)}
    <button
      type="button"
      role="radio"
      aria-checked={option.value === selected}
      tabindex={option.value === selected ? 0 : -1}
      onclick={() => {
        onselect?.(option.value);
      }}
      onkeydown={(event) => {
        reach(event, at);
      }}
    >
      <span class="word">{option.label}</span>
    </button>
  {/each}
</div>

<style>
  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }

  /* One border around the row rather than one per option, so three options
     read as one control. */
  .seg {
    display: flex;
    border: 1px solid var(--line);
    border-radius: var(--r-md);
    overflow: hidden;
    background: var(--paper);
  }

  .seg button {
    flex: 1;
    padding: 0.3125rem 0;
    color: var(--muted);
    font-size: var(--text-note);
  }

  .seg button[aria-checked="true"] {
    background: var(--pith);
    color: var(--text);
    font-weight: 600;
    box-shadow: inset 0 0 0 1px var(--line);
  }
</style>
