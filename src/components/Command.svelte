<script lang="ts">
  interface Props {
    /** What running it does, which the command is announced by. */
    label: string;
    /** The command, word for word. */
    text: string;
  }

  let { label, text }: Props = $props();

  const labelId = $props.id();
</script>

<!--
  A command the operator copies and runs as it stands. One press selects the
  whole of it, so it is copied whole without a script, which a console served
  without encryption could not use.
-->
<figure class="command" aria-labelledby={labelId}>
  <figcaption id={labelId}>{label}</figcaption>
  <pre><code>{text}</code></pre>
</figure>

<style>
  .command {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
  }

  figcaption {
    font-size: var(--text-note);
    font-weight: 600;
    color: var(--muted);
  }

  pre {
    margin: 0;
    padding: var(--sp-2) var(--sp-3);
    font-family: var(--mono);
    font-size: var(--text-note);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    user-select: all;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
  }
</style>
