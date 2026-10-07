import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Storage from "./Storage.svelte";
import { moment, unavailable } from "./fixture";
import { diskChecks } from "./findings";
import { keeper, kept, readListing, tookBackup } from "./keeping";
import { remover, storedRecord, surveyRecord } from "./removals";
import { letter, offerRecord, reckoned } from "./lettings";
import { reclaimedRecord, reclaimer, roomy } from "./reclaims";

const answered = { kind: "answered", secondsAgo: 4 } as const;
const never = { kind: "never" } as const;

const notAnswering = {
  ok: false,
  problem: {
    kind: "unreachable",
    message: "lemonfiber is not answering. It may have been stopped.",
  },
} as const;

const meta = {
  title: "Surfaces/Storage",
  component: Storage,
  args: {
    disk: moment.storage,
    live: answered,
    diagnosis: { ok: true, value: diskChecks },
    read: answered,
  },
} satisfies Meta<typeof Storage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * What is left of the disk, and everything the checks about it found. Two
 * sources, each stamped by the panel it filled.
 */
export const TheDisk: Story = {};

/**
 * Neither source has answered. Both panels hold a place rather than showing a
 * figure nothing has measured as a zero.
 */
export const BeforeAnythingAnswers: Story = {
  args: { disk: undefined, live: never, diagnosis: undefined, read: never },
};

/**
 * The volume could not be read this refresh. The panel says so inside its own
 * border, in the words the source used, and the checks beside it carry on.
 */
export const TheVolumeCouldNotBeRead: Story = {
  args: { disk: unavailable },
};

/**
 * No check about the disk has reported in. Said in words, because a panel with
 * nothing in it reads as a screen that failed.
 */
export const NoCheckHasReported: Story = {
  args: {
    diagnosis: {
      ok: true,
      value: { rehearsed: false, overall: "unknown", findings: [] },
    },
  },
};

/**
 * The reading of the checks did not answer, while the live connection is still
 * carrying the figures. One panel falling behind is visible in that panel and
 * nowhere else.
 */
export const OnlyTheChecksAreSilent: Story = {
  args: {
    diagnosis: notAnswering,
    read: { kind: "silent", secondsAgo: 180 },
  },
};

/**
 * The backups kept on this machine, with a listing standing: what the archive
 * holds, that it was taken against another data location, and the one choice
 * the yes carries.
 */
export const WhatPuttingABackupBackWouldDo: Story = {
  args: {
    keeping: {
      keeper: { ...keeper, work: [readListing] },
      archives: { ok: true, value: kept },
    },
  },
};

/**
 * Taking a backup, asked about before the yes, with the last one's record
 * under it.
 */
export const AskedBeforeABackup: Story = {
  args: {
    keeping: {
      keeper: { ...keeper, asked: { doing: "backup" }, work: [tookBackup] },
      archives: { ok: true, value: kept },
    },
  },
};

/**
 * Taking lemonfiber off, with a removal listed and not yet agreed to: every
 * line it reaches, what is still coming down, what it cannot remove and how
 * to do that by hand, and the yes that names the listing.
 */
export const WhatARemovalWouldTake: Story = {
  args: { remover: { ...remover, work: [surveyRecord] } },
};

/**
 * Everything lemonfiber keeps, listed with nothing removed, and the yes that
 * forgets it standing over the listing.
 */
export const WhatForgettingWouldTake: Story = {
  args: { remover: { ...remover, work: [storedRecord] } },
};

/**
 * The completed downloads the disk accounting names, with what letting the
 * one still being shared go would cost standing over the yes that names it.
 */
export const WhatLettingADownloadGoWouldCost: Story = {
  args: {
    letting: {
      letter: { ...letter, work: [offerRecord] },
      space: { ok: true, value: reckoned },
    },
  },
};

/**
 * Every part of the disk that could be got back with what each would cost, the
 * yes for what costs nothing under them, and what an earlier yes took and
 * could not.
 */
export const RoomToGetBack: Story = {
  args: {
    reclaiming: {
      reclaimer: { ...reclaimer, work: [reclaimedRecord] },
      space: { ok: true, value: roomy },
    },
  },
};
