<script lang="ts">
  import { drawn } from "../lib/qr";

  interface Props {
    /** What the code carries: an address, or a link that opens an app at one. */
    text: string;
    /** What the code is, for a reader who cannot see it. */
    label: string;
  }

  let { text, label }: Props = $props();

  const code = $derived(drawn(text));
  const box = $derived(`0 0 ${String(code.size)} ${String(code.size)}`);
</script>

<!--
  A scannable code, drawn as squares rather than as an image file, so nothing
  is fetched and nothing is written anywhere.

  Dark squares on the bright lemon in every theme. A code drawn light on dark
  is one some phone cameras will not read, and the ground stays constant for
  the same reason the squares do.
-->
<svg
  class="code"
  viewBox={box}
  role="img"
  aria-label={label}
  shape-rendering="crispEdges"
>
  <rect width={code.size} height={code.size} class="ground" />
  <path d={code.path} class="squares" />
</svg>

<style>
  .code {
    display: block;
    width: 12rem;
    max-width: 100%;
    height: auto;
    border-radius: var(--r-sm);
  }

  .ground {
    fill: var(--lemon-bright);
  }

  .squares {
    fill: var(--on-lemon);
  }
</style>
