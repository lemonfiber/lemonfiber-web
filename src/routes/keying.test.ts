import type { Fetching, Sending } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import { Keying } from "./keying.svelte";
import { enveloped, here, key } from "./served";
import { listing, made } from "../api/keylists";

/** The stream is never opened here, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

interface Sent {
  readonly method: string;
  readonly at: string;
  readonly body: string | undefined;
}

/** A run whose key routes answer as told, by method, noting what was sent. */
function keeping(
  answers: Partial<Record<string, { status: number; body: unknown }>>,
  sent: Sent[],
): { keying: Keying; onrefused: ReturnType<typeof vi.fn> } {
  const sending: Sending = (url, init) => {
    sent.push({
      method: init.method,
      at: url.replace(here, ""),
      body: init.body,
    });
    const answer = answers[init.method] ?? { status: 404, body: "" };
    return Promise.resolve({
      ok: answer.status < 400,
      status: answer.status,
      text: () =>
        Promise.resolve(
          typeof answer.body === "string"
            ? answer.body
            : JSON.stringify(answer.body),
        ),
    });
  };
  const onrefused = vi.fn();
  const keying = new Keying({
    reaching: () => ({ at: here, token: key, sending, fetching: silent }),
    onrefused,
  });
  return { keying, onrefused };
}

const minting = {
  name: "home",
  scope: "read" as const,
  purpose: "home-assistant" as const,
  password: "hunter2",
};

describe("keeping integration keys", () => {
  it("reads every key", async () => {
    const { keying } = keeping(
      { GET: { status: 200, body: enveloped("keys", listing) } },
      [],
    );
    await keying.read();
    expect(keying.listing).toStrictEqual({ ok: true, value: listing });
  });

  it("mints with the password in the body, holds the secret, and reads the keys again", async () => {
    const sent: Sent[] = [];
    const { keying } = keeping(
      {
        POST: { status: 200, body: enveloped("minted-key", made) },
        GET: { status: 200, body: enveloped("keys", listing) },
      },
      sent,
    );
    keying.keyer.onask({ doing: "key-mint", minting });
    await vi.waitFor(() => {
      expect(keying.listing?.ok).toBe(true);
    });
    expect(sent[0]).toStrictEqual({
      method: "POST",
      at: "/api/keys",
      body: JSON.stringify(minting),
    });
    expect(keying.minted).toStrictEqual(made);
    expect(keying.busy).toBe(false);

    keying.keyer.onclose();
    expect(keying.minted).toBeUndefined();
  });

  it("says a refused mint in lemonfiber's words, and holds no secret", async () => {
    const said = "A key named `home` already exists.";
    const { keying } = keeping({ POST: { status: 409, body: said } }, []);
    await keying.mint(minting);
    expect(keying.said).toBe(said);
    expect(keying.minted).toBeUndefined();
  });

  it("revokes by name and takes the keys as they now stand", async () => {
    const sent: Sent[] = [];
    const { keying } = keeping(
      { DELETE: { status: 200, body: enveloped("keys", listing) } },
      sent,
    );
    keying.keyer.onask({ doing: "key-revoke", name: "home" });
    await vi.waitFor(() => {
      expect(keying.listing).toStrictEqual({ ok: true, value: listing });
    });
    expect(sent[0]).toMatchObject({ method: "DELETE", at: "/api/keys/home" });
  });

  it("says a refused revoke in lemonfiber's words", async () => {
    const said = "There is no key named `home`.";
    const { keying } = keeping({ DELETE: { status: 404, body: said } }, []);
    await keying.revoke("home");
    expect(keying.said).toBe(said);
    expect(keying.listing).toBeUndefined();
  });

  it("lists the keys again on asking", async () => {
    const sent: Sent[] = [];
    const { keying } = keeping(
      { GET: { status: 200, body: enveloped("keys", listing) } },
      sent,
    );
    keying.keyer.onask({ doing: "key-list" });
    await vi.waitFor(() => {
      expect(keying.listing?.ok).toBe(true);
    });
    expect(sent[0]).toMatchObject({ method: "GET", at: "/api/keys" });
  });

  it("passes on a refused key", async () => {
    const { keying, onrefused } = keeping(
      { GET: { status: 401, body: "" } },
      [],
    );
    await keying.read();
    expect(onrefused).toHaveBeenCalled();
  });

  it("says why a client could not be opened", async () => {
    const onrefused = vi.fn();
    const sending: Sending = () =>
      Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(""),
      });
    const keying = new Keying({
      reaching: () => ({
        at: "ftp://198.51.100.7",
        token: key,
        sending,
        fetching: silent,
      }),
      onrefused,
    });
    await keying.read();
    await keying.mint(minting);
    await keying.revoke("home");
    expect(keying.listing?.ok).toBe(false);
    expect(keying.said).toBeDefined();
  });
});
