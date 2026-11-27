<script lang="ts">
  import type { Snippet } from "svelte";
  import { holdAble } from "../src/components/able";
  import type { Able } from "../src/lib/able";

  interface Props {
    /** What the signed-in key can use, as the story stands it in. */
    able: Able;
    /** The story, drawn beneath it. */
    children: Snippet;
  }

  let { able, children }: Props = $props();

  holdAble(() => able);
</script>

{@render children()}
