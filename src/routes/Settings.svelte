<script lang="ts">
  import Board from "./Board.svelte";
  import Quality from "./panels/Quality.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Freshness } from "../lib/freshness";
  import type { Tuned } from "../lib/tuned";
  import type { Tuner } from "../lib/tuning";

  interface Props {
    /** The quality choice in force, or why it could not be read. */
    quality: Reading<Tuned> | undefined;
    /** When this screen's source last answered. */
    freshness: Freshness;
    /**
     * What can be asked about the quality choice. Left out where nothing
     * answers it.
     */
    tuner?: Tuner | undefined;
  }

  let { quality, freshness, tuner }: Props = $props();
</script>

<!--
  How the stack is set up, and what can be changed about it from here.
-->
<Board>
  <Quality {quality} {freshness} {tuner} />
</Board>
