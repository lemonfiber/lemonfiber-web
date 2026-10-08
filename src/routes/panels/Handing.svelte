<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Code from "../../components/Code.svelte";
  import {
    clientLine,
    codeLine,
    handoffLines,
    sessionLine,
    type Handoff,
  } from "../../lib/handoff";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** Where handing one person a device stands, as lemonfiber last answered. */
    handoff: Handoff;
    /** Whether asking again is under way or waiting, which silences the control. */
    silent: boolean;
    /** Ask again where it stands, which checks the device. */
    onagain: () => void;
  }

  let { handoff, silent, onagain }: Props = $props();

  const titleId = $props.id();
</script>

<!--
  Where getting one person's device onto the media server stands, and what to
  give them: each app with a code that points it at the server, the steps
  they take on the device, and the devices signed in now. The code is an
  address and nothing more, so showing it gives away where the server is and
  no way in. Approving a short-code sign-in is the person's own step, and
  nothing here takes it for them.
-->
<section class="handing" aria-labelledby={titleId}>
  <h3 id={titleId}>{m.handoff_said({ name: handoff.name })}</h3>
  <ul class="lines">
    {#each handoffLines(handoff) as line, at (at)}
      <li><Said text={line} /></li>
    {/each}
  </ul>

  {#if handoff.clients.length > 0}
    <ul class="apps" aria-label={m.handoff_apps()}>
      {#each handoff.clients as client, at (at)}
        <li>
          <p><Said text={clientLine(client)} /></p>
          <Code
            text={client.code}
            label={m.handoff_code_said({
              client: client.client,
              device: client.device,
            })}
          />
          <p class="carried"><Said text={codeLine(client)} /></p>
        </li>
      {/each}
    </ul>
  {/if}

  {#if handoff.steps.length > 0}
    <ol class="lines" aria-label={m.handoff_steps()}>
      {#each handoff.steps as step, at (at)}
        <li><Said text={step} /></li>
      {/each}
    </ol>
  {/if}

  {#if handoff.sessions.length > 0}
    <ul class="lines" aria-label={m.handoff_sessions()}>
      {#each handoff.sessions as session, at (at)}
        <li><Said text={sessionLine(session)} /></li>
      {/each}
    </ul>
  {/if}

  {#if handoff.remedy === "ask-again"}
    <div class="acts">
      <Action
        label={m.action_handoff_again({ name: handoff.name })}
        off={silent}
        onclick={onagain}
      />
    </div>
  {/if}
</section>

<style>
  .handing {
    display: grid;
    gap: var(--sp-3);
    margin-top: var(--sp-2);
    overflow-wrap: anywhere;
  }

  h3 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
  }

  .lines,
  .apps {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  ol.lines {
    padding-left: var(--sp-4);
    list-style: decimal;
  }

  .apps {
    gap: var(--sp-4);
  }

  .apps li {
    display: grid;
    gap: var(--sp-2);
    justify-items: start;
  }

  .lines li,
  p {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
  }

  .carried {
    font-family: var(--mono);
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
