<script lang="ts">
  import Board from "./Board.svelte";
  import Alerts from "./panels/Alerts.svelte";
  import Catalogue from "./panels/Catalogue.svelte";
  import Configuration from "./panels/Configuration.svelte";
  import Copy from "./panels/Copy.svelte";
  import Credentials from "./panels/Credentials.svelte";
  import Line from "./panels/Line.svelte";
  import Outbound from "./panels/Outbound.svelte";
  import Pairing from "./panels/Pairing.svelte";
  import Plugins from "./panels/Plugins.svelte";
  import Glossary from "./panels/Glossary.svelte";
  import Quality from "./panels/Quality.svelte";
  import Updates from "./panels/Updates.svelte";
  import Wiring from "./panels/Wiring.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Configured } from "../lib/configured";
  import type { Configurer } from "../lib/configuring";
  import type { Alerts as Told } from "../lib/alerts";
  import type { Catalogue as Held, Provenance } from "../lib/catalogue";
  import type { Standing, Versions } from "../lib/copy";
  import type { Inventory } from "../lib/credentials";
  import type { Freshness } from "../lib/freshness";
  import type { Leaving } from "../lib/leaving";
  import type { Pairer } from "../lib/pairing";
  import type { Shared } from "../lib/shared";
  import type { Sharer } from "../lib/sharing";
  import type { Tuned } from "../lib/tuned";
  import type { Tuner } from "../lib/tuning";
  import type { Filler } from "../lib/filling";
  import type { Updater } from "../lib/updating";
  import type { Wiring as Wired } from "../lib/wiring";
  import type { Plugins as Installs } from "../lib/plugins";
  import type { Vocabulary } from "../lib/glossary";

  interface Props {
    /** The quality choice in force, or why it could not be read. */
    quality: Reading<Tuned> | undefined;
    /** Every setting, or why they could not be read. */
    settings?: Reading<Configured> | undefined;
    /** How the line is shared, or why it could not be read. */
    line?: Reading<Shared> | undefined;
    /** Everything that leaves this machine, or why it could not be read. */
    outbound?: Reading<Leaving> | undefined;
    /** Every credential the stack holds, or why they could not be read. */
    credentials?: Reading<Inventory> | undefined;
    /** The versions in play, or why they could not be read. */
    versions?: Reading<Versions> | undefined;
    /** Where this copy stands against the newest release, or why it could not be read. */
    standing?: Reading<Standing> | undefined;
    /** What each service is for, or why it could not be read. */
    catalogue?: Reading<Held> | undefined;
    /** Where each service comes from, or why it could not be read. */
    provenance?: Reading<Provenance> | undefined;
    /** What the operator is told about, or why it could not be read. */
    alerts?: Reading<Told> | undefined;
    /** What the stack wires to what, or why it could not be read. */
    wiring?: Reading<Wired> | undefined;
    /** The plugins on this machine, or why they could not be read. */
    plugins?: Reading<Installs> | undefined;
    /** Every word lemonfiber explains, or why they could not be read. */
    glossary?: Reading<Vocabulary> | undefined;
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
    /**
     * What choosing which service fills a capability asks for. Left out where
     * nothing answers it.
     */
    filler?: Filler | undefined;
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
    credentials,
    versions,
    standing,
    catalogue,
    provenance,
    alerts,
    wiring,
    plugins,
    glossary,
    freshness,
    tuner,
    filler,
    configurer,
    sharer,
    updater,
    pairer,
  }: Props = $props();
</script>

<!--
  How the stack is set up, and what can be changed about it from here: the
  quality new media is fetched at, every setting lemonfiber keeps, how the line
  is shared, everything that leaves this machine, what the operator is told
  about, every credential the stack holds, the versions the stack stands on,
  what the stack holds and where each service comes from, what it wires to
  what, the plugins on this machine, this copy of lemonfiber, pairing the
  companion app, and every word lemonfiber explains.

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
  <Alerts {alerts} {freshness} />
  <Credentials {credentials} {freshness} />

  {#if updater !== undefined}
    <Updates {updater} {freshness} />
  {/if}

  <Catalogue {catalogue} {provenance} {freshness} />
  <Wiring {wiring} {freshness} {filler} />
  <Plugins {plugins} {freshness} />
  <Copy {versions} {standing} {freshness} />
  {#if pairer !== undefined}
    <Pairing {pairer} {freshness} />
  {/if}
  <Glossary {glossary} {freshness} />
</Board>
