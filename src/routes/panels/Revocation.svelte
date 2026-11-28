<script lang="ts">
  import Said from "../../components/Said.svelte";
  import Action from "../../components/Action.svelte";
  import Value from "../../components/Value.svelte";
  import {
    previewSaid,
    type Previewed,
    type Revocation,
  } from "../../lib/previewed";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** What saying yes does, in a sentence naming what it reaches. */
    prose: string;
    /** The yes, naming what it revokes. */
    yes: string;
    /** The control that previews it, naming what it previews. */
    preview: string;
    /** The revocation asked about. */
    revokes: Revocation;
    /** What its preview answered, where one was asked for. */
    previewed: Previewed | undefined;
    /** Whether a request is under way, which silences the yes and the preview. */
    busy: boolean;
    /** Revoke it. */
    onyes: () => void;
    /** Preview revoking it, changing nothing. */
    onpreview: () => void;
    /** Leave it as it is. */
    onleave: () => void;
  }

  let {
    prose,
    yes,
    preview,
    revokes,
    previewed,
    busy,
    onyes,
    onpreview,
    onleave,
  }: Props = $props();

  const said = $derived(
    previewed === undefined ? undefined : previewSaid(previewed),
  );
</script>

<!--
  The question a revocation asks before it is carried out: what saying yes does,
  the yes itself, and a preview offered beside it. The preview answers in place,
  under the question, and changes nothing; the yes stays where it was whether a
  preview was read, refused or never asked for, so the question is answered the
  same way either way. The preview's control stays too, so asking for one leaves
  the reader where they were.
-->
<p><Said text={prose} /></p>
<p><Said text={m.preview_offered()} /></p>
<div role="status" aria-label={m.preview_asked()}>
  {#if said !== undefined}
    {#if said.problem !== undefined}
      <Value state="unknown" absent={said.problem} />
    {/if}
    <p><Said text={said.line} /></p>
  {/if}
</div>
<div class="acts">
  <Action {revokes} label={yes} weight="firm" off={busy} onclick={onyes} />
  <Action {revokes} label={preview} off={busy} onclick={onpreview} />
  <Action label={m.action_leave_as_is()} onclick={onleave} />
</div>

<style>
  p {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 76ch;
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
