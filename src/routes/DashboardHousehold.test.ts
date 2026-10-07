import { screen, within } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { moment, unavailable } from "./fixture";
import { house } from "./house";
import {
  allowanceOf,
  saidOfAccess,
  saidOfPolicy,
  wordOfRequestState,
} from "../lib/household";
import type { House, Moment } from "../lib/wire";
import * as m from "../paraglide/messages.js";
import { board, changed } from "./Dashboard.testing";

/** The same moment, with the house read some other way. */
const houseAs = (over: Partial<House>): Moment =>
  changed({ household: { panel: "ready", data: { ...house, ...over } } });

describe("who is in the house", () => {
  const panel = (): HTMLElement =>
    screen.getByRole("region", { name: m.panel_household() });

  const waited = house.members[1]?.requests[0];
  const failed = house.members[1]?.requests[1];

  it("says what happens to what the house asks for, and what it allows", () => {
    board({ moment, flow: "live" });
    expect(panel()).toHaveTextContent(saidOfPolicy(house.policy));
    expect(panel()).toHaveTextContent(
      m.household_allows({ allows: house.allows ?? "" }),
    );
  });

  it("says nothing about a limit where the house carries none", () => {
    board({ moment: houseAs({ allows: null, filtering: null }), flow: "live" });
    expect(panel()).not.toHaveTextContent(
      m.household_allows({ allows: house.allows ?? "" }),
    );
    expect(panel()).not.toHaveTextContent(house.filtering ?? "");
  });

  // A parent who has set a limit is the reader most likely to take it for a
  // lock, so what the limits are and are not is said where they are set.
  it("says what the limits on this house are and are not", () => {
    board({ moment, flow: "live" });
    expect(panel()).toHaveTextContent(house.filtering ?? "");
  });

  it("says a policy the request service could not be asked for was not read", () => {
    board({ moment: houseAs({ policy: null }), flow: "live" });
    expect(panel()).toHaveTextContent(m.household_policy_unread());
  });

  it("names what is waiting on the operator, and who asked for it", () => {
    board({ moment, flow: "live" });
    const asking = within(panel()).getByRole("table", {
      name: m.household_waiting_on_you(),
    });

    expect(asking).toHaveTextContent("Kit");
    expect(asking).toHaveTextContent(
      m.request_a_kind({ media: waited?.media ?? "" }),
    );
    expect(asking).toHaveTextContent(
      wordOfRequestState("waiting-for-approval"),
    );
    expect(asking).toHaveTextContent(failed?.title ?? "");
  });

  // A request already answered has not been waiting since it was made, and a
  // figure beside one would be counting the wrong thing.
  it("says how long the ones nobody has ruled on have been waiting", () => {
    board({ moment, flow: "live" });
    expect(panel()).toHaveTextContent(
      m.waiting_days({ days: waited?.waiting_days ?? 0 }),
    );
  });

  // Everything else the house asked for is read on the requests screen; this
  // panel is what nobody in the house can move on their own.
  it("leaves out what nobody is waiting on", () => {
    board({ moment, flow: "live" });
    const asking = within(panel()).getByRole("table", {
      name: m.household_waiting_on_you(),
    });
    expect(asking).not.toHaveTextContent("Arrival");
  });

  it("says plainly when nothing is waiting on the operator", () => {
    board({
      moment: houseAs({
        members: house.members.map((one) => ({ ...one, requests: [] })),
      }),
      flow: "live",
    });
    expect(panel()).toHaveTextContent(m.household_nothing_waiting());
  });

  // The request service is asked once for the whole household, so a policy it
  // could not be asked for is a policy nobody's requests were read under. Every
  // member then carries the same empty list a member who has asked for nothing
  // carries, and an operator told nothing is waiting would go to bed on it.
  it("refuses to say nothing is waiting where nothing was read", () => {
    board({
      moment: houseAs({
        policy: null,
        members: house.members.map((one) => ({
          ...one,
          asking: null,
          requests: [],
        })),
      }),
      flow: "live",
    });

    expect(panel()).toHaveTextContent(m.household_requests_unread());
    expect(panel()).not.toHaveTextContent(m.household_nothing_waiting());
  });

  it("names everybody the media server holds an account for", () => {
    board({ moment, flow: "live" });
    for (const person of house.members) {
      expect(
        within(panel()).getByRole("heading", {
          level: 4,
          name: (said: string) => said.startsWith(person.name),
        }),
      ).toBeInTheDocument();
    }
  });

  it("says what each of them may watch, and where they stand", () => {
    board({ moment, flow: "live" });
    for (const person of house.members) {
      expect(panel()).toHaveTextContent(saidOfAccess(person));
      expect(panel()).toHaveTextContent(allowanceOf(person));
    }
  });

  // An invitation nobody has taken up is not a member who is not here, and the
  // difference is what an operator acts on.
  it("says which of them are invitations nobody has taken up", () => {
    board({ moment, flow: "live" });
    expect(panel()).toHaveTextContent(m.person_not_taken_up());
    expect(panel()).toHaveTextContent(m.person_administers());
  });

  // Television is counted a season at a time, so the two counts are never
  // folded into one figure.
  it("gives no figure for what a period has left", () => {
    board({ moment, flow: "live" });
    expect(panel().querySelectorAll(".figure")).toHaveLength(0);
  });

  it("says an empty house is one nobody lives in where the record was read", () => {
    board({ moment: houseAs({ members: [] }), flow: "live" });
    expect(panel()).toHaveTextContent(m.household_nobody());
  });

  // The same empty list, and the opposite fact.
  it("says the record was unread where it was", () => {
    board({
      moment: houseAs({ members: [], available: false }),
      flow: "live",
    });
    expect(panel()).toHaveTextContent(m.household_unread());
    expect(panel()).not.toHaveTextContent(m.household_nobody());
  });

  it("keeps what could not be read apart from what was", () => {
    const missed = "One account's libraries could not be read.";
    board({ moment: houseAs({ findings: [missed] }), flow: "live" });
    expect(panel()).toHaveTextContent(m.panel_unread());
    expect(panel()).toHaveTextContent(missed);
  });

  it("says nothing about what could not be read where everything was", () => {
    board({ moment, flow: "live" });
    expect(panel()).not.toHaveTextContent(m.panel_unread());
  });

  it("says in the source's own words why it could not be filled", () => {
    board({ moment: changed({ household: unavailable }), flow: "live" });
    expect(panel()).toHaveTextContent(unavailable.data.reason);
    expect(panel()).not.toHaveTextContent(m.household_members());
  });

  it("holds a place before the stream has delivered", () => {
    board();
    expect(panel()).toHaveTextContent(m.waiting_answer());
  });
});
