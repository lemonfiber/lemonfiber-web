<script lang="ts">
  interface Props {
    /** The person it stands for. Its first letter is what it draws. */
    name: string;
    /** Draws the smaller tile, for a name in a header rather than in a row. */
    small?: boolean | undefined;
  }

  let { name, small = false }: Props = $props();

  const initial = $derived(name.trim().charAt(0).toUpperCase());
</script>

<!--
  A person, as the first letter of their name on a lemon tile.

  Lemon is lemon in both palettes, so the letter on it takes the ink that does
  not flip with them.

  The letter is set in the interface's own face. The brand reserves the
  display face for the wordmark, and a person's initial is not the wordmark.

  An initial stands for a name rather than being one, and the name itself is
  written beside the tile everywhere this appears — so the tile is kept out of
  the reading, which would otherwise be given a letter it cannot expand.
-->
<span class="avatar" class:small aria-hidden="true">{initial}</span>

<style>
  .avatar {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--fiber-deep);
    border-radius: var(--r-md);
    background: var(--lemon);
    color: var(--on-lemon);
    font-size: var(--text-initial);
    font-weight: 800;
    letter-spacing: -0.045em;
  }

  /* Beside a name in a header, where the row it sits in is half the height of
     a household row. */
  .small {
    width: 30px;
    height: 30px;
    font-size: var(--text-prose);
  }
</style>
