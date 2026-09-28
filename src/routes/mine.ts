/**
 * One household member's own answers, as lemonfiber narrows them to that member.
 *
 * The household read answers a member with their own row and nobody else's, and
 * the shelf read answers with what the media server shows that member. Written
 * against the generated contract rather than invented, and set in the household
 * the console's fixtures describe.
 */
import { household } from "./house";
import type { Household, Member } from "../lib/wire";
import type { Shelf } from "../lib/yours";

/** The id the media server files the member signed in under. */
export const kitsId = "b41c9e";

/** The member signed in: held to a rating and to two libraries, nearly out. */
export const kit: Member = {
  name: "Kit",
  claimed: true,
  standing: "active",
  last_seen: "2026-08-24T19:02:41Z",
  access: {
    administrator: false,
    age_limit: 12,
    disabled: false,
    every_library: false,
    libraries: ["Films", "Series"],
    rated: { allows: ["U", "PG"], holds_back: ["12A"], fell_back: false },
    restriction: "both",
    unrated: "held-back",
  },
  asking: {
    films: { used: 4, limit: 5, remaining: 1, period: "a month" },
    television: { used: 3, limit: 5, remaining: 2, period: "a month" },
    frees_up: "2026-09-14T00:00:00Z",
    policy: "within-a-limit",
    standing: "near-quota",
  },
  requests: [
    {
      id: 44,
      title: null,
      media: "film",
      state: "waiting-for-approval",
      waiting_days: 6,
    },
    { id: 43, title: "Some Film Nobody Filed", media: "film", state: "failed" },
    {
      id: 22,
      title: "Something Turned Down",
      media: "film",
      state: "declined",
      refused: { reason: "Not this one, it is too late in the evening." },
    },
    { id: 12, title: "Andor", media: "series", state: "here" },
  ],
  to_hand_over: [
    "What you ask for waits for an answer. Four of the five films this month are spent.",
  ],
};

/**
 * What the household read answers Kit with: their own row, and the findings
 * and the account of the limits that are the operator's to read.
 */
export const yours: Household = {
  ...household,
  findings: ["The request service answered, but slowly."],
  members: [kit],
};

/** Kit, before they have asked for anything. */
export const yoursUnasked: Household = {
  ...yours,
  members: [{ ...kit, requests: [] }],
};

/** Kit, with nothing left of the period's allowance. */
export const yoursSpent: Household = {
  ...yours,
  members: [
    {
      ...kit,
      asking: {
        films: { used: 5, limit: 5, remaining: 0, period: "a month" },
        television: { used: 5, limit: 5, remaining: 0, period: "a month" },
        frees_up: "2026-09-14T12:00:00Z",
        policy: "within-a-limit",
        standing: "quota-exhausted",
      },
    },
  ],
};

/** The household read, where the media server could not be asked. */
export const yoursUnread: Household = {
  available: false,
  findings: ["The media server did not answer."],
  members: [],
};

/** What the household holds that Kit can watch, newest first. */
export const kitsShelf: Shelf = {
  available: true,
  findings: [],
  id: kitsId,
  member: "Kit",
  holdings: [
    { id: "f01", medium: "film", title: "Arrival", year: 2016 },
    { id: "s01", medium: "series", title: "The Expanse", year: null },
    { id: "o01", medium: "other", title: "A Concert Nobody Filed" },
  ],
};

/** A shelf that was read and holds nothing Kit can watch. */
export const kitsEmptyShelf: Shelf = { ...kitsShelf, holdings: [] };

/** A shelf the media server would not give up, which is not an empty one. */
export const kitsUnreadShelf: Shelf = {
  available: false,
  findings: [
    "the media server would not say what this member holds, so the shelf is reported as unread rather than as empty",
  ],
  id: kitsId,
  member: "Kit",
  holdings: [],
};
