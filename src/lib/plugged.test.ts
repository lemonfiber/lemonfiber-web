import { describe, expect, it } from "vitest";
import {
  describedLines,
  pairLines,
  pluggedLines,
  reachesLines,
  recipeLines,
  removalLines,
  titleOfPlug,
  updateLines,
  verificationLines,
  writesLines,
  type PluginInstall,
  type Plugs,
} from "./plugged";
import { everyPlugging } from "./plugging";
import { installedLines } from "./plugins";
import { undoLines } from "./undone";
import {
  installed,
  installOffer,
  kept,
  madeInstall,
  readInstall,
  released,
  signIn,
  wouldInstall,
  wouldRemove,
  wouldUpdate,
} from "../api/plugs";
import { plugins } from "../api/installs";
import * as m from "../paraglide/messages.js";

/** An install that writes, reaches and declares nothing. */
const bare: PluginInstall = {
  changes: [],
  overrides: [],
  contests: [],
  proofs: [],
  recipes_ran: [],
  recorded: false,
  would: { plugin: "hand-rolled", version: "0.1.0", services: [] },
};

describe("what a record of an act on a plugin is headed", () => {
  it.each(everyPlugging)("heads %s with what it is doing", (doing) => {
    expect(titleOfPlug(doing)).not.toBe("");
  });
});

describe("what an install would write", () => {
  it("names every change where it lands, then each setting it changes and each ask it leaves contested", () => {
    expect(writesLines(wouldInstall)).toStrictEqual([
      m.plug_writes_directory({ path: "/srv/lemonfiber/plugins/subfetch" }),
      m.plug_writes_document({ path: "/srv/lemonfiber/compose/subfetch.yml" }),
      m.plug_writes_region({ path: "/srv/lemonfiber/proxy/routes.conf" }),
      m.plug_overrides({
        setting: "bazarr.enabled",
        why: "It fetches subtitles itself.",
      }),
      m.plug_contests({
        capability: "subtitles",
        by: "jellyfin",
        claimants: "bazarr, subfetch",
      }),
    ]);
  });

  it("names a key it writes for one of the plugin's services", () => {
    const keyed: PluginInstall = {
      ...bare,
      changes: [{ path: "/srv/lemonfiber/plugins/subfetch/key", puts: "key" }],
    };
    expect(writesLines(keyed)).toStrictEqual([
      m.plug_writes_key({ path: "/srv/lemonfiber/plugins/subfetch/key" }),
    ]);
  });

  it("says a change it has no word for as that, and an install writing nothing as that", () => {
    const odd = {
      ...bare,
      changes: [{ path: "/x", puts: "link" as unknown as "region" }],
    };
    expect(writesLines(odd)).toStrictEqual([
      m.plug_writes_other({ path: "/x" }),
    ]);
    expect(writesLines(bare)).toStrictEqual([m.plug_writes_nothing()]);
  });
});

describe("what an install would reach", () => {
  it("says how each service is reached, where its recipes go and what it holds", () => {
    expect(reachesLines(wouldInstall)).toStrictEqual([
      m.plug_reached_household({
        service: "subfetch",
        hostname: "subs.home",
        port: "8080",
      }),
      m.plug_reached_loopback({ service: "subfetch-worker", port: "9090" }),
      m.plug_reached_none({ service: "subfetch-cron" }),
      m.plug_reaches({ destinations: "opensubtitles" }),
      m.plug_secret({
        id: "account",
        of: "opensubtitles",
        why: "To sign in for more answers.",
      }),
    ]);
  });

  it("says a plugin reaching nowhere outside the stack does not", () => {
    expect(reachesLines(bare)).toStrictEqual([m.plug_reaches_nothing()]);
  });
});

describe("how an install is proved", () => {
  it("names each proof, what it establishes and why, and that the checks run once it is in place", () => {
    expect(verificationLines(wouldInstall)).toStrictEqual([
      m.plug_proof_of({
        proof: "answers",
        asks: "GET /health",
        of: "subfetch",
      }),
      "The fetcher answers.",
      "A fetcher that does not answer fetches nothing.",
      m.plug_proof({ proof: "lists", asks: "GET /languages" }),
      "It lists the languages it fetches.",
      "The language setting is chosen from this list.",
      m.plug_verified_after(),
    ]);
  });

  it("says what each proof came to, what it was asked of, and what the checks made of it", () => {
    const asked = (
      came_to: NonNullable<PluginInstall["proofs"][number]["came_to"]>,
    ): PluginInstall["proofs"][number] => ({
      proof: "p",
      asks: "GET /",
      establishes: "e",
      why: "w",
      came_to,
    });
    const ran: PluginInstall = {
      ...bare,
      against: "recordings",
      proofs: [
        asked({ outcome: "passed" }),
        asked({ outcome: "failed", faults: ["status 500", "no body"] }),
        asked({ outcome: "unproven", why: "No recording." }),
        asked({ outcome: "failing-as-declared", declared: [] }),
        asked({ outcome: "odd" } as unknown as { outcome: "passed" }),
      ],
      verified: {
        broke: [{ now: { title: "Subtitles found" } }],
        unsettled: [{ now: { title: "Disk space" } }],
      } as unknown as NonNullable<PluginInstall["verified"]>,
    };
    const lines = verificationLines(ran);
    expect(lines).toContain(m.plug_proof_passed({ proof: "p" }));
    expect(lines).toContain(
      m.plug_proof_failed({ proof: "p", faults: "status 500 no body" }),
    );
    expect(lines).toContain(
      m.plug_proof_unproven({ proof: "p", why: "No recording." }),
    );
    expect(lines).toContain(m.plug_proof_declared({ proof: "p", count: 0 }));
    expect(lines).toContain(m.plug_proof_other({ proof: "p" }));
    expect(lines).toContain(m.plug_against_recordings());
    expect(lines).toContain(m.plug_broke({ title: "Subtitles found" }));
    expect(lines).toContain(m.plug_unsettled({ title: "Disk space" }));
  });

  it("says a plugin with no proof has none, and checks that read as before do", () => {
    const clean: PluginInstall = {
      ...bare,
      against: "service",
      verified: { broke: [], unsettled: [] },
    };
    expect(verificationLines(clean)).toStrictEqual([
      m.plug_proofs_none(),
      m.plug_against_service(),
      m.plug_verified_clean(),
    ]);
  });
});

describe("each recipe and each value it could carry", () => {
  it("says why a recipe runs and every call it makes, through an adapter or outside", () => {
    expect(recipeLines(signIn)).toStrictEqual([
      "Without an account the service answers ten times a day.",
      m.plug_step({
        method: "GET",
        path: "/api/v3/config",
        to: "sonarr",
        adapter: "servarr",
      }),
      m.plug_step_outside({
        method: "POST",
        path: "/login",
        to: "opensubtitles",
      }),
    ]);
    expect(recipeLines({ ...signIn, steps: [], pairs: [] })).toStrictEqual([
      signIn.why,
      m.plug_pairs_none(),
    ]);
  });

  it("says a released value's service and why it leaves, and what approving it is written as", () => {
    expect(pairLines(released)).toStrictEqual([
      m.plug_pair({
        value: "api_key",
        to: "opensubtitles",
        origin: "credential-store",
      }),
      m.plug_release_from({
        value: "api_key",
        from: "sonarr",
        release: "The subtitle service needs the key to answer.",
      }),
      m.plug_approval({ approval: "api_key@opensubtitles" }),
    ]);
  });

  it("says a value nobody owns as carried, and a release with no service named", () => {
    expect(pairLines(kept)).toStrictEqual([
      m.plug_pair_unowned({ value: "language", to: "subfetch" }),
    ]);
    expect(pairLines({ ...kept, release: "It leaves." })).toStrictEqual([
      m.plug_pair_unowned({ value: "language", to: "subfetch" }),
      m.plug_release({ value: "language", release: "It leaves." }),
    ]);
  });
});

describe("what the plugin is", () => {
  it("says what it does and where it comes from, then what it declares", () => {
    expect(describedLines(wouldInstall)).toStrictEqual([
      ...installedLines(wouldInstall.would, []),
      m.plug_license({ license: "MIT" }),
      m.plug_upstream({ upstream: "example.org/subtitle-fetch" }),
      m.plug_reviewed_not(),
      m.plug_claims({ claims: "subtitles" }),
    ]);
  });

  it("says a reviewed plugin was, and leaves out what it did not declare", () => {
    const declared = {
      ...bare,
      would: { ...bare.would, declared: { reviewed: true, claims: [] } },
    };
    expect(describedLines(declared)).toStrictEqual([
      ...installedLines(bare.would, []),
      m.plug_reviewed(),
    ]);
    const silent = { ...bare, would: { ...bare.would, declared: {} } };
    expect(describedLines(silent)).toStrictEqual(
      installedLines(bare.would, []),
    );
    expect(describedLines(bare)).toStrictEqual(installedLines(bare.would, []));
  });
});

describe("what an update or a removal would come to", () => {
  it("says the versions on either side, what stops, and what goes back", () => {
    expect(updateLines(wouldUpdate)).toStrictEqual([
      m.plug_update({ plugin: "subtitle-fetch", from: "1.4.0", to: "1.5.0" }),
      m.plug_interrupts({ services: "subfetch" }),
      ...undoLines(wouldUpdate.went_back),
    ]);
  });

  it("says what a removal stops and leaves with nothing filling it", () => {
    expect(removalLines(wouldRemove)).toStrictEqual([
      m.plug_interrupts_none(),
      m.plug_leaves({ capability: "subtitles", plugin: "subtitle-fetch" }),
      ...undoLines(wouldRemove.went_back),
    ]);
  });
});

describe("what a record of an act on a plugin came to", () => {
  it("says a reading wrote nothing, and names it", () => {
    expect(pluggedLines(readInstall)).toStrictEqual([
      m.came_rehearsed(),
      m.plug_offer_named({ offer: installOffer }),
    ]);
    expect(pluggedLines({ ...readInstall, agreement: null })).toStrictEqual([
      m.came_rehearsed(),
    ]);
  });

  it("says an install that ran was installed, and what each recipe did", () => {
    expect(pluggedLines(madeInstall)).toStrictEqual([
      m.plug_installed({ plugin: "subtitle-fetch", version: "1.4.0" }),
      m.plug_recipe_held({ recipe: "sign-in" }),
    ]);
  });

  it("says an install that did not hold was not, what broke and what went back", () => {
    const failed: Plugs = {
      ...plugins,
      install: {
        ...wouldInstall,
        recipes_ran: [
          { recipe: "sign-in", held: false, steps: [], why: "Refused." },
          { recipe: "other", held: false, steps: [] },
        ],
        verified: {
          broke: [{ now: { title: "Proxy answers" } }],
          unsettled: [],
        } as unknown as NonNullable<PluginInstall["verified"]>,
        reversed: { rehearsed: false, reversed: [], left: [] },
      },
    };
    expect(pluggedLines(failed)).toStrictEqual([
      m.plug_installed_not({ plugin: "subtitle-fetch" }),
      m.plug_recipe_failed({ recipe: "sign-in", why: "Refused." }),
      m.plug_recipe_failed({ recipe: "other", why: "" }),
      m.plug_broke({ title: "Proxy answers" }),
      ...undoLines({ rehearsed: false, reversed: [], left: [] }),
    ]);
  });

  it("says an update that ran is the new version, or why the old one is back", () => {
    const made = { ...wouldUpdate, install: installed };
    expect(pluggedLines({ ...plugins, update: made })).toStrictEqual([
      m.plug_updated({ plugin: "subtitle-fetch", to: "1.5.0" }),
    ]);
    const back = (running: boolean): Plugs => ({
      ...plugins,
      update: {
        ...wouldUpdate,
        stopped: "The new version did not start.",
        restored: { version: "1.4.0", placed: true, running },
      },
    });
    expect(pluggedLines(back(true))).toStrictEqual([
      m.plug_updated_not({ plugin: "subtitle-fetch", from: "1.4.0" }),
      "The new version did not start.",
      m.plug_restored({ version: "1.4.0" }),
    ]);
    expect(pluggedLines(back(false)).at(-1)).toBe(
      m.plug_restored_stopped({ version: "1.4.0" }),
    );
  });

  it("says a removal that ran removed it or did not, and what went back", () => {
    const gone = { ...wouldRemove, removed: true };
    expect(pluggedLines({ ...plugins, removal: gone })).toStrictEqual([
      m.plug_removed({ plugin: "subtitle-fetch" }),
      ...undoLines(gone.went_back),
    ]);
    expect(pluggedLines({ ...plugins, removal: wouldRemove })[0]).toBe(
      m.plug_removed_not({ plugin: "subtitle-fetch" }),
    );
  });

  it("says an install stopped before its checks ran was not installed, and no more", () => {
    expect(pluggedLines({ ...plugins, install: bare })).toStrictEqual([
      m.plug_installed_not({ plugin: "hand-rolled" }),
    ]);
  });

  it("says how many plugins are installed where nothing was acted on", () => {
    expect(pluggedLines(plugins)).toStrictEqual([m.plug_count({ count: 2 })]);
  });
});
