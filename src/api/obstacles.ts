/**
 * What stands in the way of part of an answer, as a suite stands it in for a
 * running lemonfiber.
 *
 * Each is worded as lemonfiber words its code: for the operator in the code's
 * own sentences, and for a household member in the household's.
 */
import type { Obstacle } from "../lib/obstacle";

/** The media server did not answer, as the operator is told it. */
export const serverSilent: Obstacle = {
  code: "PLAY-5",
  said: "The media server did not answer, so nothing was read or recorded for this member. Nothing was changed.",
  remedy:
    "Check the media server is running with lemonfiber status, then ask again.",
};

/** The media server did not answer, as a household member is told it. */
export const serverSilentToMembers: Obstacle = {
  code: "PLAY-5",
  said: "Your library isn't working right now, and whoever runs the house has been told. Nothing was changed.",
  remedy: "Try again a little later.",
};

/** The request service did not answer, as the operator is told it. */
export const requestsUnreachable: Obstacle = {
  code: "QUOTA-1",
  said: "The request service is not answering, so what the house asked for could not be read.",
  remedy: "Check the request service is running, then run this again.",
};

/** A fault of the stack, as a household member is told every one. */
export const faultToMembers: Obstacle = {
  code: "QUOTA-1",
  said: "This isn't working right now, and whoever runs the house has been told.",
  remedy: "Try again a little later.",
};

/** A series held with no seasons under it, as the operator is told it. */
export const unseasoned: Obstacle = {
  code: "LIBRARY-1",
  said: "The media server holds episodes for a series and answers that it has no seasons.",
  remedy:
    "Have the media server read the series afresh, by running lemonfiber doctor --fix.",
};
