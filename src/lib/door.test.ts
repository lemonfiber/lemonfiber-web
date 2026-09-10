import { describe, expect, it } from "vitest";
import {
  everyDoorStanding,
  everyFacing,
  saidOfChosen,
  stateOfDoor,
  toneOfDoor,
  wordOfDoorStanding,
  wordOfFacing,
} from "./door";
import { everyState, everyTone } from "./state";
import type { Chosen, DoorStanding, Facing } from "./wire";
import * as m from "../paraglide/messages.js";

/**
 * Words from a lemonfiber whose vocabulary is wider than this build's.
 *
 * The wire version stays one number while words are added under it, so a running
 * binary can answer with one the generated types do not name and the version
 * gate still passes. There is no way to write one but to say so.
 */
const unnamedStanding = "half-open" as unknown as DoorStanding;
const unnamedFacing = "browsing" as unknown as Facing;
const unnamedChoice = { chosen: "inherited" } as unknown as Chosen;

describe("stateOfDoor", () => {
  it.each(everyDoorStanding)(
    "gives %s a state the interface has",
    (standing) => {
      expect(everyState).toContain(stateOfDoor(standing));
    },
  );

  it("trusts a door that is up, whichever of the two it is", () => {
    expect(stateOfDoor("established")).toBe("known");
    expect(stateOfDoor("library-only")).toBe("known");
  });

  // The service is answering and the way to it is what is missing, which is
  // half of what somebody in the next room needs.
  it("reads a door with nowhere to be reached at as part way there", () => {
    expect(stateOfDoor("stranded")).toBe("part");
  });

  it("reads a door that is not answering as stopped", () => {
    expect(stateOfDoor("unreachable")).toBe("stopped");
  });

  // Nothing was ever published, so there is nothing here that has been
  // measured — which is a configuration rather than an absence of an answer.
  it("reads a stack that publishes nothing as never measured", () => {
    expect(stateOfDoor("none")).toBe("unknown");
  });
});

describe("toneOfDoor", () => {
  it.each(everyDoorStanding)(
    "gives %s a severity the interface has",
    (standing) => {
      expect(everyTone).toContain(toneOfDoor(standing));
    },
  );

  it("keeps a door that works, and one nobody published, quiet", () => {
    expect(toneOfDoor("established")).toBe("calm");
    expect(toneOfDoor("library-only")).toBe("calm");
    expect(toneOfDoor("none")).toBe("calm");
  });

  it("raises a door that is not answering", () => {
    expect(toneOfDoor("unreachable")).toBe("alarm");
    expect(toneOfDoor("stranded")).toBe("watch");
  });
});

describe("wordOfDoorStanding", () => {
  it.each(everyDoorStanding)("gives %s a plain phrase", (standing) => {
    expect(wordOfDoorStanding(standing)).not.toBe("");
  });

  it("gives each standing a phrase of its own", () => {
    expect(new Set(everyDoorStanding.map(wordOfDoorStanding)).size).toBe(
      everyDoorStanding.length,
    );
  });

  // The two the spec keeps apart are fixed at opposite ends, and a household
  // member who cannot arrive needs to know which of them they are looking at.
  it("tells a door that is down from one with no address", () => {
    expect(wordOfDoorStanding("unreachable")).not.toBe(
      wordOfDoorStanding("stranded"),
    );
  });
});

describe("wordOfFacing", () => {
  it.each(everyFacing)("says what %s is to the house", (facing) => {
    expect(wordOfFacing(facing)).not.toBe("");
  });

  it("gives each of them a phrase of its own", () => {
    expect(new Set(everyFacing.map(wordOfFacing)).size).toBe(
      everyFacing.length,
    );
  });
});

describe("how this came to be the door", () => {
  it("says a door nobody named was worked out", () => {
    expect(saidOfChosen({ chosen: "derived" })).toBe(m.door_derived());
  });

  it("names the door the operator named", () => {
    expect(saidOfChosen({ chosen: "named", door: "jellyseerr" })).toBe(
      m.door_named({ door: "jellyseerr" }),
    );
  });

  // An operator whose setting was refused reads this sentence, so their own
  // words and the reason are both in it.
  it("carries what was named and why it is not the door", () => {
    const said = saidOfChosen({
      chosen: "refused",
      door: {
        named: "qbittorrent",
        because: "Nobody in the house should learn it exists.",
      },
    });

    expect(said).toContain("qbittorrent");
    expect(said).toContain("Nobody in the house should learn it exists.");
  });
});

describe("a word this build has no entry for", () => {
  it("reads a standing it does not know as one it has not measured", () => {
    expect(stateOfDoor(unnamedStanding)).toBe("unknown");
  });

  it("draws a standing it does not know without shouting about it", () => {
    expect(toneOfDoor(unnamedStanding)).toBe("calm");
  });

  it("gives a standing it does not know a phrase of its own", () => {
    expect(wordOfDoorStanding(unnamedStanding)).toBe(m.door_unrecognised());
    expect(everyDoorStanding.map(wordOfDoorStanding)).not.toContain(
      m.door_unrecognised(),
    );
  });

  it("gives a facing it does not know a phrase rather than a blank", () => {
    expect(wordOfFacing(unnamedFacing)).toBe(m.facing_unrecognised());
    expect(everyFacing.map(wordOfFacing)).not.toContain(
      m.facing_unrecognised(),
    );
  });

  it("says how a door it cannot account for came to be one", () => {
    expect(saidOfChosen(unnamedChoice)).toBe(m.door_chosen_unrecognised());
  });
});
