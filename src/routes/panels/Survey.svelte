<script lang="ts">
  import Panel from "../../components/Panel.svelte";
  import Value from "../../components/Value.svelte";
  import Moving from "./Moving.svelte";
  import type { Reading } from "@lemonfiber/sdk-ts";
  import type { Freshness } from "../../lib/freshness";
  import type { Mover } from "../../lib/moving";
  import { surveyGroups, type Survey } from "../../lib/survey";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What is already on this machine, or why it could not be read. */
    survey: Reading<Survey>;
    /** When this panel's source last answered. */
    freshness: Freshness;
    /**
     * What acting on what is here asks for. Left out where nothing answers it,
     * which offers no way forward.
     */
    mover?: Mover | undefined;
  }

  let { survey, freshness, mover }: Props = $props();

  const groupId = $props.id();

  const groups = $derived(survey.ok ? surveyGroups(survey.value) : []);
</script>

<!--
  What is already on this machine that is not lemonfiber's: each project and
  its containers, the ports in the way, what taking each over would come to,
  what the layout costs, what may be done, and what is named and not carried.
  A survey that could not ask the container engine says so rather than drawing
  an empty machine. Under it, each way forward is offered, asked about first.
-->
<Panel title={m.panel_survey()} {freshness} flush>
  <div class="scope">
    <p>{m.survey_prose()}</p>
    {#if !survey.ok}
      <Value state="unknown" absent={survey.problem.message} />
    {/if}
    {#if survey.ok && !survey.value.read}
      <p>{m.survey_unread()}</p>
    {/if}
    {#if survey.ok && survey.value.read && survey.value.standing.length === 0}
      <p>{m.survey_none()}</p>
    {/if}
  </div>

  {#each groups as group, place (place)}
    <section class="group" aria-labelledby="{groupId}-{place}">
      <h3 id="{groupId}-{place}">{group.title}</h3>
      <ul class="entries">
        {#each group.entries as entry, at (at)}
          <li>
            <ul class="lines">
              {#each entry as line, said (said)}
                <li><span class="word">{line}</span></li>
              {/each}
            </ul>
          </li>
        {/each}
      </ul>
    </section>
  {/each}

  {#if mover !== undefined && survey.ok && survey.value.read}
    <Moving survey={survey.value} {mover} />
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
  }

  .entries {
    display: grid;
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .group {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--panel-pad);
    border-top: 1px solid var(--line);
    overflow-wrap: anywhere;
  }

  h3 {
    margin: 0;
    font-size: var(--text-item);
    font-weight: 600;
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

  .word {
    /* Its own element so the interpolation is this node's only content. */
    display: contents;
  }
</style>
