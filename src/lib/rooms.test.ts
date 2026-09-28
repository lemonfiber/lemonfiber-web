import { describe, expect, it } from "vitest";
import {
  everyRoom,
  iconOfRoom,
  memberMenu,
  nameOfRoom,
  pathOfRoom,
  readOf,
  whereabouts,
  type Away,
} from "./rooms";
import { everyIcon } from "./icons";
import { consoleMenu, everyPlace, pathOf } from "./route";
import * as m from "../paraglide/messages.js";

describe("a household member's rooms", () => {
  it("puts what they asked for at the root, and the shelf at an address of its own", () => {
    expect(pathOfRoom("asked")).toBe("/");
    expect(pathOfRoom("held")).toBe("/held");
  });

  it("gives no two rooms the same address", () => {
    expect(new Set(everyRoom.map(pathOfRoom)).size).toBe(everyRoom.length);
  });

  it("names every room in the member's words", () => {
    expect(nameOfRoom("asked")).toBe(m.room_asked());
    expect(nameOfRoom("held")).toBe(m.room_held());
  });

  it.each(everyRoom)("draws %s with a drawing the interface has", (room) => {
    expect(everyIcon).toContain(iconOfRoom(room));
  });

  // The two menus are the same shape, and neither leads anywhere the other
  // does bar the root, which each surface answers for itself.
  it("leads nowhere the console leads bar the root", () => {
    const theirs = memberMenu.places.map((room) => memberMenu.pathOf(room));
    const console = consoleMenu.places
      .map((place) => consoleMenu.pathOf(place))
      .filter((path) => path !== "/");
    expect(theirs.filter((path) => console.includes(path))).toEqual([]);
  });

  it("names the menu, and the console's menu, apart", () => {
    expect(memberMenu.named()).toBe(m.nav_member());
    expect(consoleMenu.named()).toBe(m.nav_console());
    expect(memberMenu.named()).not.toBe(consoleMenu.named());
  });

  it("carries the room's name and drawing", () => {
    expect(memberMenu.nameOf("held")).toBe(nameOfRoom("held"));
    expect(memberMenu.iconOf("held")).toBe(iconOfRoom("held"));
  });
});

describe("where an address puts a member", () => {
  it.each(everyRoom)("reads back the address it gives %s", (room) => {
    expect(whereabouts(pathOfRoom(room))).toEqual({ room });
  });

  // The console's requests are drawn from the one read lemonfiber answers a
  // member with their own row of, so it is what they asked for.
  it("reads the console's requests as what they asked for", () => {
    expect(whereabouts(pathOf("requests"))).toEqual({ room: "asked" });
  });

  it("reads an address naming nothing as the root", () => {
    expect(whereabouts("/nothing-here")).toEqual({ room: "asked" });
  });

  it("reads the shelf with a trailing slash", () => {
    expect(whereabouts("/held/")).toEqual({ room: "held" });
  });

  // Every other place of the console's is somewhere a member is away, whatever
  // this page believes about whether it is theirs.
  it.each(["checks", "storage", "logs"] satisfies Away[])(
    "reads the console's %s as somewhere away",
    (away) => {
      expect(whereabouts(pathOf(away))).toEqual({ away });
    },
  );

  it("leaves no place of the console's unread", () => {
    for (const place of everyPlace) {
      expect(whereabouts(pathOf(place))).toBeDefined();
    }
  });
});

describe("the read an address away is drawn from", () => {
  it.each([
    ["checks", "/api/checks"],
    ["storage", "/api/storage"],
    ["logs", "/api/logs"],
    ["settings", "/api/quality"],
  ] satisfies [Away, string][])(
    "asks for %s where the console does",
    (away, read) => {
      expect(readOf(away)).toBe(read);
    },
  );
});
