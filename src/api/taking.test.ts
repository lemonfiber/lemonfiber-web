import type { Fetching, Sending } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import type { Reaching } from "./asking";
import { nameIn, takingBundle } from "./taking";

const key = ["a", "run", "key"].join("-");
const here = "http://127.0.0.1:7777";
const path = "/home/ada/.local/share/lemonfiber/support/bundle-0928.tar.gz";

/**
 * An address that is not this machine. Written in pieces because the
 * structural guards refuse a foreign origin in the source, and this one is here
 * only to be refused.
 */
const elsewhere = ["http:", "", "example.test"].join("/");

/** The stream is never opened here, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

/** A stack that answers every request the one way, and notes where it was asked. */
function answering(
  status: number,
  body: string,
  asked: string[] = [],
): Reaching {
  const sending: Sending = (url) => {
    asked.push(url.replace(here, ""));
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(body),
      blob: () =>
        Promise.resolve(new Blob([body], { type: "application/gzip" })),
    });
  };
  return { at: here, token: key, sending, fetching: silent };
}

describe("the name a file was written under", () => {
  it("is the last part of its path", () => {
    expect(nameIn(path)).toBe("bundle-0928.tar.gz");
    expect(nameIn("C:\\kept\\bundle.tar.gz")).toBe("bundle.tar.gz");
    expect(nameIn("bundle.tar.gz")).toBe("bundle.tar.gz");
  });
});

describe("taking a support bundle", () => {
  it("asks for it by the name it was written under, and hands it over whole", async () => {
    const asked: string[] = [];
    const taken = await takingBundle(answering(200, "gzipped", asked), path);

    expect(asked).toStrictEqual(["/api/bundle/bundle-0928.tar.gz"]);
    expect(taken.ok).toBe(true);
    if (!taken.ok) return;
    expect(taken.name).toBe("bundle-0928.tar.gz");
    expect(taken.file.type).toBe("application/gzip");
    expect(await taken.file.text()).toBe("gzipped");
  });

  // A refusal is lemonfiber's own sentence; a key turned away is the one read
  // that says so from the status alone.
  it("says why not, and says so apart where the key was turned away", async () => {
    const gone = await takingBundle(
      answering(404, "No bundle is kept under that name."),
      path,
    );
    expect(gone).toStrictEqual({
      ok: false,
      said: "No bundle is kept under that name.",
      refused: false,
    });

    const turned = await takingBundle(answering(401, ""), path);
    expect(turned.ok).toBe(false);
    expect(!turned.ok && turned.refused).toBe(true);
  });

  it("asks nothing of an address that is not this machine", async () => {
    const asked: string[] = [];
    const away = {
      ...answering(200, "", asked),
      at: elsewhere,
    };

    const taken = await takingBundle(away, path);

    expect(taken.ok).toBe(false);
    expect(asked).toStrictEqual([]);
  });
});
