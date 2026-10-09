<script lang="ts">
  import { onMount } from "svelte";
  import Action from "../../components/Action.svelte";
  import Item from "../../components/Item.svelte";
  import Said from "../../components/Said.svelte";
  import type { Reaching } from "../../api/asking";
  import type { Pausing } from "../../api/redeeming";
  import { linesOf } from "../../lib/came";
  import { readingOf, titleOfDoing } from "../../lib/work";
  import { Desk } from "../desk.svelte";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What reaching this run takes. */
    reaching: Reaching;
    /** What a refusal asks for. */
    onrefused: () => void;
    /** How the wait between one asking about a job and the next is taken. */
    pausing: Pausing;
    /** Leave for the console. */
    onopen: () => void;
  }

  let { reaching, onrefused, pausing, onopen }: Props = $props();

  const titleId = $props.id();

  /** Whether this screen is still being looked at. */
  let here = true;

  const desk = new Desk({
    reaching: () => reaching,
    pausing: () => pausing,
    onrefused: () => {
      onrefused();
    },
    here: () => here,
    settled: () => undefined,
  });

  /** The newest start asked for, where one was. */
  const started = $derived(desk.work.find((one) => one.doing === "up"));

  /** Whether the stack started, so there is something to connect. */
  const running = $derived(started?.at === "done");

  onMount(() => () => {
    here = false;
  });
</script>

<!--
  Setup is written, and the stack is configured but neither running nor wired.
  Starting it pulls the images and runs every service, followed as the overview
  follows it. Connecting the services, as seeding does, is offered once the
  start has finished, since a stack that did not start has nothing to answer
  the calls. The console is one press away throughout, and leaving early lands
  on the overview, where the same two controls are.
-->
<section class="written" aria-labelledby={titleId}>
  <h2 id={titleId}>{m.wizard_written_title()}</h2>
  <p class="prose"><Said text={m.wizard_written_prose()} /></p>
  <div class="acts">
    <Action
      label={m.action_wizard_start()}
      weight={running ? undefined : "firm"}
      off={desk.busy || running}
      onclick={() => {
        void desk.send("up", false, { forms: [] });
      }}
    />
    <Action
      label={m.action_wizard_connect()}
      weight={running ? "firm" : undefined}
      off={desk.busy || !running}
      onclick={() => {
        void desk.send("seed", false, {});
      }}
    />
    <Action label={m.action_wizard_open()} onclick={onopen} />
  </div>

  <div class="records" role="status" aria-label={m.wizard_written_asked()}>
    {#each desk.work as one (one.id)}
      {@const said = readingOf(one)}
      <Item
        state={said.state}
        eyebrow={said.eyebrow}
        title={titleOfDoing(one.doing, one.scoped)}
        prose={said.prose}
        lines={one.at === "done"
          ? { named: m.came_heading(), said: linesOf(one.came) }
          : undefined}
      />
    {/each}
  </div>
</section>

<style>
  .written {
    display: grid;
    gap: var(--sp-4);
    justify-items: stretch;
    max-width: 72ch;
    overflow-wrap: anywhere;
  }

  h2 {
    margin: 0;
    font-size: var(--text-unit);
    font-weight: 700;
  }

  .prose {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }

  .records {
    display: grid;
  }
</style>
