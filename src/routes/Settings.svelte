<script lang="ts">
  import Board from "./Board.svelte";
  import Configuration from "./panels/Configuration.svelte";
  import Line from "./panels/Line.svelte";
  import Outbound from "./panels/Outbound.svelte";
  import Pairing from "./panels/Pairing.svelte";
  import Quality from "./panels/Quality.svelte";
  import Updates from "./panels/Updates.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Configured } from "../lib/configured";
  import type { Configurer } from "../lib/configuring";
  import type { Freshness } from "../lib/freshness";
  import type { Leaving } from "../lib/leaving";
  import type { Pairer } from "../lib/pairing";
  import type { Shared } from "../lib/shared";
  import type { Sharer } from "../lib/sharing";
  import type { Tuned } from "../lib/tuned";
  import type { Tuner } from "../lib/tuning";
  import type { Updater } from "../lib/updating";

  interface Props {
    /** The quality choice in force, or why it could not be read. */
    quality: Reading<Tuned> | undefined;
    /** Every setting, or why they could not be read. */
    settings?: Reading<Configured> | undefined;
    /** How the line is shared, or why it could not be read. */
    line?: Reading<Shared> | undefined;
    /** Everything that leaves this machine, or why it could not be read. */
    outbound?: Reading<Leaving> | undefined;
    /** When this screen's sources last answered. */
    freshness: Freshness;
    /**
     * What can be asked about the quality choice. Left out where nothing
     * answers it.
     */
    tuner?: Tuner | undefined;
    /** What can be asked about the settings. Left out where nothing answers it. */
    configurer?: Configurer | undefined;
    /** What declaring the line asks for. Left out where nothing answers it. */
    sharer?: Sharer | undefined;
    /** What updating the stack asks for. Left out where nothing answers it. */
    updater?: Updater | undefined;
    /** What pairing a phone asks for. Left out where nothing answers it. */
    pairer?: Pairer | undefined;
  }

  let {
    quality,
    settings,
    line,
    outbound,
    freshness,
    tuner,
    configurer,
    sharer,
    updater,
    pairer,
  }: Props = $props();
</script>

<!--
  How the stack is set up, and what can be changed about it from here: the
  quality new media is fetched at, every setting lemonfiber keeps, how the line
  is shared, everything that leaves this machine, the versions the stack stands
  on, and pairing the companion app.

  The readings are asked for together on the way in, and stamped together.
  The line is drawn where it was read or can be declared.
-->
<Board>
  <Quality {quality} {freshness} {tuner} />

  <Configuration {settings} {freshness} {configurer} />

  {#if line !== undefined || sharer !== undefined}
    <Line {line} {freshness} {sharer} />
  {/if}
  <Outbound {outbound} {freshness} />

  {#if updater !== undefined}
    <Updates {updater} {freshness} />
  {/if}

  {#if pairer !== undefined}
    <Pairing {pairer} {freshness} />
  {/if}
</Board>
