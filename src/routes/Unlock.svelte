<script lang="ts">
  import Action from "../components/Action.svelte";
  import Banner from "../components/Banner.svelte";
  import Field from "../components/Field.svelte";
  import type { Admitting } from "../api/admitting";
  import * as m from "../paraglide/messages.js";

  interface Props {
    /** What being handed a key or a session asks for. */
    onopen: (token: string) => void;
    /**
     * How a credential is handed over. Left out where nothing answers it, which
     * is a page that can still be opened by the key and not by a password.
     */
    onsignin?: Admitting | undefined;
    /**
     * Whether this screen replaced a console the run turned away, rather than
     * being the first thing a tab was shown.
     */
    refused?: boolean | undefined;
  }

  let { onopen, onsignin, refused = false }: Props = $props();

  let name = $state("");
  let password = $state("");
  let typed = $state("");
  let turned = $state<string | undefined>(undefined);
  let unrecognised = $state(false);
  let asking = $state(false);

  const uid = $props.id();
  const signingIn = `${uid}-signing-in`;
  const theKey = `${uid}-the-key`;

  const given = $derived(typed.trim());
  const who = $derived(name.trim());
  const ready = $derived(password !== "" && !asking);

  /**
   * Put the reader at the top of the screen that replaced the one they had.
   *
   * A console swapped out under them leaves focus on the document: the next tab
   * starts at the top of the page and nothing says why the screen changed. The
   * title is where the answer begins, so that is where they are put.
   */
  function landing(node: HTMLElement): void {
    if (refused) node.focus();
  }

  /**
   * Hand the pair over, and say what came back where it was not a way in.
   *
   * Which half of the pair was not recognised is not asked about and is not
   * shown. Two credentials open this door, and naming the one that failed would
   * say which accounts exist to whoever is guessing.
   */
  async function signIn(ask: Admitting): Promise<void> {
    if (!ready) return;

    turned = undefined;
    unrecognised = false;
    asking = true;
    const came = await ask({
      name: who === "" ? undefined : who,
      password,
    });
    asking = false;

    switch (came.at) {
      case "admitted":
        onopen(came.token);
        return;
      case "not-recognised":
        unrecognised = true;
        return;
      case "declined":
        turned = came.said;
    }
  }
</script>

<!--
  The one thing the page cannot find out for itself, asked two ways.

  A password is exchanged once for a session, and the same form takes the
  operator's own and a household member's: which of the two a pair belongs to is
  lemonfiber's answer, so nothing here chooses between them and there is no
  setting that would. What the page is then shown follows from the account.

  A run also mints a key, prints it once, and expects it back in a header on
  every request. That is no use to anybody who is not at the terminal, and it is
  the whole of what somebody who is needs, so it is asked for below rather than
  instead.

  Where this screen replaced a console the run turned away, it says so where a
  reader who cannot see the screen change is told, and takes the focus the
  swapped-out screen dropped.

  Both are forms, so either is completed by the enter key, and each is named by
  the heading above it — two unnamed forms on one screen are two of the same
  thing to anybody moving between landmarks.
-->
<main class="ask">
  <h1 tabindex="-1" use:landing>{m.unlock_title()}</h1>
  {#if refused}
    <div class="why">
      <Banner
        tone="alarm"
        lead={m.unlock_refused_lead()}
        prose={m.unlock_refused_prose()}
      />
    </div>
  {/if}
  <p class="prose">{m.unlock_prose()}</p>

  {#if onsignin !== undefined}
    {@const ask = onsignin}
    <section>
      <h2 id={signingIn}>{m.wayin_signin_title()}</h2>
      <p class="prose">{m.wayin_signin_prose()}</p>

      {#if unrecognised}
        <div class="why">
          <Banner
            tone="watch"
            lead={m.wayin_not_recognised_lead()}
            prose={m.wayin_not_recognised_prose()}
          />
        </div>
      {:else if turned !== undefined}
        <div class="why">
          <Banner tone="alarm" lead={m.wayin_declined_lead()} prose={turned} />
        </div>
      {/if}

      <form
        aria-labelledby={signingIn}
        onsubmit={(event: SubmitEvent) => {
          event.preventDefault();
          void signIn(ask);
        }}
      >
        <Field
          label={m.wayin_name_label()}
          value={name}
          hint={m.wayin_name_hint()}
          purpose="who"
          oninput={(value: string) => {
            name = value;
          }}
        />
        <Field
          label={m.wayin_password_label()}
          value={password}
          purpose="secret"
          oninput={(value: string) => {
            password = value;
          }}
        />
        <Action
          label={asking ? m.wayin_signing_in() : m.wayin_signin()}
          weight="firm"
          off={!ready}
          submits
        />
      </form>
    </section>
  {/if}

  <section>
    <h2 id={theKey}>{m.wayin_key_title()}</h2>
    <p class="prose">{m.unlock_hint()}</p>

    <form
      aria-labelledby={theKey}
      onsubmit={(event: SubmitEvent) => {
        event.preventDefault();
        if (given !== "") onopen(given);
      }}
    >
      <Field
        label={m.unlock_label()}
        value={typed}
        oninput={(value: string) => {
          typed = value;
        }}
      />

      <Action label={m.unlock_open()} weight="quiet" submits />
    </form>
  </section>
</main>

<style>
  .ask {
    max-width: 34rem;
    margin: 0 auto;
    padding: var(--sp-6) var(--sp-5);
  }

  h1 {
    margin: 0 0 var(--sp-3);
    font-family: var(--brandface);
    font-weight: 800;
    font-size: var(--lf-size-display-m);
    letter-spacing: -0.045em;
  }

  /* The title is where focus is put when this screen replaces a console, and it
     is not a place the tab order stops at, so the ring would mark somewhere
     nobody steered to. */
  h1:focus {
    outline: none;
  }

  h2 {
    margin: 0 0 var(--sp-2);
    font-size: var(--text-item);
    font-weight: 600;
  }

  section {
    margin-top: var(--sp-6);
    padding-top: var(--sp-5);
    border-top: 1px solid var(--line);
  }

  .why {
    margin: 0 0 var(--sp-5);
  }

  .prose {
    margin: 0 0 var(--sp-5);
    max-width: 62ch;
    color: var(--muted);
  }
</style>
