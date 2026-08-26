<script lang="ts">
  import Icon from "./Icon.svelte";

  interface Props {
    /** What the box is called. */
    label: string;
    /** What is in the box. */
    value: string;
    /** What the value means, under the box. */
    hint?: string | undefined;
    /**
     * What checking it found. Giving one puts it in place of the hint, so a
     * field cannot say what a value means and that it was reached at once.
     */
    confirmed?: string | undefined;
    /** Sets the value in the figure face, and narrows the box to fit one. */
    figure?: boolean | undefined;
    /** What typing in it asks for. */
    oninput?: ((value: string) => void) | undefined;
  }

  let {
    label,
    value,
    hint,
    confirmed,
    figure = false,
    oninput,
  }: Props = $props();

  const uid = $props.id();
  const boxId = `${uid}-box`;
  const noteId = `${uid}-note`;
  const described = $derived(
    confirmed !== undefined || hint !== undefined ? noteId : undefined,
  );
</script>

<!--
  One thing to fill in: what it is called, the box, and the line underneath.

  The label is tied to the box by id rather than by wrapping it, and the line
  underneath is tied to it by `aria-describedby` — a hint read only to someone
  who happens to look below the box explains nothing to anyone else.

  It is controlled: it shows the value it was told to show and asks for the
  one that was typed. The screen that owns the setting is the one that finds
  out whether the change took.

  Nothing typed into one of these is prose: a key, a port, a path, a count. A
  spell-checker underlines every one of them as a mistake, and on a key it also
  hands what was typed to whatever the checker is.
-->
<div class="field">
  <label for={boxId}>{label}</label>
  <input
    id={boxId}
    class:figure
    type="text"
    spellcheck="false"
    {value}
    aria-describedby={described}
    oninput={(event) => {
      oninput?.(event.currentTarget.value);
    }}
  />
  {#if confirmed !== undefined}
    <span id={noteId} class="ok">
      <Icon name="tick" size="small" />
      <span class="word">{confirmed}</span>
    </span>
  {:else if hint !== undefined}
    <span id={noteId} class="hint">{hint}</span>
  {/if}
</div>

<style>
  .field {
    display: grid;
    gap: var(--sp-2);
    margin-bottom: var(--sp-5);
    max-width: 30rem;
  }

  label {
    font-size: var(--text-panel);
    font-weight: 600;
  }

  input {
    padding: var(--sp-2) var(--sp-3);
    border: 1px solid var(--line);
    border-radius: var(--r-md);
    background: var(--paper);
    color: var(--text);
    font: inherit;
  }

  /* Set in the face figures are set in, and given the width a figure needs
     rather than the width the label happens to have. */
  .figure {
    max-width: 6.875rem;
    font-family: var(--mono);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  .hint {
    font-size: var(--text-control);
    color: var(--muted);
  }

  /* The tick is decorative: the words beside it are the confirmation. */
  .ok {
    display: flex;
    align-items: center;
    gap: var(--sp-tight);
    font-size: var(--text-control);
    color: var(--fiber-deep);
  }

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }
</style>
