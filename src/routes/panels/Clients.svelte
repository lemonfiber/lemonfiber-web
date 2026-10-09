<script lang="ts">
  import ShowAll from "../../components/ShowAll.svelte";
  import Said from "../../components/Said.svelte";
  import Panel from "../../components/Panel.svelte";
  import Value from "../../components/Value.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import { causeLines, deviceLines, type Guidance } from "../../lib/clients";
  import type { Freshness } from "../../lib/freshness";
  import { SHORT_DETAILED, Shortening } from "../../lib/shortening.svelte";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** Which app to watch on, or why it could not be read. */
    clients: Reading<Guidance>;
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let { clients, freshness }: Props = $props();

  const devicesId = $props.id();
  const troubleId = `${devicesId}-trouble`;

  /** Whether every device is listed, or only the first few. */
  const shortDevices = new Shortening(SHORT_DETAILED);

  /** Whether every trouble is listed, or only the first few. */
  const shortTrouble = new Shortening(SHORT_DETAILED);
</script>

<!--
  Which app each person in the house should watch on, device by device, and
  what to do when it does not work, keyed by what somebody would say is
  happening. Where the preset in force asks more of this machine than it can
  give, that is said once, above every device.
-->
<Panel title={m.panel_clients()} {freshness} flush>
  <div class="scope">
    <p><Said text={m.clients_prose()} /></p>
    {#if clients.ok}
      {@const straining = clients.value.straining}
      {#if straining !== undefined && straining !== null}
        <p>{straining.caution}</p>
        <p>{straining.instead}</p>
      {/if}
      <p>{clients.value.only_at_home}</p>
      <p>{clients.value.nothing_is_installed}</p>
    {/if}
    {#if !clients.ok}
      <Value state="unknown" absent={clients.problem.message} />
    {/if}
  </div>

  {#if clients.ok}
    <section class="part" aria-labelledby={devicesId}>
      <h3 id={devicesId}>{m.clients_devices()}</h3>
      <ul class="entries">
        {#each shortDevices.of(clients.value.devices) as device, place (place)}
          <li>
            <h4>{device.device}</h4>
            <ul class="lines">
              {#each deviceLines(device) as line, at (at)}
                <li><Said text={line} /></li>
              {/each}
            </ul>
          </li>
        {/each}
      </ul>
      <ShowAll
        items={clients.value.devices}
        shortening={shortDevices}
        inset={false}
      />
    </section>

    <section class="part" aria-labelledby={troubleId}>
      <h3 id={troubleId}>{m.clients_trouble()}</h3>
      <ul class="entries">
        {#each shortTrouble.of(clients.value.trouble) as trouble, place (place)}
          <li>
            <h4>{trouble.symptom}</h4>
            {#each trouble.causes as cause, which (which)}
              <ul class="lines">
                {#each causeLines(cause) as line, at (at)}
                  <li><Said text={line} /></li>
                {/each}
              </ul>
            {/each}
          </li>
        {/each}
      </ul>
      <ShowAll
        items={clients.value.trouble}
        shortening={shortTrouble}
        inset={false}
      />
    </section>
  {/if}
</Panel>

<style>
  .scope {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-4) var(--panel-pad) var(--sp-3);
  }

  p {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
    overflow-wrap: anywhere;
  }

  .part {
    display: grid;
    gap: var(--sp-3);
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  h3,
  h4 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }

  .entries {
    display: grid;
    gap: var(--sp-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .entries > li {
    display: grid;
    gap: var(--sp-1);
  }

  .lines {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .lines li {
    font-size: var(--text-prose);
    color: var(--muted);
  }
</style>
