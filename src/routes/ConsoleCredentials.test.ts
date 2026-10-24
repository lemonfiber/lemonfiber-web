import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import {
  enveloped,
  fresh,
  here,
  key,
  stack,
  times,
  type Asked,
  type Says,
} from "./served";
import {
  inventory,
  komgaGrant,
  revokedGrant,
  revokeOffer,
  webPassword,
  wouldRevoke,
} from "../api/credentials";
import * as m from "../paraglide/messages.js";

/** Where the settings screen reads the credentials. */
const credentials = "/api/credentials";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

describe("the credentials, from the settings screen", () => {
  it("is read on the way in, with the other settings", async () => {
    globalThis.history.replaceState(undefined, "", "/settings");
    const sent = fresh();
    const sending = stack(
      {
        acting: {},
        becoming: [],
        reading: {
          [credentials]: {
            status: 200,
            body: enveloped("credentials", inventory),
          },
        },
      },
      sent,
    );
    render(Console, {
      reaching: { at: here, token: key, sending, fetching: silent },
      onrefused: vi.fn(),
      pausing: () => Promise.resolve(),
    });

    const panel = await screen.findByRole("region", {
      name: m.panel_credentials(),
    });
    expect(
      await within(panel).findByRole("heading", { name: webPassword.name }),
    ).toBeVisible();
    expect(times(sent, credentials)).toBe(1);
  });
});

/** The settings screen, against a stack whose revokes answer as told. */
function revoking(
  asked: Asked,
  acting: Partial<Record<string, readonly Says[]>>,
): void {
  globalThis.history.replaceState(undefined, "", "/settings");
  const sending = stack(
    {
      acting,
      becoming: [],
      reading: {
        [credentials]: {
          status: 200,
          body: enveloped("credentials", inventory),
        },
      },
    },
    asked,
  );
  render(Console, {
    reaching: { at: here, token: key, sending, fetching: silent },
    onrefused: vi.fn(),
    pausing: () => Promise.resolve(),
  });
}

describe("ending a grant, from the settings screen", () => {
  it("reads the revoke first, ends the grant on a yes naming the reading, and reads the credentials again", async () => {
    const sent = fresh();
    revoking(sent, {
      "credentials-revoke": [
        { status: 200, body: enveloped("credentials", wouldRevoke) },
        { status: 200, body: enveloped("credentials", revokedGrant) },
      ],
    });

    await userEvent.click(
      await screen.findByRole("button", {
        name: m.action_grant_revoke({
          plugin: komgaGrant.plugin,
          credential: komgaGrant.credential,
        }),
      }),
    );
    const asked = screen.getByRole("status", {
      name: m.credential_revoke_asked(),
    });
    await userEvent.click(
      await within(asked).findByRole("button", {
        name: m.action_grant_revoke_yes({ offer: revokeOffer }),
      }),
    );
    expect(
      await within(asked).findByText(
        m.came_grant_ended({
          plugin: komgaGrant.plugin,
          credential: komgaGrant.credential,
        }),
      ),
    ).toBeInTheDocument();
    expect(sent.posted).toStrictEqual([
      {
        at: "/api/actions/credentials-revoke",
        body: JSON.stringify({
          plugin: "comic-shelf",
          credential: "komga.api_key",
        }),
      },
      {
        at: "/api/actions/credentials-revoke",
        body: JSON.stringify({
          plugin: "comic-shelf",
          credential: "komga.api_key",
          offer: revokeOffer,
        }),
      },
    ]);
    expect(times(sent, credentials)).toBe(2);
  });

  it("says a refused revoke in lemonfiber's words", async () => {
    const none = "comic-shelf holds no grant of komga.api_key.";
    revoking(fresh(), {
      "credentials-revoke": [{ status: 404, body: none }],
    });

    await userEvent.click(
      await screen.findByRole("button", {
        name: m.action_grant_revoke({
          plugin: komgaGrant.plugin,
          credential: komgaGrant.credential,
        }),
      }),
    );
    const asked = screen.getByRole("status", {
      name: m.credential_revoke_asked(),
    });
    expect(await within(asked).findByText(none)).toBeInTheDocument();
  });
});
