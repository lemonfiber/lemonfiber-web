<script lang="ts">
  interface Props {
    /** Whether the thing it governs is on. */
    on: boolean;
    /** The name it is announced by. There are no words on the control itself. */
    label: string;
    /** What flipping it asks for. */
    onclick?: (() => void) | undefined;
  }

  let { on, label, onclick }: Props = $props();
</script>

<!--
  A setting with two positions and nothing between them.

  It is controlled: it shows the position it was told to show and asks for the
  other one. The screen that owns the setting is the one that finds out whether
  the change took, and a control that flipped itself first would be claiming an
  answer it does not have.

  The words that say what it governs sit in the row beside it, so the control
  carries none of its own and takes the name it is announced by as a prop.

  A button with `aria-pressed`, never a bare box: the position is announced in
  the one place a screen reader looks for it, and the knob says it again by
  where it sits, which survives greyscale.

  `type` is fixed rather than offered. A control inside a form defaults to
  submitting it, which is a second thing to press by accident.
-->
<button
  class="switch"
  type="button"
  aria-pressed={on}
  aria-label={label}
  {onclick}
></button>

<style>
  .switch {
    width: 42px;
    height: 24px;
    flex: none;
    position: relative;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: var(--r-pill);
    background: var(--line);
  }

  /* The knob. Its travel is the whole of what the control says, so the shadow
     under it stays a shadow in both themes rather than following the ink. */
  .switch::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--paper);
    box-shadow: 0 1px 2px var(--shadow);
    transition: transform 0.15s;
  }

  .switch[aria-pressed="true"] {
    border-color: var(--fiber-deep);
    background: var(--fiber);
  }

  .switch[aria-pressed="true"]::after {
    transform: translateX(18px);
  }

  /* The position is what says on or off; the travel between them is decoration,
     and a reader who has asked for less of it gets the position without it. */
  @media (prefers-reduced-motion: reduce) {
    .switch::after {
      transition: none;
    }
  }
</style>
