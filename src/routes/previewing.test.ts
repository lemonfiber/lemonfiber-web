import { describe, expect, it, vi } from "vitest";
import { keeping, type Sent } from "./keying.testing";
import { enveloped } from "./served";
import { listing, phones, unwoken, woken } from "../api/keylists";

/** The body a preview is sent with, and the only one a revocation takes. */
const previewing = JSON.stringify({ dry_run: true });

/** The phones that can be woken, as a preview of removing the iPhone answers them. */
const wouldUnwake = { ...woken, rehearsed: true, removed: "iphone" };

describe("previewing a revocation", () => {
  it("sends a preview with dry_run and the yes with none, revoking nothing until the yes", async () => {
    const sent: Sent[] = [];
    const answers = {
      "DELETE /api/push-endpoints/iphone": {
        status: 200,
        body: enveloped("push-endpoints", wouldUnwake),
      },
    };
    const { keying } = keeping(answers, sent);
    keying.woken = { ok: true, value: woken };
    keying.keyer.onask({
      doing: "push-endpoint-remove",
      name: "iphone",
      dryRun: true,
    });
    await vi.waitFor(() => {
      expect(keying.previewed).toStrictEqual({
        doing: "push-endpoint-remove",
        name: "iphone",
        answer: { ok: true, value: true },
      });
    });
    expect(sent).toStrictEqual([
      { asked: "DELETE /api/push-endpoints/iphone", body: previewing },
    ]);
    expect(keying.woken).toStrictEqual({ ok: true, value: woken });
    expect(keying.keyer.previewed).toBe(keying.previewed);

    answers["DELETE /api/push-endpoints/iphone"] = {
      status: 200,
      body: enveloped("push-endpoints", unwoken),
    };
    keying.keyer.onask({ doing: "push-endpoint-remove", name: "iphone" });
    await vi.waitFor(() => {
      expect(keying.woken).toStrictEqual({ ok: true, value: unwoken });
    });
    expect(sent[1]).toStrictEqual({
      asked: "DELETE /api/push-endpoints/iphone",
      body: undefined,
    });
    expect(keying.previewed).toBeUndefined();
  });

  it("previews revoking a key and a phone's key with dry_run, each by its own route", async () => {
    const sent: Sent[] = [];
    const { keying } = keeping(
      {
        "DELETE /api/keys/home": {
          status: 200,
          body: enveloped("keys", {
            ...listing,
            rehearsed: true,
            revoked: "home",
          }),
        },
        "DELETE /api/device-keys/iphone": {
          status: 200,
          body: enveloped("device-keys", {
            ...phones,
            rehearsed: true,
            revoked: "iphone",
          }),
        },
      },
      sent,
    );
    await keying.revoke("home", true);
    expect(keying.previewed).toStrictEqual({
      doing: "key-revoke",
      name: "home",
      answer: { ok: true, value: true },
    });
    expect(keying.listing).toBeUndefined();
    keying.keyer.onask({
      doing: "device-key-revoke",
      name: "iphone",
      dryRun: true,
    });
    await vi.waitFor(() => {
      expect(keying.previewed?.doing).toBe("device-key-revoke");
    });
    expect(keying.phones).toBeUndefined();
    expect(sent).toStrictEqual([
      { asked: "DELETE /api/keys/home", body: previewing },
      { asked: "DELETE /api/device-keys/iphone", body: previewing },
    ]);
  });

  it("keeps a refused preview beside its question, saying nothing of the revoke itself", async () => {
    const said = "No device key is registered as `iphone`.";
    const { keying } = keeping(
      { "DELETE /api/device-keys/iphone": { status: 404, body: said } },
      [],
    );
    await keying.revokePhone("iphone", true);
    expect(keying.previewed).toMatchObject({
      doing: "device-key-revoke",
      name: "iphone",
      answer: { ok: false, problem: { message: said } },
    });
    expect(keying.phoneSaid).toBeUndefined();
    expect(keying.busy).toBe(false);
  });

  it("takes an answer lemonfiber did not give as a preview as the revocation itself", async () => {
    const { keying } = keeping(
      {
        "DELETE /api/push-endpoints/iphone": {
          status: 200,
          body: enveloped("push-endpoints", unwoken),
        },
      },
      [],
    );
    await keying.removeWoken("iphone", true);
    expect(keying.previewed).toBeUndefined();
    expect(keying.woken).toStrictEqual({ ok: true, value: unwoken });
  });

  it("drops what a preview answered once the question is left", async () => {
    const { keying } = keeping(
      {
        "DELETE /api/push-endpoints/iphone": {
          status: 200,
          body: enveloped("push-endpoints", wouldUnwake),
        },
      },
      [],
    );
    await keying.removeWoken("iphone", true);
    expect(keying.previewed).toBeDefined();
    keying.keyer.onleave();
    expect(keying.previewed).toBeUndefined();
  });
});
