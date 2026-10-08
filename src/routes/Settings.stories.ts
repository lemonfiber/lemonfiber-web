import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Settings from "./Settings.svelte";
import { configurer, everySetting, stagedChange } from "./configured";
import { inForce, putQualityBack, readCost, tuner } from "./tuned";
import { made, pairer } from "./paired";
import { alerts } from "../api/alerting";
import { wiring } from "../api/wirings";
import { filler, fillOffer } from "./fillings";
import { keyer, made as justMinted } from "./keyings";
import { plugins } from "../api/installs";
import { vocabulary } from "../api/vocabularies";
import { catalogue, provenance } from "../api/catalogues";
import { behind, versions } from "../api/copies";
import { inventory } from "../api/credentials";
import { leaving } from "../api/leavings";
import { pausedRecord, planRecord, shared, sharer, updater } from "./lined";

const answered = { kind: "answered", secondsAgo: 6 } as const;

const notAnswering = {
  ok: false,
  problem: {
    kind: "unreachable",
    message: "lemonfiber is not answering. It may have been stopped.",
  },
} as const;

const meta = {
  title: "Surfaces/Settings",
  component: Settings,
  args: {
    quality: { ok: true, value: inForce },
    settings: { ok: true, value: everySetting },
    freshness: answered,
    tuner,
    configurer,
  },
} satisfies Meta<typeof Settings>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The quality in force, over a config edited by hand: each choice in the
 * stack's own terms, the one this machine would have to transcode marked, and
 * the recorded preset offered back.
 */
export const TheQualityInForce: Story = {};

/**
 * Putting the recorded preset back, asked about before the yes, because the
 * edits made by hand are lost and nothing can be read first.
 */
export const AskedBeforeTheEditsGo: Story = {
  args: { tuner: { ...tuner, asked: { doing: "quality-reapply" } } },
};

/**
 * What fetching the library again would cost, read before the yes, with what
 * putting the recorded preset back replaced under it.
 */
export const WhatFetchingAgainWouldCost: Story = {
  args: { tuner: { ...tuner, work: [readCost, putQualityBack] } },
};

/** The reading did not answer, and says so in lemonfiber's words. */
export const NothingAnswered: Story = {
  args: { quality: notAnswering },
};

/**
 * Every setting, with a change that costs something staged under them: the
 * value in force against the one proposed, what it interrupts, what it does to
 * each library, and whether what is coming down is let finish first.
 */
export const WhatAChangeWouldCost: Story = {
  args: { configurer: { ...configurer, work: [stagedChange] } },
};

/**
 * Fresh pairing material for the companion app: the line to type, and the
 * short form of the certificate's fingerprint to check on the phone.
 */
export const PairingAPhone: Story = {
  args: { pairer: { ...pairer, work: [made] } },
};

/**
 * How the line is shared, with limits to declare, and the steps updating
 * would take, read and waiting for a yes.
 */
export const TheLineAndTheVersions: Story = {
  args: {
    line: { ok: true, value: shared },
    sharer,
    updater: { ...updater, work: [planRecord] },
  },
};

/**
 * Every download paused: one client stopped and one nobody reached, said in
 * the client's own words rather than read as paused.
 */
export const EveryDownloadPaused: Story = {
  args: {
    line: { ok: true, value: shared },
    sharer: { ...sharer, work: [pausedRecord] },
  },
};

/**
 * Everything that leaves this machine: lemonfiber's own requests, one allowed
 * and one switched off, and two services' requests, one with no record shipped
 * of what it reaches.
 */
export const WhatLeavesThisMachine: Story = {
  args: { outbound: { ok: true, value: leaving } },
};

/**
 * Every credential the stack holds, with no value among them, and what keeping
 * them in files protects against and what it does not.
 */
export const EveryCredential: Story = {
  args: { credentials: { ok: true, value: inventory } },
};

/**
 * This copy of lemonfiber: the versions in play, a newer release out, and the
 * command the tool that installed it takes to move it.
 */
export const ANewerReleaseIsOut: Story = {
  args: {
    versions: { ok: true, value: versions },
    standing: { ok: true, value: behind },
  },
};

/**
 * What the stack holds: each service with what it is for, what going without
 * it costs and where it comes from, one the record of origins does not name,
 * and the services the stack dropped.
 */
export const WhatTheStackHolds: Story = {
  args: {
    catalogue: { ok: true, value: catalogue },
    provenance: { ok: true, value: provenance },
  },
};

/**
 * What the operator is told about: the quiet preset and what it means, one kind
 * of event always told and one never told.
 */
export const WhatYouAreToldAbout: Story = {
  args: { alerts: { ok: true, value: alerts } },
};

/**
 * What is wired to what: one ask filled outright, one reaching every
 * claimant, a contest nobody has settled, a choice made with a reason, a link
 * kept to a named service, and an ask nothing fills.
 */
export const WhatIsWiredToWhat: Story = {
  args: { wiring: { ok: true, value: wiring } },
};

/**
 * The plugins: one named, signed and from a source that still answers,
 * filling a capability in place of the stack's own; one its record says
 * little about.
 */
export const ThePlugins: Story = {
  args: { plugins: { ok: true, value: plugins } },
};

/**
 * The words lemonfiber explains: one with more to it, other services' words
 * for it and its own forms, and one said in a sentence.
 */
export const TheWordsExplained: Story = {
  args: { glossary: { ok: true, value: vocabulary } },
};

/**
 * Choosing what fills a capability: the choices there are to make, and what
 * choosing Jellyseerr for requests would come to, its yes standing under it.
 */
export const ChoosingWhatFills: Story = {
  args: {
    wiring: { ok: true, value: wiring },
    filler: { ...filler, work: [fillOffer] },
  },
};

/** The integration keys: three listed, the mint form, and nothing minted. */
export const IntegrationKeys: Story = {
  args: { keyer },
};

/** A key just minted, its secret shown once with its pin and address. */
export const AKeyJustMinted: Story = {
  args: { keyer: { ...keyer, minted: justMinted } },
};
