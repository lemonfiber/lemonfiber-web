/**
 * One household, as the server would describe it.
 *
 * The same record reaches two screens: the household read the requests screen
 * is drawn from, and the panel the stream carries on the dashboard. It is
 * written once here so the two cannot drift, and written against the generated
 * contract rather than invented.
 */
import type { Door, House, Household } from "../lib/wire";

/**
 * Where the front door is reached, assembled rather than written.
 *
 * The structural guards refuse an origin in the source that is not this
 * machine, and the front door is one by construction: it is the address the
 * other devices in the house are handed.
 */
const reached = (host: string): string => ["http:", "", host].join("/");

/** The address this machine publishes the front door at. */
export const doorAddress = reached("lemonfiber.local:5055");

/** The address a machine with no friendly name to publish falls back to. */
export const doorNumbered = reached("198.51.100.24:5055");

/** The household's one front door, as the stream last read it. */
export const frontDoor: Door = {
  standing: "established",
  chosen: { chosen: "derived" },
  service: "Jellyseerr",
  facing: "asking",
  meaning:
    "Anybody in the house opens this, asks for what they want, and follows what they asked for from the same page.",
  address: { url: doorAddress, caution: null },
  beside: [
    {
      service: "Jellyfin",
      facing: "watching",
      because:
        "Somebody sent here can watch what has arrived and has no way to ask for anything.",
    },
    {
      service: "Homepage",
      facing: "operators",
      because:
        "It lists every service, including the ones nobody in the house should learn exist.",
    },
  ],
};

/** What the request service was asked and would not answer. */
export const noRequestService =
  "The request service is not answering, so what the house asked for could not be read.";

/** What the house has asked for, and what each of them may watch. */
export const household: Household = {
  available: true,
  findings: [],
  policy: "everything-waits",
  allows: "five things a month",
  filtering:
    "A limit decides what is offered to somebody signed in as themselves. It is not a lock: anybody who signs in as somebody else sees what that person sees.",
  members: [
    {
      name: "Ada",
      claimed: true,
      last_seen: "2026-08-25T21:14:07Z",
      access: {
        administrator: true,
        age_limit: null,
        disabled: false,
        every_library: true,
        libraries: [],
        rated: null,
        restriction: "unrestricted",
        unrated: "let-through",
      },
      asking: {
        films: { used: 2 },
        television: { used: 1 },
        frees_up: null,
        policy: "trusted",
        standing: "unlimited",
      },
      requests: [
        { id: 41, title: "The Expanse", media: "series", state: "partly-here" },
        { id: 38, title: "Arrival", media: "film", state: "here" },
        { id: 36, title: "Andor", media: "series", state: "getting" },
      ],
      to_hand_over: [],
    },
    {
      name: "Kit",
      claimed: true,
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
        {
          id: 43,
          title: "Some Film Nobody Filed",
          media: "film",
          state: "failed",
        },
        { id: 29, title: "An Older Thing", media: null, state: null },
        { id: 22, title: null, media: null, state: "declined" },
      ],
      to_hand_over: [
        "What you ask for waits for an answer. Four of the five films this month are spent.",
      ],
    },
    {
      name: "Nour",
      claimed: false,
      last_seen: null,
      access: {
        administrator: false,
        age_limit: null,
        disabled: false,
        every_library: true,
        libraries: [],
        rated: null,
        restriction: "unrestricted",
        unrated: "let-through",
      },
      asking: null,
      requests: [],
      to_hand_over: [],
    },
  ],
};

/**
 * The same house, as the stream carries it on the dashboard.
 *
 * One record and two generated shapes. The household read and the dashboard's
 * own panel are the same report, and a fixture written twice would let the
 * screen drawn from one drift from the screen drawn from the other.
 */
export const house: House = household;

/** A household nothing could be read from, which is not an empty one. */
export const unread: Household = {
  available: false,
  findings: [
    "The request service answered, but its list of requests could not be read.",
  ],
  members: [],
};
