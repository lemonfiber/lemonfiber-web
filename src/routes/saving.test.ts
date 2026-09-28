import type { Fetching, Sending } from "@lemonfiber/sdk-ts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { offerFile, Saving } from "./saving.svelte";
import type { Reaching } from "../api/asking";

const key = ["a", "run", "key"].join("-");
const here = "http://127.0.0.1:7777";
const path = "/home/ada/.local/share/lemonfiber/support/bundle-0928.tar.gz";

/** The stream is never opened here, so nothing needs to answer it. */
const silent: Fetching = () => Promise.resolve({ ok: false, body: null });

/** A stack that answers every request the one way. */
function answering(status: number, body: string): Reaching {
  const sending: Sending = () =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(body),
      blob: () => Promise.resolve(new Blob([body])),
    });
  return { at: here, token: key, sending, fetching: silent };
}

/** The links a download was offered through, as they were clicked. */
let clicked: { readonly href: string; readonly download: string }[] = [];

/** What letting an address go was asked for. */
const revoke = vi.fn();

beforeEach(() => {
  clicked = [];
  vi.useFakeTimers();
  URL.createObjectURL = vi.fn(() => "blob:bundle");
  revoke.mockClear();
  URL.revokeObjectURL = revoke;
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    clicked.push({ href: this.href, download: this.download });
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("offering a file for saving", () => {
  it("offers it under its name, leaves nothing behind, and lets the address go", () => {
    offerFile(new Blob(["x"]), "bundle.tar.gz");

    expect(clicked).toStrictEqual([
      { href: "blob:bundle", download: "bundle.tar.gz" },
    ]);
    expect(document.querySelector("a[download]")).toBeNull();
    expect(revoke).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith("blob:bundle");
  });
});

describe("saving a bundle", () => {
  it("offers the bundle handed over, and says nothing went wrong", async () => {
    const saving = new Saving({
      reaching: () => answering(200, "gzipped"),
      onrefused: vi.fn(),
    });

    await saving.save(path);

    expect(clicked).toStrictEqual([
      { href: "blob:bundle", download: "bundle-0928.tar.gz" },
    ]);
    expect(saving.saver.said).toBeUndefined();
    expect(saving.saver.busy).toBe(false);
  });

  it("says why not in lemonfiber's words, and offers nothing", async () => {
    const onrefused = vi.fn();
    const saving = new Saving({
      reaching: () => answering(404, "No bundle is kept under that name."),
      onrefused,
    });

    saving.saver.onsave(path);
    await vi.waitFor(() => {
      expect(saving.said).toBe("No bundle is kept under that name.");
    });

    expect(clicked).toStrictEqual([]);
    expect(onrefused).not.toHaveBeenCalled();
  });

  it("passes a key turned away on", async () => {
    const onrefused = vi.fn();
    const saving = new Saving({
      reaching: () => answering(401, ""),
      onrefused,
    });

    await saving.save(path);

    expect(onrefused).toHaveBeenCalledOnce();
  });
});
