<script lang="ts">
  import Board from "./Board.svelte";
  import Configuration from "./panels/Configuration.svelte";
  import Quality from "./panels/Quality.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Configured } from "../lib/configured";
  import type { Configurer } from "../lib/configuring";
  import type { Freshness } from "../lib/freshness";
  import type { Tuned } from "../lib/tuned";
  import type { Tuner } from "../lib/tuning";

  interface Props {
    /** The quality choice in force, or why it could not be read. */
    quality: Reading<Tuned> | undefined;
    /** Every setting, or why they could not be read. */
    settings?: Reading<Configured> | undefined;
    /** When this screen's sources last answered. */
    freshness: Freshness;
    /**
     * What can be asked about the quality choice. Left out where nothing
     * answers it.
     */
    tuner?: Tuner | undefined;
    /** What can be asked about the settings. Left out where nothing answers it. */
    configurer?: Configurer | undefined;
  }

  let { quality, settings, freshness, tuner, configurer }: Props = $props();
</script>

<!--
  How the stack is set up, and what can be changed about it from here: the
  quality new media is fetched at, and every setting lemonfiber keeps.

  Both readings are asked for together on the way in, and stamped together.
-->
<Board>
  <Quality {quality} {freshness} {tuner} />

  <Configuration {settings} {freshness} {configurer} />
</Board>
