/**
 * The places a household member has, and what an address is to one of them.
 *
 * Which of the two menus a person is given follows from who signed in, and an
 * address does not change it: a member who opens the console's address for the
 * logs is still a member, standing at an address that is not theirs. What is
 * drawn there is what lemonfiber answers the read that address is drawn from,
 * so the refusal a member meets is the core's rather than one this page made up
 * by leaving something out.
 *
 * The words live in `messages/`, so no screen holds one.
 */
import type { IconName } from "./icons";
import { placeAt, type Menu, type Place } from "./route";
import * as m from "../paraglide/messages.js";

/**
 * Somewhere a household member can be.
 *
 * One per read that answers a member: what they asked for, which the household
 * read answers narrowed to them, and what the household holds, which the shelf
 * read answers as the media server shows it to them.
 */
export type Room = "asked" | "held";

/** Every room there is, in the order the menu shows them. */
export const everyRoom: readonly Room[] = ["asked", "held"];

/** The address a room is at. What they asked for is the root. */
export function pathOfRoom(room: Room): string {
  return room === "asked" ? "/" : "/held";
}

/** What a room is called. */
export function nameOfRoom(room: Room): string {
  return room === "asked" ? m.room_asked() : m.room_held();
}

/** The drawing that stands for a room. */
export function iconOfRoom(room: Room): IconName {
  return room === "asked" ? "requests" : "overview";
}

/** A household member's rooms, as their menu sets them out. */
export const memberMenu: Menu<Room> = {
  named: () => m.nav_member(),
  places: everyRoom,
  pathOf: pathOfRoom,
  nameOf: nameOfRoom,
  iconOf: iconOfRoom,
};

/**
 * A place of the console's that is not also a member's.
 *
 * The overview's address is the root, which is where a member's own requests
 * are, and the console's requests are drawn from the one read a member is
 * answered with their own row of — so neither is somewhere a member is away.
 */
export type Away = Exclude<Place, "overview" | "requests">;

/** Where an address puts a member: one of their rooms, or somewhere else. */
export type Whereabouts = { readonly room: Room } | { readonly away: Away };

/**
 * Where an address puts a member.
 *
 * An address naming nothing either menu knows is the root, as it is for the
 * console.
 */
export function whereabouts(path: string): Whereabouts {
  const first = path.split("/").find((part) => part !== "");
  if (first === "held") return { room: "held" };

  const place = placeAt(path);
  return place === "overview" || place === "requests"
    ? { room: "asked" }
    : { away: place };
}

/**
 * The read a place of the console's is drawn from, which is what a member
 * standing at its address is answered by.
 */
export function readOf(away: Away): string {
  switch (away) {
    case "checks":
      return "/api/checks";
    case "storage":
      return "/api/storage";
    case "logs":
      return "/api/logs";
  }
}
