import { describe, expect, it } from "vitest";
import { whenOf } from "./instant";
import { removedLine, wakeableLines } from "./woken";
import { pixelWoken, tabletWoken, unwoken, woken } from "../api/keylists";
import * as m from "../paraglide/messages.js";

describe("one phone that can be woken", () => {
  it("says the host it is woken through, its fingerprint and when it was registered", () => {
    expect(wakeableLines(pixelWoken)).toStrictEqual([
      m.woken_host({ host: "push.example.test" }),
      m.phones_fingerprint({ fingerprint: "f7a263f8786e9f95" }),
      m.phones_registered({ when: whenOf(1_790_000_000) }),
    ]);
  });

  it("tells two phones woken through one host apart by their fingerprints", () => {
    expect(tabletWoken.host).toBe(pixelWoken.host);
    expect(wakeableLines(tabletWoken)).not.toStrictEqual(
      wakeableLines(pixelWoken),
    );
    expect(wakeableLines(tabletWoken)[1]).toBe(
      m.phones_fingerprint({ fingerprint: "0c41d9e2b8a3576f" }),
    );
  });

  it("says lemonfiber named no host where it named none", () => {
    expect(wakeableLines({ ...pixelWoken, host: "" })[0]).toBe(
      m.woken_host_unsaid(),
    );
  });
});

describe("what a removal came to", () => {
  it("names the phone removed, and nothing where none was", () => {
    expect(removedLine(unwoken)).toBe(m.woken_removed({ name: "iphone" }));
    expect(removedLine(woken)).toBeUndefined();
    expect(removedLine(undefined)).toBeUndefined();
  });
});
