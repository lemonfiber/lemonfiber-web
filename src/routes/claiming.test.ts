import type { Fetching, Sending } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import { Keying } from "./keying.svelte";
import { enveloped, here, key } from "./served";
import { claimed, listing, made, phones, unpaired } from "../api/keylists";

/** The stream is never opened here, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

interface Sent {
  readonly asked: string;
  readonly body: string | undefined;
}

/** A run whose key routes answer as told, by method and address, noting what was sent. */
function keeping(
  answers: Partial<Record<string, { status: number; body: string }>>,
  sent: Sent[],
): { keying: Keying; onrefused: ReturnType<typeof vi.fn> } {
  const sending: Sending = (url, init) => {
    const asked = `${init.method} ${url.replace(here, "")}`;
    sent.push({ asked, body: init.body });
    const answer = answers[asked] ?? { status: 404, body: "" };
    return Promise.resolve({
      ok: answer.status < 400,
      status: answer.status,
      text: () => Promise.resolve(answer.body),
    });
  };
  const onrefused = vi.fn();
  const keying = new Keying({
    reaching: () => ({ at: here, token: key, sending, fetching: silent }),
    onrefused,
  });
  return { keying, onrefused };
}

/** A mint as the panel sends it, its password made afresh for each run. */
const minting = {
  name: "home",
  scope: "read" as const,
  purpose: "home-assistant" as const,
  password: crypto.randomUUID(),
};

const keysRead = { status: 200, body: enveloped("keys", listing) };

describe("minting a key as a claim", () => {
  it("mints with the password and the claim asked for, holds the link, and reads the keys again", async () => {
    const sent: Sent[] = [];
    const { keying } = keeping(
      {
        "POST /api/keys": {
          status: 200,
          body: enveloped("key-claim", claimed),
        },
        "GET /api/keys": keysRead,
      },
      sent,
    );
    keying.keyer.onask({ doing: "key-claim", minting });
    await vi.waitFor(() => {
      expect(keying.listing?.ok).toBe(true);
    });
    expect(sent[0]).toStrictEqual({
      asked: "POST /api/keys",
      body: JSON.stringify({ ...minting, claim: true }),
    });
    expect(keying.claimed).toStrictEqual(claimed);
    expect(keying.minted).toBeUndefined();
    expect(keying.busy).toBe(false);

    keying.keyer.onclose();
    expect(keying.claimed).toBeUndefined();
  });

  it("says a refused claim in lemonfiber's words, and holds no link", async () => {
    const said = "A key named `home` already exists.";
    const { keying } = keeping(
      { "POST /api/keys": { status: 409, body: said } },
      [],
    );
    await keying.claim(minting);
    expect(keying.said).toBe(said);
    expect(keying.claimed).toBeUndefined();
  });

  it("holds one key just minted at a time, a claim or a secret", async () => {
    const { keying } = keeping(
      {
        "POST /api/keys": {
          status: 200,
          body: enveloped("key-claim", claimed),
        },
        "GET /api/keys": keysRead,
      },
      [],
    );
    keying.minted = made;
    await keying.claim(minting);
    expect(keying.minted).toBeUndefined();
    expect(keying.claimed).toStrictEqual(claimed);
  });

  it("drops a claim held when a key is minted with its secret", async () => {
    const { keying } = keeping(
      {
        "POST /api/keys": { status: 200, body: enveloped("minted-key", made) },
        "GET /api/keys": keysRead,
      },
      [],
    );
    keying.claimed = claimed;
    await keying.mint(minting);
    expect(keying.claimed).toBeUndefined();
    expect(keying.minted).toStrictEqual(made);
  });
});

describe("the phones' hardware keys", () => {
  it("are read beside the keys", async () => {
    const sent: Sent[] = [];
    const { keying } = keeping(
      {
        "GET /api/keys": keysRead,
        "GET /api/device-keys": {
          status: 200,
          body: enveloped("device-keys", phones),
        },
      },
      sent,
    );
    await keying.read();
    expect(keying.listing).toStrictEqual({ ok: true, value: listing });
    expect(keying.phones).toStrictEqual({ ok: true, value: phones });
    expect(sent.map((one) => one.asked).sort()).toStrictEqual([
      "GET /api/device-keys",
      "GET /api/keys",
    ]);
  });

  it("are listed again on asking, and the keys are not", async () => {
    const sent: Sent[] = [];
    const { keying } = keeping(
      {
        "GET /api/device-keys": {
          status: 200,
          body: enveloped("device-keys", phones),
        },
      },
      sent,
    );
    keying.keyer.onask({ doing: "device-key-list" });
    await vi.waitFor(() => {
      expect(keying.phones?.ok).toBe(true);
    });
    expect(sent.map((one) => one.asked)).toStrictEqual([
      "GET /api/device-keys",
    ]);
  });

  it("revokes one by its name and takes them as they now stand", async () => {
    const sent: Sent[] = [];
    const { keying } = keeping(
      {
        "DELETE /api/device-keys/iphone": {
          status: 200,
          body: enveloped("device-keys", unpaired),
        },
      },
      sent,
    );
    keying.phoneSaid = "said before";
    keying.keyer.onask({ doing: "device-key-revoke", name: "iphone" });
    await vi.waitFor(() => {
      expect(keying.phones).toStrictEqual({ ok: true, value: unpaired });
    });
    expect(sent).toStrictEqual([
      { asked: "DELETE /api/device-keys/iphone", body: undefined },
    ]);
    expect(keying.phoneSaid).toBeUndefined();
    expect(keying.busy).toBe(false);
  });

  it("says a refused revoke in lemonfiber's words, and keeps them as they were", async () => {
    const said = "No device key is registered as `iphone`.";
    const { keying } = keeping(
      { "DELETE /api/device-keys/iphone": { status: 404, body: said } },
      [],
    );
    keying.phones = { ok: true, value: phones };
    await keying.revokePhone("iphone");
    expect(keying.phoneSaid).toBe(said);
    expect(keying.phones).toStrictEqual({ ok: true, value: phones });
    expect(keying.said).toBeUndefined();
  });

  it("passes on a refused key", async () => {
    const { keying, onrefused } = keeping(
      { "GET /api/device-keys": { status: 401, body: "" } },
      [],
    );
    await keying.readPhones();
    expect(onrefused).toHaveBeenCalled();
  });

  it("hands what was read and what was said to the panel", () => {
    const { keying } = keeping({}, []);
    keying.phones = { ok: true, value: phones };
    keying.claimed = claimed;
    keying.phoneSaid = "said";
    expect(keying.keyer).toMatchObject({
      phones: { ok: true, value: phones },
      claimed,
      phoneSaid: "said",
    });
  });
});
