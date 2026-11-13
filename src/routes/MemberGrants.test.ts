import { render, screen } from "@testing-library/svelte";
import type { Fetching, Sending } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Member from "./Member.svelte";
import { enveloped, replying } from "../api/bodies";
import { inventory, komgaGrant } from "../api/credentials";
import { plugins, subtitles } from "../api/installs";
import { kitsId, kitsNothingPartWay, kitsShelf, yours } from "./mine";
import { here, key } from "./served";
import { grantLine, strayGrantLine } from "../lib/credentials";
import { whenOf } from "../lib/history";
import * as m from "../paraglide/messages.js";

/** What lemonfiber says to a member at a door that is not theirs. */
const notYours = "This is not something this account may ask for.";

/**
 * A stack answering a member's own reads, and the credentials and the plugins
 * too, so nothing about a grant is held back by a refusal of those reads.
 */
function answering(): Sending {
  const bodies: Record<string, string> = {
    "/api/requests": enveloped("household", yours),
    "/api/held": enveloped("held", kitsShelf),
    "/api/watching": enveloped("part-way", kitsNothingPartWay),
    "/api/credentials": enveloped("credentials", inventory),
    "/api/plugins": enveloped("plugins", plugins),
  };
  return vi.fn((url: string) => {
    const body = bodies[new URL(url).pathname];
    return Promise.resolve(
      body === undefined ? replying(403, notYours) : replying(200, body),
    );
  });
}

const fetching: Fetching = vi.fn(() =>
  Promise.resolve({ ok: false, status: 500, body: null }),
);

/** Every line a grant is drawn in on the console's side. */
const grantLines = [
  grantLine(komgaGrant),
  strayGrantLine(komgaGrant),
  ...(subtitles.granted ?? []).map((grant) =>
    m.plugin_granted({
      credential: grant.credential,
      of: grant.of,
      capability: grant.for,
      when: whenOf(grant.at),
    }),
  ),
];

describe("a plugin's grants, where a member is shown", () => {
  it.each([
    ["/", "Andor"],
    ["/held", "Arrival"],
    ["/settings", notYours],
  ])(
    "are neither drawn nor offered for revoking at %s",
    async (path, drawn) => {
      globalThis.history.replaceState(undefined, "", path);
      const sending = answering();
      render(Member, {
        reaching: { at: here, token: key, sending, fetching },
        member: kitsId,
        onrefused: vi.fn(),
      });
      expect(await screen.findAllByText(drawn)).not.toHaveLength(0);

      for (const line of grantLines) {
        expect(screen.queryByText(line)).toBeNull();
      }
      expect(
        screen.queryByRole("button", {
          name: m.action_grant_revoke({
            plugin: komgaGrant.plugin,
            credential: komgaGrant.credential,
          }),
        }),
      ).toBeNull();
      expect(
        screen.queryByRole("region", { name: m.panel_credentials() }),
      ).toBeNull();
      expect(
        screen.queryByRole("region", { name: m.panel_plugins() }),
      ).toBeNull();
      const asked = vi
        .mocked(sending)
        .mock.calls.map(([url]) => new URL(url).pathname);
      expect(asked).not.toContain("/api/credentials");
      expect(asked).not.toContain("/api/plugins");
    },
  );
});
