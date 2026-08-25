<script lang="ts">
  import Action from "../../components/Action.svelte";
  import Item from "../../components/Item.svelte";
  import Panel from "../../components/Panel.svelte";
  import type { Freshness } from "../../lib/freshness";
  import {
    askable,
    askingOf,
    everyDoing,
    readingOf,
    takesForms,
    titleOfDoing,
    wordOfDoing,
    type Controls,
  } from "../../lib/work";
  import * as m from "../../paraglide/messages.js";

  interface Props extends Controls {
    /** When this panel's source last answered. */
    freshness: Freshness;
  }

  let {
    chosen,
    work,
    waiting,
    confirming,
    busy,
    onpress,
    onleave,
    ondrop,
    onhush,
    freshness,
  }: Props = $props();

  const scoped = $derived(chosen.length > 0);
  const asking = $derived(askingOf(confirming, scoped));
  const silent = $derived(busy || asking !== undefined);
  const parted = $derived(
    asking !== undefined || waiting !== undefined || work.length > 0,
  );
  const byForm = everyDoing.filter((doing) => takesForms.includes(doing));
  const whole = everyDoing.filter((doing) => !takesForms.includes(doing));
</script>

<!--
  What this surface can ask of the stack, and everything that has come of asking.

  Two groups, because two things are being acted on. The first acts on the forms
  chosen above, or on the whole stack where none were; the second takes no forms
  at all, and a selection silently ignored would be the same request answered
  with a different one. A line above them says which of the two the first group
  reaches, so pressing a control is never a guess about what it reaches.

  That line is announced when it changes. Taking a form up in the panel above
  changes what five controls down here will do, and a reader who cannot see the
  line has nothing else that says so.

  Three of the first group can do nothing until something has been chosen and
  are silenced until it has, rather than sending a request lemonfiber would
  refuse for the reason already visible on the screen.

  The controls come first and what they produced comes after, so a reader who
  presses one and moves forward reaches the answer rather than having to go back
  for it. A question about something costly is answered in the same place, which
  is why a control is silenced rather than taken away while one is standing: a
  button removed under a reader's own focus leaves them nowhere.

  What lemonfiber said while a wait was going on is its own row rather than part
  of a record. One wait speaks at a time and does not name the work it belongs
  to, so a line filed under one job would be a claim the stream never made.

  The stamp is the stream's. A record is this tab's own and has no source to be
  fresh against; the wait's line is the one thing here that came from one.

  What puts a row away names what it puts away. A reader listing the controls on
  a screen is given the names and nothing around them, and four of one name is
  four controls they cannot tell apart.
-->
<Panel title={m.panel_running()} {freshness} flush>
  <div class="scope" role="status">
    <p>{scoped ? m.running_scope_some() : m.running_scope_none()}</p>
  </div>

  <div class="controls" role="group" aria-label={m.running_controls()}>
    {#each byForm as doing (doing)}
      <Action
        label={wordOfDoing(doing, scoped)}
        off={silent || !askable(doing, chosen)}
        onclick={() => {
          onpress(doing);
        }}
      />
    {/each}
  </div>

  <div class="controls" role="group" aria-label={m.running_whole_controls()}>
    {#each whole as doing (doing)}
      <Action
        label={wordOfDoing(doing, scoped)}
        off={silent}
        onclick={() => {
          onpress(doing);
        }}
      />
    {/each}
  </div>

  <div class="asked" class:parted role="status" aria-label={m.running_asked()}>
    {#if asking !== undefined}
      {#snippet answering()}
        <Action
          label={asking.question.yes}
          weight="firm"
          onclick={() => {
            onpress(asking.doing);
          }}
        />
        <Action label={m.action_leave_running()} onclick={onleave} />
      {/snippet}
      <Item
        state="stopped"
        eyebrow={asking.question.eyebrow}
        title={asking.question.title}
        prose={asking.question.prose}
        actions={answering}
      />
    {/if}

    {#if waiting !== undefined}
      {#snippet hushing()}
        <Action label={m.action_hide_line()} onclick={onhush} />
      {/snippet}
      <Item
        state="part"
        eyebrow={m.eyebrow_under_way()}
        title={m.waiting_still()}
        prose={waiting}
        actions={hushing}
      />
    {/if}

    {#each work as one (one.id)}
      {@const read = readingOf(one)}
      {#snippet dropping()}
        <Action
          label={m.action_hide_record()}
          onclick={() => {
            ondrop(one.id);
          }}
        />
      {/snippet}
      <Item
        state={read.state}
        eyebrow={read.eyebrow}
        title={titleOfDoing(one.doing, one.scoped)}
        prose={read.prose}
        actions={dropping}
      />
    {/each}
  </div>
</Panel>

<style>
  .scope {
    padding: var(--sp-4) var(--panel-pad) 0;
  }

  .scope p {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--panel-pad);
  }

  /* The rule appears only when there is something under it, so a panel nobody
     has asked anything of ends at its own border rather than at a spare line. */
  .parted {
    border-top: 1px solid var(--line);
  }
</style>
