<script lang="ts">
  import Action from "../../components/Action.svelte";
  import Field from "../../components/Field.svelte";
  import Said from "../../components/Said.svelte";
  import Segmented from "../../components/Segmented.svelte";
  import Switch from "../../components/Switch.svelte";
  import {
    chosenFrom,
    everyAppetite,
    everyLibrary,
    folderTyped,
    MOST_ID,
    MOST_PORT,
    NNTP_TLS_PORT,
    wholeTyped,
    wordOfAppetite,
    wordOfLibrary,
    type Answer,
    type Appetite,
    type Asking,
    type Library,
  } from "../../lib/wizard";
  import * as m from "../../paraglide/messages.js";

  interface Props {
    /** The question setup is on. */
    step: Asking;
    /** Whether a step is out, which silences the controls. */
    busy: boolean;
    /** Send one answer. */
    onanswer: (answer: Answer) => void;
  }

  let { step, busy, onanswer }: Props = $props();

  let usenet = $state(false);
  let torrent = $state(false);
  let carrying = $state(true);
  let understood = $state(false);
  let folder = $state("");
  let url = $state("");
  let key = $state("");
  let host = $state("");
  let port = $state(String(NNTP_TLS_PORT));
  let tls = $state(true);
  let user = $state("");
  let pass = $state("");
  let uid = $state("");
  let gid = $state("");
  let library = $state<Library>("jellyfin-docker");
  let others = $state(false);
  let appetite = $state<Appetite>("problems-only");
  let autostart = $state(true);

  /**
   * The answer as the form stands, or nothing while any part of it is
   * missing. A secret is let go of as the answer is sent.
   */
  const typed = $derived.by((): Answer | undefined => {
    switch (step) {
      case "protocols":
        return { protocols: { usenet, torrent } };
      case "vpn":
        if (carrying) return { vpn: "carrying" };
        return understood ? { vpn: "absent" } : undefined;
      case "data-location": {
        const path = folderTyped(folder);
        return path === undefined ? undefined : { "data-location": path };
      }
      case "credentials":
        return url.trim() === "" || key === ""
          ? undefined
          : { credentials: { url: url.trim(), key } };
      case "provider":
        return providerTyped();
      case "service-user": {
        const u = wholeTyped(uid, 0, MOST_ID);
        const g = wholeTyped(gid, 0, MOST_ID);
        return u === undefined || g === undefined
          ? undefined
          : { "service-user": [u, g] };
      }
      case "library":
        return { library };
      case "household":
        return { household: others };
      case "notifications":
        return { notifications: appetite };
      case "autostart":
        return { autostart };
    }
  });

  /** The provider login as typed, or nothing while any part is missing. */
  function providerTyped(): Answer | undefined {
    const at = wholeTyped(port, 1, MOST_PORT);
    if (host.trim() === "" || user.trim() === "" || pass === "")
      return undefined;
    if (at === undefined) return undefined;
    return {
      provider: { host: host.trim(), port: at, tls, user: user.trim(), pass },
    };
  }

  /** Send the answer, letting go of any secret it carried. */
  function send(answer: Answer): void {
    onanswer(answer);
    key = "";
    pass = "";
  }

  /** Whether the step offers going on with nothing entered. */
  const skippable = $derived(step === "credentials" || step === "provider");

  /** The label the answer is sent with. */
  const forward = $derived(
    step === "credentials" || step === "provider"
      ? m.action_wizard_check()
      : m.action_wizard_continue(),
  );
</script>

<!--
  The form for the question setup is on, and nothing else. Each step's fields
  are its own, and the answer is sent only once every part of it is there. A
  key or a password goes in that one request and is cleared as it is sent.
  Turning encryption off says what that exposes. Going without a VPN is sent
  only once the operator says they understand that everyone they share with
  will see their home address.
-->
<div class="answering">
  {#if step === "protocols"}
    <Switch
      on={usenet}
      label={m.wizard_usenet()}
      onclick={() => {
        usenet = !usenet;
      }}
    />
    <Switch
      on={torrent}
      label={m.wizard_torrents()}
      onclick={() => {
        torrent = !torrent;
      }}
    />
  {:else if step === "vpn"}
    <Segmented
      label={m.wizard_vpn_said()}
      options={[
        { value: "carrying", label: m.wizard_vpn_carrying() },
        { value: "absent", label: m.wizard_vpn_absent() },
      ]}
      selected={carrying ? "carrying" : "absent"}
      onselect={(value: string) => {
        carrying = value !== "absent";
        understood = false;
      }}
    />
    {#if !carrying}
      <p class="prose"><Said text={m.wizard_vpn_confirm()} /></p>
      <Switch
        on={understood}
        label={m.wizard_vpn_understood()}
        onclick={() => {
          understood = !understood;
        }}
      />
    {/if}
  {:else if step === "data-location"}
    <Field
      label={m.wizard_data_folder()}
      value={folder}
      hint={m.wizard_data_hint()}
      oninput={(value: string) => {
        folder = value;
      }}
    />
  {:else if step === "credentials"}
    <Field
      label={m.wizard_indexer_url()}
      value={url}
      oninput={(value: string) => {
        url = value;
      }}
    />
    <Field
      label={m.wizard_indexer_key()}
      value={key}
      purpose="secret"
      oninput={(value: string) => {
        key = value;
      }}
    />
  {:else if step === "provider"}
    <Field
      label={m.wizard_provider_host()}
      value={host}
      oninput={(value: string) => {
        host = value;
      }}
    />
    <Field
      label={m.wizard_provider_port()}
      value={port}
      oninput={(value: string) => {
        port = value;
      }}
    />
    <Switch
      on={tls}
      label={m.wizard_provider_tls()}
      onclick={() => {
        tls = !tls;
      }}
    />
    {#if !tls}
      <p class="prose"><Said text={m.wizard_provider_plain()} /></p>
    {/if}
    <Field
      label={m.wizard_provider_user()}
      value={user}
      purpose="who"
      oninput={(value: string) => {
        user = value;
      }}
    />
    <Field
      label={m.wizard_provider_pass()}
      value={pass}
      purpose="secret"
      oninput={(value: string) => {
        pass = value;
      }}
    />
  {:else if step === "service-user"}
    <Field
      label={m.wizard_user_id()}
      value={uid}
      oninput={(value: string) => {
        uid = value;
      }}
    />
    <Field
      label={m.wizard_group_id()}
      value={gid}
      oninput={(value: string) => {
        gid = value;
      }}
    />
  {:else if step === "library"}
    <Segmented
      label={m.wizard_library_title()}
      options={everyLibrary.map((one) => ({
        value: one,
        label: wordOfLibrary(one),
      }))}
      selected={library}
      onselect={(value: string) => {
        library = chosenFrom(everyLibrary, value, library);
      }}
    />
    <p class="prose"><Said text={m.wizard_library_host_prose()} /></p>
  {:else if step === "household"}
    <Segmented
      label={m.wizard_household_title()}
      options={[
        { value: "alone", label: m.wizard_household_alone() },
        { value: "others", label: m.wizard_household_others() },
      ]}
      selected={others ? "others" : "alone"}
      onselect={(value: string) => {
        others = value === "others";
      }}
    />
  {:else if step === "notifications"}
    <Segmented
      label={m.wizard_notifications_title()}
      options={everyAppetite.map((one) => ({
        value: one,
        label: wordOfAppetite(one),
      }))}
      selected={appetite}
      onselect={(value: string) => {
        appetite = chosenFrom(everyAppetite, value, appetite);
      }}
    />
  {:else}
    <Switch
      on={autostart}
      label={m.wizard_autostart_on()}
      onclick={() => {
        autostart = !autostart;
      }}
    />
  {/if}

  <div class="acts">
    {#if typed === undefined}
      <Action label={forward} weight="firm" off />
    {:else}
      {@const answer = typed}
      <Action
        label={forward}
        weight="firm"
        off={busy}
        onclick={() => {
          send(answer);
        }}
      />
    {/if}
    {#if skippable}
      <Action
        label={m.action_wizard_none_yet()}
        off={busy}
        onclick={() => {
          send(
            step === "credentials" ? { credentials: null } : { provider: null },
          );
        }}
      />
    {/if}
  </div>
</div>

<style>
  .answering {
    display: grid;
    gap: var(--sp-3);
    justify-items: start;
  }

  .prose {
    margin: 0;
    font-size: var(--text-prose);
    color: var(--muted);
    max-width: 68ch;
  }

  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
</style>
