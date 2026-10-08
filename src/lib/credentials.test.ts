import { describe, expect, it } from "vitest";
import {
  heldLines,
  wordOfMaker,
  wordOfOwner,
  wordOfState,
  type Held,
} from "./credentials";
import { staleKey, webPassword } from "../api/credentials";
import * as m from "../paraglide/messages.js";

describe("one credential, without its value", () => {
  it("says where it stands, who made it, whose it is, where it lives and what signs in with it", () => {
    expect(heldLines(webPassword)).toStrictEqual([
      m.credential_active(),
      m.credential_by_operator(),
      m.credential_of_stack(),
      m.credential_location({ location: webPassword.location }),
      m.credential_setting({ setting: "qbittorrent.password" }),
      m.credential_consumers({ consumers: "sonarr, radarr" }),
      m.credential_fingerprint({ fingerprint: "3f9a" }),
    ]);
  });

  it("says nothing signs in with it, and passes lemonfiber's advisory on", () => {
    expect(heldLines(staleKey)).toStrictEqual([
      m.credential_stale(),
      m.credential_by_service(),
      m.credential_of_plugin({ named: "plugin-komga" }),
      m.credential_location({ location: staleKey.location }),
      m.credential_setting({ setting: "komga.api_key" }),
      m.credential_unused(),
      staleKey.advisory,
    ]);
  });

  it("has a word for every state, and says so of one it has none for", () => {
    const states: readonly [Held["state"], string][] = [
      ["absent", m.credential_absent()],
      ["active", m.credential_active()],
      ["stale", m.credential_stale()],
      ["invalid", m.credential_invalid()],
      ["rotating", m.credential_rotating()],
      ["superseded", m.credential_superseded()],
    ];
    for (const [state, word] of states) expect(wordOfState(state)).toBe(word);
    expect(wordOfState("lost" as unknown as Held["state"])).toBe(
      m.credential_state_other(),
    );
  });

  it("has a word for whoever made it", () => {
    expect(wordOfMaker("lemonfiber")).toBe(m.credential_by_lemonfiber());
    expect(wordOfMaker("someone" as unknown as Held["origin"])).toBe(
      m.credential_by_other(),
    );
  });

  it("has words for whose it is, however that was settled", () => {
    const cases: readonly [Held["from"], string][] = [
      [{ origin: "operator" }, m.credential_of_stack()],
      [
        { origin: "orphaned", named: "plugin-old" },
        m.credential_of_plugin({ named: "plugin-old" }),
      ],
      [
        {
          origin: "overridden",
          named: "plugin-new",
          replaced: { from: { origin: "bundled" }, withheld: false },
        },
        m.credential_of_plugin({ named: "plugin-new" }),
      ],
      [
        { origin: "unknown", why: "The record would not read." },
        m.credential_of_unknown({ why: "The record would not read." }),
      ],
    ];
    for (const [from, word] of cases) expect(wordOfOwner(from)).toBe(word);
    expect(
      wordOfOwner({ origin: "elsewhere" } as unknown as Held["from"]),
    ).toBe(m.credential_of_other());
  });
});
