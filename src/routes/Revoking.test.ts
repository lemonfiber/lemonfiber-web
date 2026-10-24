import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Settings from "./Settings.svelte";
import { revokeMade, revokeRead, revoker } from "./revokings";
import {
  endingKomga,
  inventory,
  komgaGrant,
  revokedGrant,
  revokeOffer,
} from "../api/credentials";
import type { Freshness } from "../lib/freshness";
import { revokedLines, revokeLines } from "../lib/revoked";
import type { Revoker } from "../lib/revoking";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The settings screen, with the credentials read and ending a grant handed this. */
function drawn(given: Revoker): void {
  render(Settings, {
    quality: undefined,
    freshness: answered,
    credentials: { ok: true, value: inventory },
    revoker: given,
  });
}

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.credential_revoke_asked() });

const revoke = m.action_grant_revoke({
  plugin: komgaGrant.plugin,
  credential: komgaGrant.credential,
});

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

describe("ending a grant, on the settings screen", () => {
  it("reads what ending a grant would do before anything ends", async () => {
    const onask = vi.fn();
    drawn({ ...revoker, onask });

    await press(revoke);

    expect(onask).toHaveBeenCalledWith({
      doing: "credentials-revoke",
      plugin: "comic-shelf",
      credential: "komga.api_key",
    });
  });

  it("reads ending a grant whose credential is listed nowhere else too", async () => {
    const onask = vi.fn();
    const elsewhere = {
      ...komgaGrant,
      credential: "sonarr.api_key",
      of: "sonarr",
    };
    render(Settings, {
      quality: undefined,
      freshness: answered,
      credentials: { ok: true, value: { ...inventory, grants: [elsewhere] } },
      revoker: { ...revoker, onask },
    });

    await press(
      m.action_grant_revoke({
        plugin: "comic-shelf",
        credential: "sonarr.api_key",
      }),
    );
    expect(onask).toHaveBeenCalledWith({
      doing: "credentials-revoke",
      plugin: "comic-shelf",
      credential: "sonarr.api_key",
    });
  });

  it("silences the control while something is being asked", () => {
    drawn({ ...revoker, busy: true });
    expect(screen.getByRole("button", { name: revoke })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("draws the reading, labelled as nothing ended yet, above a yes naming it", async () => {
    const onask = vi.fn();
    drawn({ ...revoker, work: [revokeRead], onask });

    const reading = within(asked()).getByRole("region", {
      name: m.credential_revoke_title(),
    });
    expect(
      within(reading).getByText(
        m.credential_revoke_prose({ offer: revokeOffer }),
      ),
    ).toBeVisible();
    for (const line of revokeLines(endingKomga)) {
      expect(within(reading).getByText(line)).toBeVisible();
    }

    await userEvent.click(
      within(reading).getByRole("button", {
        name: m.action_grant_revoke_yes({ offer: revokeOffer }),
      }),
    );
    expect(onask).toHaveBeenCalledWith({
      doing: "credentials-revoke",
      plugin: "comic-shelf",
      credential: "komga.api_key",
      offer: revokeOffer,
    });
  });

  it("puts the reading away without ending anything", async () => {
    const ondrop = vi.fn();
    drawn({ ...revoker, work: [revokeRead], ondrop });

    await userEvent.click(
      within(asked()).getByRole("button", { name: m.action_leave_as_is() }),
    );
    expect(ondrop).toHaveBeenCalledWith(revokeRead.id);
  });

  it("leaves putting a record away to whatever it is handed, holding no record of its own", async () => {
    drawn({ ...revoker, work: [revokeMade] });

    await userEvent.click(
      within(asked()).getByRole("button", { name: m.action_hide_record() }),
    );
    expect(
      within(asked()).getByText(m.doing_revoke_grant_title()),
    ).toBeVisible();
  });

  it("says what ending the grant came to, and puts the record away", async () => {
    const ondrop = vi.fn();
    drawn({ ...revoker, work: [revokeMade], ondrop });

    expect(
      within(asked()).queryByRole("region", {
        name: m.credential_revoke_title(),
      }),
    ).toBeNull();
    for (const line of revokedLines(revokedGrant)) {
      expect(within(asked()).getByText(line)).toBeVisible();
    }

    await userEvent.click(
      within(asked()).getByRole("button", { name: m.action_hide_record() }),
    );
    expect(ondrop).toHaveBeenCalledWith(revokeMade.id);
  });
});
