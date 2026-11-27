import { describe, expect, it } from "vitest";
import { nowhereOf, waysOf } from "./ways";
import { addressAt, kitsDoor } from "../api/hearings";

describe("where a member goes to watch", () => {
  it("is the door first, then everything else they can reach", () => {
    expect(waysOf(kitsDoor)).toEqual([
      {
        key: "door",
        service: "Where you ask",
        said: kitsDoor.meaning,
        url: addressAt("house.local:5055"),
        unaddressed: undefined,
      },
      {
        key: "beside-0",
        service: "Where you watch",
        said: "Watch what the house already has.",
        url: addressAt("house.local:8096"),
        unaddressed: undefined,
      },
      {
        key: "beside-1",
        service: "Where you read",
        said: "Read and listen to what the house keeps.",
        url: undefined,
        unaddressed: kitsDoor.beside[1]?.unaddressed,
      },
    ]);
    expect(nowhereOf(kitsDoor)).toBeUndefined();
  });

  it("leaves out an address the read says does not answer from here", () => {
    const away = waysOf({
      ...kitsDoor,
      reaches: "not-here",
      unaddressed: null,
      beside: [],
    });
    expect(away.map((one) => one.url)).toEqual([undefined]);
  });

  it("says what lemonfiber said where there is no door to begin at", () => {
    const none = { ...kitsDoor, service: null, address: null, beside: [] };
    expect(waysOf(none)).toEqual([]);
    expect(nowhereOf(none)).toBe(kitsDoor.meaning);
  });
});
