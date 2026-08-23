<script lang="ts">
  interface Props {
    /** What the section under it is for, in a sentence or two. */
    prose: string;
  }

  let { prose }: Props = $props();
</script>

<!--
  The paragraph under a section's heading that says what the section is for,
  before the first setting in it is read.

  Its measure is the whole of it. Sixty-eight characters is a line the eye
  returns from; the full width of a settings pane is not, and a heading followed
  by a 200-character line is a section nobody reads the top of.
-->
<p class="note">{prose}</p>

<style>
  .note {
    margin: 0 0 var(--sp-5);
    max-width: 68ch;
    font-size: var(--text-panel);
    color: var(--muted);
  }
</style>
