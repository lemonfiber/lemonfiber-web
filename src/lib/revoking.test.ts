import { describe, expect, it } from "vitest";
import {
  changedByRevoking,
  everyRevoking,
  givenForRevoke,
  isRevoking,
  revoking,
  standingRevoke,
} from "./revoking";
import type { Work } from "./work";
import {
  inventory,
  komgaGrant,
  revokedGrant,
  revokeOffer,
  wouldRevoke,
} from "../api/credentials";

/** The Komga grant, as the panel asks about it. */
const asked = {
  doing: "credentials-revoke",
  plugin: komgaGrant.plugin,
  credential: komgaGrant.credential,
} as const;

/** A record of what ending the Komga grant would come to. */
const revokeRead: Work = {
  id: "71",
  doing: "credentials-revoke",
  scoped: false,
  given: { plugin: komgaGrant.plugin, credential: komgaGrant.credential },
  at: "done",
  job: undefined,
  came: { kind: "credentials", report: wouldRevoke },
};

/** A record of that grant ended under its reading. */
const revokeMade: Work = {
  ...revokeRead,
  id: "72",
  came: { kind: "credentials", report: revokedGrant },
};

describe("what the credentials panel asks for", () => {
  it("is every request it makes, and nothing else", () => {
    expect(everyRevoking.every(isRevoking)).toBe(true);
    expect(isRevoking("plugin-remove")).toBe(false);
    expect(revoking.owns("credentials-revoke")).toBe(true);
  });

  it("asks nothing before a reading, which is itself the question", () => {
    expect(revoking.question(asked)).toBeUndefined();
    expect(revoking.same(undefined, asked)).toBe(false);
  });
});

describe("what each asking sends", () => {
  it("reads the grant by the plugin and the credential", () => {
    expect(givenForRevoke(asked)).toStrictEqual({
      plugin: "comic-shelf",
      credential: "komga.api_key",
    });
  });

  it("ends it carrying the name its reading gave itself", () => {
    expect(revoking.given({ ...asked, offer: revokeOffer })).toStrictEqual({
      plugin: "comic-shelf",
      credential: "komga.api_key",
      offer: revokeOffer,
    });
  });
});

describe("what a revoke changes", () => {
  it("changes the settings once a grant is ended, and not on a reading", () => {
    expect(
      changedByRevoking({ kind: "credentials", report: revokedGrant }),
    ).toBe(true);
    expect(
      changedByRevoking({ kind: "credentials", report: wouldRevoke }),
    ).toBe(false);
    expect(changedByRevoking({ kind: "unread" })).toBe(false);
  });
});

describe("the reading standing for a yes", () => {
  it("is the newest revoke's reading, with the grant it names", () => {
    expect(standingRevoke([revokeRead])).toStrictEqual({
      id: revokeRead.id,
      offer: revokeOffer,
      plugin: "comic-shelf",
      credential: "komga.api_key",
      revoked: wouldRevoke.revoked,
    });
  });

  it("is gone once the grant is ended, or while the newest is under way", () => {
    expect(standingRevoke([revokeMade, revokeRead])).toBeUndefined();
    const underWay: Work = {
      ...revokeRead,
      at: "under-way",
      job: "j1",
    };
    expect(standingRevoke([underWay])).toBeUndefined();
    expect(standingRevoke([])).toBeUndefined();
  });

  it("is nothing where the answer holds no reading, or names no grant", () => {
    const unread: Work = { ...revokeRead, came: { kind: "unread" } };
    expect(standingRevoke([unread])).toBeUndefined();
    const plain: Work = {
      ...revokeRead,
      came: { kind: "credentials", report: { ...inventory, rehearsed: true } },
    };
    expect(standingRevoke([plain])).toBeUndefined();
    const unnamed: Work = { ...revokeRead, given: { plugin: "comic-shelf" } };
    expect(standingRevoke([unnamed])).toBeUndefined();
    const nobody: Work = {
      ...revokeRead,
      given: { credential: "komga.api_key" },
    };
    expect(standingRevoke([nobody])).toBeUndefined();
  });
});
