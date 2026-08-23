<script lang="ts">
  interface Props {
    /** What the colour is called. */
    name: string;
    /** The custom property the colour is read from, `--lemon` and its like. */
    token: string;
  }

  let { name, token }: Props = $props();

  const ground = $derived(`var(${token})`);
</script>

<!--
  A colour, what it is called, and the token that names it.

  The chip is drawn from the token rather than from a value copied out of it,
  so the page documenting the palette cannot fall behind the palette, and a
  swatch shows the colour the reader's own theme resolves rather than the one
  the light theme happens to hold.

  The chip is a block of colour and nothing else. The caption beside it is the
  whole of what there is to announce, so the block is kept out of the reading.
-->
<figure class="sw">
  <div class="chip" style:background={ground} aria-hidden="true"></div>
  <figcaption class="mt">
    <span>{name}</span>
    <code>{token}</code>
  </figcaption>
</figure>

<style>
  .sw {
    margin: 0;
    border: 1px solid var(--line);
    border-radius: var(--r-md);
    overflow: hidden;
    font-size: var(--text-note);
  }

  /* Tall enough to be read as a colour rather than as a rule under a word. */
  .chip {
    height: 3rem;
  }

  /* Paper, so a swatch of a surface colour is still bounded by one. */
  .mt {
    padding: var(--sp-2);
    background: var(--paper);
  }

  code {
    display: block;
    font-family: var(--mono);
    font-size: var(--text-eyebrow);
    color: var(--faint);
  }
</style>
