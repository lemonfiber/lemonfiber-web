import { describe, expect, it } from "vitest";
import { revokedLines, revokeLines } from "./revoked";
import {
  endingKomga,
  inventory,
  revokedGrant,
  revokeOffer,
  wouldRevoke,
} from "../api/credentials";
import * as m from "../paraglide/messages.js";

const reading = endingKomga;

/** What stays once the Komga grant is ended, whichever way it went. */
const after = [
  m.credential_revoke_stays({
    plugin: "comic-shelf",
    capability: "library.read",
  }),
  m.credential_revoke_rotate({ credential: "komga.api_key" }),
];

describe("what ending a grant would do", () => {
  it("names the grant, what restarts and what stays", () => {
    expect(revokeLines(reading)).toStrictEqual([
      m.credential_revoke_ends({
        plugin: "comic-shelf",
        credential: "komga.api_key",
        of: "komga",
        capability: "library.read",
      }),
      m.credential_revoke_restarts({ services: "comic-shelf" }),
      ...after,
    ]);
  });

  it("says nothing restarts where nothing reads the credential", () => {
    expect(revokeLines({ ...reading, restarts: [] })[1]).toBe(
      m.credential_revoke_restarts_none(),
    );
  });
});

describe("what a revoke came to", () => {
  it("says a reading changed nothing, and names it", () => {
    expect(revokedLines(wouldRevoke)).toStrictEqual([
      m.came_rehearsed(),
      m.credential_revoke_named({ offer: revokeOffer }),
    ]);
  });

  it("says the grant ended, what restarted, and what stays", () => {
    expect(revokedLines(revokedGrant)).toStrictEqual([
      m.came_grant_ended({
        plugin: "comic-shelf",
        credential: "komga.api_key",
      }),
      m.came_grant_restarted({ services: "comic-shelf" }),
      ...after,
    ]);
  });

  it("says the grant still stands, and why nothing restarted, in lemonfiber's words", () => {
    const why = "Docker is not answering.";
    const report = {
      ...revokedGrant,
      revoked: { ...reading, restarts: [], unrestarted: why },
    };
    expect(revokedLines(report)).toStrictEqual([
      m.came_grant_not_ended({
        plugin: "comic-shelf",
        credential: "komga.api_key",
      }),
      m.came_grant_unrestarted({ why }),
      ...after,
    ]);
  });

  it("counts the credentials where nothing was revoked", () => {
    expect(revokedLines(inventory)).toStrictEqual([
      m.came_credentials_read({ count: 2 }),
    ]);
  });
});
