<script lang="ts">
  import Board from "./Board.svelte";
  import Findings from "./panels/Findings.svelte";
  import Space from "./panels/Space.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Freshness } from "../lib/freshness";
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
  }

  let { disk, live, diagnosis, read }: Props = $props();
</script>

<!--
  The disk: what is left of it, and everything the checks about it found.

  Two sources fill this screen and neither waits for the other. The figures come
  off the live connection, which is where a volume is measured; the checks come
  off a reading that answers once. Each panel stamps whichever of the two filled
  it, so one of them falling behind is visible in the panel it fed and nowhere
  else.
-->
<Board>
  <Space {disk} freshness={live} />

  <Findings
    {diagnosis}
    freshness={read}
    title={m.panel_disk_findings()}
    absent={m.storage_none()}
  />
</Board>
