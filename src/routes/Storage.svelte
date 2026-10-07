<script lang="ts">
  import Board from "./Board.svelte";
  import Backups from "./panels/Backups.svelte";
  import Findings from "./panels/Findings.svelte";
  import Letting from "./panels/Letting.svelte";
  import Reclaim from "./panels/Reclaim.svelte";
  import Removal from "./panels/Removal.svelte";
  import Space from "./panels/Space.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Freshness } from "../lib/freshness";
  import type { Archives } from "../lib/kept";
  import type { Reckoned } from "../lib/letting";
  import type { Reclaimer } from "../lib/reclaiming";
  import type { Remover } from "../lib/removing";
  import type { Letter } from "../lib/seeding";
  import type { Keeper } from "../lib/upkeep";
  import type { Diagnosis, Disk } from "../lib/wire";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** The disk, as the stream last described it. */
    disk: Disk | undefined;
    /** When the live connection last delivered. */
    live: Freshness;
    /** What the checks about the disk found, or why they could not be asked. */
    diagnosis: Reading<Diagnosis> | undefined;
    /** When the reading of those checks last answered. */
    read: Freshness;
    /**
     * What can be asked about the backups, and the backups kept. Left out where
     * nothing answers it, which draws the disk alone.
     */
    keeping?:
      | {
          readonly keeper: Keeper;
          readonly archives: Reading<Archives> | undefined;
        }
      | undefined;
    /**
     * What forgetting what lemonfiber keeps, and taking it off this machine,
     * asks for. Left out where nothing answers it.
     */
    remover?: Remover | undefined;
    /**
     * The completed downloads the disk accounting names, and what letting one
     * go asks for. Left out where nothing answers it.
     */
    letting?:
      | {
          readonly letter: Letter;
          readonly space: Reading<Reckoned> | undefined;
        }
      | undefined;
    /**
     * What of the disk could be got back, and what taking back what costs
     * nothing asks for. Left out where nothing answers it.
     */
    reclaiming?:
      | {
          readonly reclaimer: Reclaimer;
          readonly space: Reading<Reckoned> | undefined;
        }
      | undefined;
  }

  let {
    disk,
    live,
    diagnosis,
    read,
    keeping,
    remover,
    letting,
    reclaiming,
  }: Props = $props();
</script>

<!--
  The disk: what is left of it, everything the checks about it found, the
  backups kept on it, the completed downloads on it and letting one go, what of
  it could be got back and taking back what costs nothing, and taking
  lemonfiber off it.

  Two sources fill this screen and neither waits for the other. The figures come
  off the live connection, which is where a volume is measured; the checks and
  the backups come off readings that answer once. Each panel stamps whichever of
  the two filled it, so one of them falling behind is visible in the panel it fed
  and nowhere else.
-->
<Board>
  <Space {disk} freshness={live} />

  <Findings
    {diagnosis}
    freshness={read}
    title={m.panel_disk_findings()}
    absent={m.storage_none()}
  />

  {#if keeping !== undefined}
    <Backups
      keeper={keeping.keeper}
      archives={keeping.archives}
      freshness={read}
    />
  {/if}

  {#if letting !== undefined}
    <Letting space={letting.space} letter={letting.letter} freshness={read} />
  {/if}

  {#if reclaiming !== undefined}
    <Reclaim
      space={reclaiming.space}
      reclaimer={reclaiming.reclaimer}
      freshness={read}
    />
  {/if}

  {#if remover !== undefined}
    <Removal {remover} freshness={read} />
  {/if}
</Board>
