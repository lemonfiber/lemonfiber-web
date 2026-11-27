/**
 * What a household member reads beside what they asked for: the kinds they may
 * ask for, where to watch, and how they are told. Written against the generated
 * contract, in the household words lemonfiber narrows each to for a member.
 */
import type { Kinds } from "../lib/kinds";
import type { Telling } from "../lib/telling";
import type { Door } from "../lib/ways";

/** An address on the household's own network, by its host. */
export const addressAt = (host: string): string =>
  ["http:", "", host].join("/");

export const kitsKinds: Kinds = {
  member: "Kit",
  kinds: [
    { kind: "tv", units: [] },
    { kind: "movies", units: [] },
    { kind: "music", units: ["album", "artist"] },
    { kind: "books", units: ["book"] },
  ],
};

export const kitsDoor: Door = {
  standing: "established",
  reaches: "here",
  service: "Where you ask",
  facing: "asking",
  address: { url: addressAt("house.local:5055") },
  meaning:
    "Start where you ask: ask for what you want there, and it leads on to where you watch it.",
  beside: [
    {
      service: "Where you watch",
      facing: "watching",
      because: "Watch what the house already has.",
      address: { url: addressAt("house.local:8096") },
      reaches: "here",
    },
    {
      service: "Where you read",
      facing: "shelf",
      because: "Read and listen to what the house keeps.",
      reaches: "not-here",
      unaddressed:
        "Open this at home, on the house's own network. It can't be reached from where you are.",
    },
  ],
};

export const kitsTelling: Telling = {
  offered: [
    { id: "family-chat", name: "The family chat", receiving: true },
    { id: "phones", name: "Our phones", receiving: false },
  ],
  phone: true,
  rehearsed: false,
};
