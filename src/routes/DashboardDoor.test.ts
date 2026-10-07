import { screen, within } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { leaking, moment, tunnel, unavailable } from "./fixture";
import { doorAddress, frontDoor } from "./house";
import {
  everyDoorStanding,
  saidOfChosen,
  wordOfDoorStanding,
  wordOfFacing,
} from "../lib/door";
import type { Door, Moment } from "../lib/wire";
import * as m from "../paraglide/messages.js";
import { answered, board, changed } from "./Dashboard.testing";

/** The same moment, with the tunnel read some other way. */
const tunnelAs = (over: Partial<typeof tunnel>): Moment =>
  changed({ vpn: { panel: "ready", data: { ...tunnel, ...over } } });

/** The same moment, with the front door read some other way. */
const doorAs = (over: Partial<Door>): Moment =>
  changed({ door: { panel: "ready", data: { ...frontDoor, ...over } } });

describe("the front door", () => {
  const panel = (): HTMLElement =>
    screen.getByRole("region", { name: m.panel_front_door() });

  it("gives the one address to hand somebody who lives here", () => {
    board({ moment, flow: "live" });
    expect(panel()).toHaveTextContent(doorAddress);
    expect(panel()).toHaveTextContent(frontDoor.meaning);
  });

  it("names the service it is, and what it is to the house", () => {
    board({ moment, flow: "live" });
    expect(panel()).toHaveTextContent("Jellyseerr");
    expect(panel()).toHaveTextContent(wordOfFacing("asking"));
  });

  it.each(everyDoorStanding)("says where a %s door stands", (standing) => {
    board({ moment: doorAs({ standing }), flow: "live" });
    expect(panel()).toHaveTextContent(wordOfDoorStanding(standing));
  });

  // The address is read off this machine at the moment of asking rather than
  // remembered, and a door that is down is exactly when somebody is asking
  // what to open.
  it("keeps the address of a door that is not answering", () => {
    board({ moment: doorAs({ standing: "unreachable" }), flow: "live" });
    expect(panel()).toHaveTextContent(doorAddress);
    expect(panel()).toHaveTextContent(wordOfDoorStanding("unreachable"));
  });

  it("says there is none where this machine could not give one", () => {
    board({
      moment: doorAs({
        standing: "stranded",
        address: null,
        service: null,
        facing: null,
      }),
      flow: "live",
    });
    expect(panel()).toHaveTextContent(m.door_no_address());
    expect(panel()).not.toHaveTextContent(doorAddress);
  });

  it("carries what is worth knowing about the address itself", () => {
    const caution = "This one is a number and may change on its own.";
    board({
      moment: doorAs({ address: { url: doorAddress, caution } }),
      flow: "live",
    });
    expect(panel()).toHaveTextContent(caution);
  });

  it("says a door nobody named was worked out", () => {
    board({ moment, flow: "live" });
    expect(panel()).toHaveTextContent(saidOfChosen({ chosen: "derived" }));
  });

  it("names the door the operator named", () => {
    board({
      moment: doorAs({ chosen: { chosen: "named", door: "jellyseerr" } }),
      flow: "live",
    });
    expect(panel()).toHaveTextContent(
      saidOfChosen({ chosen: "named", door: "jellyseerr" }),
    );
  });

  // An operator whose setting was refused has to find their own words in the
  // sentence, rather than a door they did not choose and no account of where
  // theirs went.
  it("says what the operator named and why it is not the door", () => {
    board({
      moment: doorAs({
        chosen: {
          chosen: "refused",
          door: {
            named: "qbittorrent",
            because: "Nobody in the house should learn it exists.",
          },
        },
      }),
      flow: "live",
    });
    expect(panel()).toHaveTextContent("qbittorrent");
    expect(panel()).toHaveTextContent(
      "Nobody in the house should learn it exists.",
    );
  });

  it("names everything else the house can reach, and why none of it is it", () => {
    board({ moment, flow: "live" });
    for (const one of frontDoor.beside) {
      expect(panel()).toHaveTextContent(one.service);
      expect(panel()).toHaveTextContent(wordOfFacing(one.facing));
      expect(panel()).toHaveTextContent(one.because);
    }
  });

  it("says nothing about what else can be reached where nothing else can", () => {
    board({ moment: doorAs({ beside: [] }), flow: "live" });
    expect(panel()).not.toHaveTextContent(m.door_beside());
  });

  it("says in the source's own words why it could not be filled", () => {
    board({ moment: changed({ door: unavailable }), flow: "live" });
    expect(panel()).toHaveTextContent(unavailable.data.reason);
    expect(panel()).not.toHaveTextContent(doorAddress);
  });

  it("holds a place before the stream has delivered", () => {
    board();
    expect(panel()).toHaveTextContent(m.waiting_answer());
  });
});

// B3 puts the tunnel second on the screen because it is the only item with
// consequences outside the machine, and the one fact on it that is evidence
// rather than a claim is whether the download client's own traffic goes that
// way. A tunnel that is up and carrying nothing looks fine on every other line.
describe("the tunnel", () => {
  const panel = (): HTMLElement =>
    screen.getByRole("region", { name: m.panel_tunnel() });

  it("gives the address it leaves from and the country it is in", () => {
    board({ moment, live: answered });
    expect(within(panel()).getByText(tunnel.exit_ip)).toBeInTheDocument();
    expect(within(panel()).getByText(tunnel.country)).toBeInTheDocument();
  });

  it("says the download client's own traffic goes the same way", () => {
    board({ moment, live: answered });
    expect(within(panel()).getByText(m.tunnel_carrying())).toBeInTheDocument();
    expect(
      within(panel()).getByText(m.tunnel_leaving_from()),
    ).toBeInTheDocument();
  });

  it("names the port the provider forwards", () => {
    board({ moment, live: answered });
    expect(
      within(panel()).getByText(
        m.tunnel_port_forwarded({ number: tunnel.forwarded_port ?? 0 }),
      ),
    ).toBeInTheDocument();
  });

  // Running without a forwarded port is an ordinary place to be, so what it
  // says is what it costs rather than an absence dressed as a fault.
  it("says what no forwarded port costs rather than reporting a fault", () => {
    board({ moment: tunnelAs({ forwarded_port: null }), live: answered });
    expect(within(panel()).getByText(m.tunnel_port_none())).toBeInTheDocument();
  });

  it("says plainly where the downloading is not going through it", () => {
    board({ moment: changed({ vpn: { panel: "ready", data: leaking } }) });
    expect(within(panel()).getByText(m.tunnel_leaking())).toBeInTheDocument();
    expect(within(panel()).getByText(m.tunnel_mismatch())).toBeInTheDocument();
  });

  it("says why the panel is empty where the tunnel could not be read", () => {
    board({ moment: changed({ vpn: unavailable }), live: answered });
    expect(
      within(panel()).getByText(unavailable.data.reason),
    ).toBeInTheDocument();
  });

  // A panel drawn permanently red for a choice somebody made on purpose is a
  // fault reported against the operator.
  it("is not on the screen at all where no tunnel is configured", () => {
    board({ moment: changed({ vpn: null }), live: answered });
    expect(screen.queryByRole("region", { name: m.panel_tunnel() })).toBeNull();
  });
});
