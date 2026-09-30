import { render, screen, waitFor, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { tick } from "svelte";
import type { Fetching, Sending } from "@lemonfiber/sdk-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Member from "./Member.svelte";
import { enveloped, refusedAs, replying } from "../api/bodies";
import { kit, kitsId, kitsShelf, yours } from "./mine";
import { household } from "./house";
import { nameOfRoom } from "../lib/rooms";
import { everyPlace, nameOf } from "../lib/route";
import type { Household } from "../lib/wire";
import * as m from "../paraglide/messages.js";

/** Built rather than written, so no scanner reads it as a real one. */
const session = ["a", "session", "secret"].join("-");
const here = "http://127.0.0.1:7777";

/** What lemonfiber says to a member at a door that is not theirs. */
const notYours = "This is not something this account may ask for.";

/** What lemonfiber says to a session that no longer stands. */
const nobody = "This request carried no token or session this run admits.";

/** What lemonfiber says where the media server could not be asked about them. */
const unconfirmed =
  "This account could not be checked with the media server, so nobody was identified. Nothing about the account has changed.";

/** One reply, or a request that never arrives. */
type Said = { status: number; body: string } | "nothing";

/** A transport answering each address with whatever `say` says of it now. */
function answering(say: (url: URL) => Said): Sending {
  return vi.fn((url: string) => {
    const said = say(new URL(url));
    return said === "nothing"
      ? Promise.reject(new Error("the connection closed"))
      : Promise.resolve(replying(said.status, said.body));
  });
}

/** A member's own reads answered, and every other read refused as not theirs. */
const answers =
  (theirs: Household = yours) =>
  (url: URL): Said => {
    if (url.pathname === "/api/requests")
      return { status: 200, body: enveloped("household", theirs) };
    if (url.pathname === "/api/held")
      return { status: 200, body: enveloped("held", kitsShelf) };
    return { status: 403, body: notYours };
  };

/** The stream is refused a member, and nothing here opens it. */
const fetching: Fetching = vi.fn(() =>
  Promise.resolve({ ok: false, body: null }),
);

function signedIn(sending: Sending): { onrefused: ReturnType<typeof vi.fn> } {
  const onrefused = vi.fn();
  render(Member, {
    reaching: { at: here, token: session, sending, fetching },
    member: kitsId,
    onrefused,
  });
  return { onrefused };
}

/** Every address the transport was asked for. */
const asked = (sending: Sending): readonly URL[] =>
  vi.mocked(sending).mock.calls.map(([url]) => new URL(url));

const room = (name: string): Promise<void> =>
  userEvent.click(screen.getByRole("link", { name: new RegExp(name) }));

describe("a household member signed in", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("opens on what they asked for, read from what lemonfiber answered about them", async () => {
    const sending = answering(answers());
    signedIn(sending);

    expect(await screen.findByText("Andor")).toBeInTheDocument();
    expect(asked(sending).map((url) => url.pathname)).toEqual([
      "/api/requests",
    ]);
  });

  // No lifecycle controls, no logs, no credentials, no diagnostics.
  it("leads nowhere the console does, and offers nothing to start or stop", async () => {
    signedIn(answering(answers()));
    await screen.findByText("Andor");

    for (const place of everyPlace) {
      expect(
        screen.queryByRole("link", { name: new RegExp(`^${nameOf(place)}$`) }),
      ).toBeNull();
    }
    expect(screen.queryByRole("button")).toBeNull();
    for (const finding of yours.findings) {
      expect(screen.queryByText(finding)).toBeNull();
    }
  });

  // What is drawn is what lemonfiber sent. It narrows a member's read to their
  // own row, and nothing here narrows it again or holds a second opinion.
  it("draws every request lemonfiber sent about them, whatever it stands at", async () => {
    signedIn(answering(answers()));
    const table = await screen.findByRole("table", { name: m.room_asked() });
    expect(within(table).getAllByRole("row")).toHaveLength(
      kit.requests.length + 1,
    );
  });

  // Asked about nobody but the member the session is for, so there is nothing
  // of anybody else's to leave out.
  it("asks about nobody by name, and lemonfiber answers about whoever the session is for", async () => {
    const sending = answering(answers({ ...household, members: [kit] }));
    signedIn(sending);
    await screen.findByText("Andor");
    expect(asked(sending)[0]?.search).toBe("");
  });

  it("stops the clock and the back button when it is put away", async () => {
    const removing = vi.spyOn(globalThis, "removeEventListener");
    const { unmount } = render(Member, {
      reaching: {
        at: here,
        token: session,
        sending: answering(answers()),
        fetching,
      },
      member: kitsId,
      onrefused: vi.fn(),
    });
    await screen.findByText("Andor");

    unmount();

    expect(removing).toHaveBeenCalledWith("popstate", expect.any(Function));
    removing.mockRestore();
  });

  it("ages a stamp as the clock moves", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      signedIn(answering(answers()));
      await screen.findByText("Andor");

      await vi.advanceTimersByTimeAsync(60_000);

      expect(
        screen.getAllByText(
          m.fresh_answered({ span: m.span_minutes({ count: 1 }) }),
        ).length,
      ).toBeGreaterThan(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("what the household holds, for the member signed in", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("asks for the shelf of the member the door named, and nothing else about them", async () => {
    const sending = answering(answers());
    signedIn(sending);
    await screen.findByText("Andor");

    await room(nameOfRoom("held"));

    expect(await screen.findByText("Arrival")).toBeInTheDocument();
    const shelf = asked(sending).find((url) => url.pathname === "/api/held");
    expect(shelf?.searchParams.getAll("member")).toEqual([kitsId]);
    expect([...(shelf?.searchParams.keys() ?? [])]).toEqual(["member"]);
    expect(globalThis.location.pathname).toBe("/held");
  });

  it("says what they are held to, as lemonfiber answered it", async () => {
    signedIn(answering(answers()));
    await screen.findByText("Andor");
    await room(nameOfRoom("held"));

    expect(await screen.findByText(m.member_watch_both())).toBeInTheDocument();
  });

  // What a member may watch is not cached: a shelf from an earlier arrival
  // does not stand in for one that went unanswered.
  it("keeps no shelf from an earlier arrival once lemonfiber stops answering", async () => {
    let answering_ = true;
    signedIn(
      answering((url) =>
        answering_ || url.pathname === "/api/requests"
          ? answers()(url)
          : "nothing",
      ),
    );
    await screen.findByText("Andor");
    await room(nameOfRoom("held"));
    await screen.findByText("Arrival");

    await room(nameOfRoom("asked"));
    answering_ = false;
    await room(nameOfRoom("held"));

    expect(
      await screen.findByText(m.member_shelf_unread()),
    ).toBeInTheDocument();
    expect(screen.queryByText("Arrival")).toBeNull();
  });

  it("opens on the shelf where the address names it", async () => {
    globalThis.history.replaceState(undefined, "", "/held");
    signedIn(answering(answers()));
    expect(await screen.findByText("Arrival")).toBeInTheDocument();
  });

  it("follows the back button", async () => {
    signedIn(answering(answers()));
    await screen.findByText("Andor");
    await room(nameOfRoom("held"));
    await screen.findByText("Arrival");

    globalThis.history.replaceState(undefined, "", "/");
    globalThis.dispatchEvent(new PopStateEvent("popstate"));

    expect(await screen.findByText("Andor")).toBeInTheDocument();
  });

  // A modified click asks the browser for something the page cannot give.
  it("leaves a modified click to the browser", async () => {
    signedIn(answering(answers()));
    await screen.findByText("Andor");

    screen
      .getByRole("link", { name: new RegExp(nameOfRoom("held")) })
      .dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          metaKey: true,
        }),
      );

    expect(globalThis.location.pathname).toBe("/");
  });

  // An asking a later one overtook is not drawn over the place the reader is at.
  it("draws nothing from an asking a later one has overtaken", async () => {
    type Reply = ReturnType<typeof replying>;
    let first: ((reply: Reply) => void) | undefined;
    const late = new Promise<Reply>((settle) => {
      first = settle;
    });
    let calls = 0;
    const sending: Sending = vi.fn((url: string) => {
      const where = new URL(url);
      if (where.pathname === "/api/requests") {
        calls += 1;
        if (calls === 1) return late;
      }
      const said = answers()(where);
      return said === "nothing"
        ? Promise.reject(new Error("closed"))
        : Promise.resolve(replying(said.status, said.body));
    });
    signedIn(sending);

    await room(nameOfRoom("held"));
    expect(await screen.findByText(m.member_watch_both())).toBeInTheDocument();

    first?.(
      replying(
        200,
        enveloped("household", {
          ...yours,
          members: [
            { ...kit, access: { ...kit.access, restriction: "unrestricted" } },
          ],
        }),
      ),
    );
    await late;
    // Everything the late answer sets off is already queued, so one turn of
    // the clock is enough for all of it to have been drawn.
    await new Promise((settle) => setTimeout(settle, 0));
    await tick();

    expect(screen.getByText(m.member_watch_both())).toBeInTheDocument();
    expect(screen.queryByText(m.member_watch_unrestricted())).toBeNull();
  });
});

describe("while lemonfiber is not answering", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  // Their own requests from the last read, marked with when, and a new ask
  // declined rather than queued.
  it("keeps what they asked for from the last read, marked, and declines asking", async () => {
    let up = true;
    signedIn(answering((url) => (up ? answers()(url) : "nothing")));
    await screen.findByText("Andor");

    up = false;
    await room(nameOfRoom("held"));
    await room(nameOfRoom("asked"));

    expect(
      await screen.findByText(m.member_unanswered_prose()),
    ).toBeInTheDocument();
    expect(screen.getByText("Andor")).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: m.room_asked() })).getByText(
        m.fresh_silent({ span: m.span_seconds({ count: 0 }) }),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(m.member_asking_declined())).toBeInTheDocument();
  });

  it("asks again when asked to, and says nothing more about it once answered", async () => {
    let up = false;
    signedIn(answering((url) => (up ? answers()(url) : "nothing")));
    await screen.findByText(m.member_unanswered_lead());

    up = true;
    await userEvent.click(
      screen.getByRole("button", { name: m.action_try_again() }),
    );

    expect(await screen.findByText("Andor")).toBeInTheDocument();
    expect(screen.queryByText(m.member_unanswered_lead())).toBeNull();
  });

  // What they may watch is the core's answer this time, or nothing.
  it("says what they may watch could not be read, rather than what it last was", async () => {
    let up = true;
    signedIn(answering((url) => (up ? answers()(url) : "nothing")));
    await screen.findByText("Andor");

    up = false;
    await room(nameOfRoom("held"));

    expect(
      await screen.findByText(m.member_watch_unread()),
    ).toBeInTheDocument();
    expect(screen.queryByText(m.member_watch_both())).toBeNull();
  });
});

describe("an address that is not theirs", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/logs");
  });

  // The page does not decide it is not theirs: it asks, and lemonfiber refuses.
  it("asks lemonfiber the read the address is drawn from, and shows its refusal in its words", async () => {
    const sending = answering(answers());
    const { onrefused } = signedIn(sending);

    expect(await screen.findByText(notYours)).toBeInTheDocument();
    expect(screen.getByText(m.member_away_lead())).toBeInTheDocument();
    expect(asked(sending).map((url) => url.pathname)).toContain("/api/logs");
    expect(onrefused).not.toHaveBeenCalled();
  });

  it("marks none of their rooms as the one being read", async () => {
    signedIn(answering(answers()));
    await screen.findByText(notYours);
    expect(screen.queryAllByRole("link", { current: "page" })).toHaveLength(0);
  });

  // Somebody removed from the household is refused that read and their own,
  // and it is their own that says they are signed out.
  it("signs out somebody lemonfiber no longer admits, rather than showing the refusal", async () => {
    const { onrefused } = signedIn(
      answering(() => ({ status: 403, body: nobody })),
    );

    await waitFor(() => {
      expect(onrefused).toHaveBeenCalledWith(nobody);
    });
    expect(screen.queryByText(m.member_away_lead())).toBeNull();
  });
});

describe("a member lemonfiber stops taking", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  // At the next refused call, the surface returns to signed out, carrying what
  // lemonfiber said.
  it("is signed out at the next refused call, in lemonfiber's words", async () => {
    let admitted = true;
    const { onrefused } = signedIn(
      answering((url) =>
        admitted ? answers()(url) : { status: 403, body: nobody },
      ),
    );
    await screen.findByText("Andor");

    admitted = false;
    await room(nameOfRoom("held"));

    await waitFor(() => {
      expect(onrefused).toHaveBeenCalledWith(nobody);
    });
  });

  it("is signed out where the shelf alone is refused", async () => {
    const { onrefused } = signedIn(
      answering((url) =>
        url.pathname === "/api/held"
          ? { status: 403, body: nobody }
          : answers()(url),
      ),
    );
    await screen.findByText("Andor");

    await room(nameOfRoom("held"));

    await waitFor(() => {
      expect(onrefused).toHaveBeenCalledWith(nobody);
    });
  });

  // Not the silence a stranger gets: the media server is what could not be
  // asked, and lemonfiber says so.
  it("carries lemonfiber's account of a media server it could not ask", async () => {
    const { onrefused } = signedIn(
      answering(() => ({ status: 403, body: unconfirmed })),
    );
    await waitFor(() => {
      expect(onrefused).toHaveBeenCalledWith(unconfirmed);
    });
  });

  it("says they were signed out where lemonfiber's words did not arrive", async () => {
    const { onrefused } = signedIn(
      answering(() => ({ status: 403, body: "" })),
    );
    await waitFor(() => {
      expect(onrefused).toHaveBeenCalledWith(m.unlock_signed_out_prose());
    });
  });
});

describe("a refusal that says which it is", () => {
  // The code decides whether the session still stands; the sentence is shown
  // where the page drew, or carried to the door where it does not.
  it("stays signed in where the media server could not be asked, and says so where they are", async () => {
    globalThis.history.replaceState(undefined, "", "/");
    const { onrefused } = signedIn(
      answering(() => ({
        status: 403,
        body: refusedAs("UNCONFIRMED", unconfirmed),
      })),
    );

    expect(await screen.findByText(unconfirmed)).toBeInTheDocument();
    expect(onrefused).not.toHaveBeenCalled();
  });

  it("stays signed in where the shelf is not theirs, and says so on the shelf", async () => {
    globalThis.history.replaceState(undefined, "", "/held");
    const { onrefused } = signedIn(
      answering((url) =>
        url.pathname === "/api/held"
          ? { status: 403, body: refusedAs("NOT_YOURS", notYours) }
          : answers()(url),
      ),
    );

    expect(await screen.findByText(notYours)).toBeInTheDocument();
    expect(onrefused).not.toHaveBeenCalled();
  });

  it("says on the shelf what lemonfiber said of the media server, and stays", async () => {
    globalThis.history.replaceState(undefined, "", "/held");
    const { onrefused } = signedIn(
      answering(() => ({
        status: 403,
        body: refusedAs("UNCONFIRMED", unconfirmed),
      })),
    );

    expect(await screen.findAllByText(unconfirmed)).not.toHaveLength(0);
    expect(onrefused).not.toHaveBeenCalled();
  });

  it("shows an address that is not theirs in lemonfiber's words, and stays", async () => {
    globalThis.history.replaceState(undefined, "", "/logs");
    const { onrefused } = signedIn(
      answering((url) =>
        url.pathname === "/api/logs"
          ? { status: 403, body: refusedAs("NOT_YOURS", notYours) }
          : answers()(url),
      ),
    );

    expect(await screen.findByText(notYours)).toBeInTheDocument();
    expect(screen.getByText(m.member_away_lead())).toBeInTheDocument();
    expect(onrefused).not.toHaveBeenCalled();
  });

  it("signs out a session no longer admitted, in the page's own words", async () => {
    globalThis.history.replaceState(undefined, "", "/");
    const { onrefused } = signedIn(
      answering(() => ({
        status: 403,
        body: refusedAs("NOT_ADMITTED", nobody),
      })),
    );

    await waitFor(() => {
      expect(onrefused).toHaveBeenCalledWith(m.unlock_signed_out_prose());
    });
  });
});
