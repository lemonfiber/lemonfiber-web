import { describe, expect, it } from "vitest";
import { whenOf } from "./instant";
import { hostOf, removedLine, wakeableLines } from "./woken";
import { iphoneWoken, pixelWoken, unwoken, woken } from "../api/keylists";
import * as m from "../paraglide/messages.js";

describe("one phone that can be woken", () => {
  it("says the host it is woken through and when it was registered, and no more of its address", () => {
    expect(wakeableLines(pixelWoken)).toStrictEqual([
      m.woken_host({ host: "push.example.test" }),
      m.phones_registered({ when: whenOf(1_790_000_000) }),
    ]);
    const lines = wakeableLines(iphoneWoken).join(" ");
    expect(lines).toContain("wake.example.test:8443");
    expect(lines).not.toContain(new URL(iphoneWoken.endpoint).search);
    expect(lines).not.toContain(new URL(pixelWoken.endpoint).pathname);
  });

  it("says nothing of an address it cannot read", () => {
    const unread = { ...pixelWoken, endpoint: "not an address" };
    expect(wakeableLines(unread)[0]).toBe(m.woken_host_unread());
    expect(hostOf("mailto:someone")).toBeUndefined();
  });
});

describe("what a removal came to", () => {
  it("names the phone removed, and nothing where none was", () => {
    expect(removedLine(unwoken)).toBe(m.woken_removed({ name: "iphone" }));
    expect(removedLine(woken)).toBeUndefined();
    expect(removedLine(undefined)).toBeUndefined();
  });
});
