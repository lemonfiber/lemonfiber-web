import { screen, waitFor, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Sending } from "@lemonfiber/sdk-ts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enveloped, refusedAs, replying } from "../api/bodies";
import { didAsk, dune, firstPage, lastPage, wouldAsk } from "./found";
import { kitsId, yours } from "./mine";
import { everythingInView } from "../lib/gallery.testing";
import { here, nobody, signedIn, type Said } from "./Member.testing";
import * as m from "../paraglide/messages.js";

/** What an ask carries, as far as these suites read it. */
interface Body {
  readonly id?: string;
  readonly kind?: string;
  readonly dry_run?: boolean;
}

/** One request as the transport was handed it. */
interface Sent {
  readonly url: URL;
  readonly method: string;
  readonly body: Body | undefined;
  readonly once: string | undefined;
}

/** A transport answering each request with whatever `say` says of it now. */
function answering(say: (sent: Sent) => Said): {
  sending: Sending;
  sent: Sent[];
} {
  const sent: Sent[] = [];
  const sending: Sending = vi.fn(
    (
      url: string,
      init: { method: string; headers: Record<string, string>; body?: string },
    ) => {
      const one: Sent = {
        url: new URL(url),
        method: init.method,
        body:
          init.body === undefined ? undefined : (JSON.parse(init.body) as Body),
        once: init.headers["Idempotency-Key"],
      };
      sent.push(one);
      const said = say(one);
      return said === "nothing"
        ? Promise.reject(new Error("the connection closed"))
        : Promise.resolve(replying(said.status, said.body));
    },
  );
  return { sending, sent };
}

/** A transport answering each request with whatever `say` comes to, in its own time. */
function answeringLater(say: (sent: Sent) => Promise<Said>): {
  sending: Sending;
} {
  const sending: Sending = vi.fn(
    async (
      url: string,
      init: {
        method: string;
        headers: Record<string, string>;
        body?: string;
      },
    ) => {
      const said = await say({
        url: new URL(url),
        method: init.method,
        body:
          init.body === undefined ? undefined : (JSON.parse(init.body) as Body),
        once: init.headers["Idempotency-Key"],
      });
      if (said === "nothing") throw new Error("the connection closed");
      return replying(said.status, said.body);
    },
  );
  return { sending };
}

/** A member's own reads and their search answered, and every ask with `asking`. */
const answers =
  (
    asking: (sent: Sent) => Said = (sent) => ({
      status: 200,
      body: enveloped("asked", sent.body?.dry_run === true ? wouldAsk : didAsk),
    }),
  ) =>
  (sent: Sent): Said => {
    if (sent.url.pathname === "/api/requests")
      return { status: 200, body: enveloped("household", yours) };
    if (sent.url.pathname === "/api/askable")
      return {
        status: 200,
        body: enveloped(
          "askable",
          sent.url.searchParams.get("after") === "page-2"
            ? lastPage
            : firstPage,
        ),
      };
    if (sent.url.pathname === "/api/actions/ask") return asking(sent);
    return { status: 404, body: "" };
  };

/** Search for some words, the way a member does. */
async function search(words: string): Promise<void> {
  await userEvent.type(
    await screen.findByRole("searchbox", { name: m.found_label() }),
    `${words}{Enter}`,
  );
}

/** Open a title the search found, and hand back its card. */
async function opened(name: string): Promise<HTMLElement> {
  await userEvent.click(await screen.findByRole("button", { name }));
  return screen.findByRole("dialog", { name });
}

/** Open a title the search found and press its ask, and hand back its card. */
async function askedFor(name: string): Promise<HTMLElement> {
  const card = await opened(name);
  await userEvent.click(
    await within(card).findByRole("button", { name: m.found_ask() }),
  );
  return card;
}

const searches = (sent: readonly Sent[]): readonly URL[] =>
  sent
    .filter((one) => one.url.pathname === "/api/askable")
    .map((one) => one.url);

const asks = (sent: readonly Sent[]): readonly Sent[] =>
  sent.filter((one) => one.url.pathname === "/api/actions/ask");

describe("a household member asking for something", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/find");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is reached from their menu", async () => {
    globalThis.history.replaceState(undefined, "", "/");
    signedIn(answering(answers()).sending);
    await userEvent.click(
      await screen.findByRole("link", { name: new RegExp(m.room_find()) }),
    );
    expect(globalThis.location.pathname).toBe("/find");
    expect(
      screen.getByRole("search", { name: m.found_title() }),
    ).toBeInTheDocument();
  });

  it("searches as the member the door named, for the words typed", async () => {
    const { sending, sent } = answering(answers());
    signedIn(sending);
    await search("  dune ");

    expect(
      await screen.findByRole("button", { name: "Dune" }),
    ).toBeInTheDocument();
    const [first] = searches(sent);
    expect(first?.searchParams.get("member")).toBe(kitsId);
    expect(first?.searchParams.get("term")).toBe("dune");
  });

  it("reads the next page from where the last said it begins", async () => {
    const { sending, sent } = answering(answers());
    signedIn(sending);
    await search("dune");
    await userEvent.click(
      await screen.findByRole("button", { name: m.found_more() }),
    );

    expect(
      await screen.findByRole("button", { name: "Arrival" }),
    ).toBeInTheDocument();
    expect(searches(sent)[1]?.searchParams.get("after")).toBe("page-2");
    expect(searches(sent)[1]?.searchParams.get("term")).toBe("dune");
  });

  it("rehearses an ask when a title is opened, and sends nothing until they press", async () => {
    const { sending, sent } = answering(answers());
    signedIn(sending);
    await search("dune");

    const card = await opened("Dune");
    expect(await within(card).findByText(wouldAsk.said)).toBeInTheDocument();
    expect(asks(sent)).toHaveLength(1);
    expect(asks(sent)[0]?.body).toEqual({
      id: "438631",
      kind: "movies",
      dry_run: true,
    });
  });

  it("asks once, under what tells the ask apart, and says what it came to", async () => {
    const { sending, sent } = answering(answers());
    signedIn(sending);
    await search("dune");
    const card = await askedFor("Dune");

    expect(await within(card).findByRole("status")).toHaveTextContent(
      didAsk.said,
    );
    const [, ask] = asks(sent);
    expect(ask?.body).toMatchObject({ dry_run: false });
    expect(ask?.once).toMatch(/^[0-9a-f]{32}$/);
  });

  it("sends an ask that went unanswered again under the same key, and queues nothing", async () => {
    let silent = true;
    const { sending, sent } = answering(
      answers((one) =>
        one.body?.dry_run === true
          ? { status: 200, body: enveloped("asked", wouldAsk) }
          : silent
            ? "nothing"
            : { status: 200, body: enveloped("asked", didAsk) },
      ),
    );
    signedIn(sending);
    await search("dune");
    const card = await askedFor("Dune");
    expect(await within(card).findByRole("alert")).toHaveTextContent(
      m.found_ask_unanswered(),
    );
    expect(asks(sent)).toHaveLength(2);

    silent = false;
    await userEvent.click(
      within(card).getByRole("button", { name: m.action_try_again() }),
    );
    expect(await within(card).findByRole("status")).toHaveTextContent(
      didAsk.said,
    );
    const [, lost, again] = asks(sent);
    expect(again?.once).toBe(lost?.once);
  });

  it("gives each title opened an ask of its own", async () => {
    const { sending, sent } = answering(answers());
    signedIn(sending);
    await search("dune");
    for (const name of ["Dune", "Severance"]) {
      const card = await askedFor(name);
      await within(card).findByRole("status");
      await userEvent.click(
        within(card).getByRole("button", { name: m.member_title_close() }),
      );
    }
    const sentOnce = asks(sent)
      .filter((one) => one.body?.dry_run === false)
      .map((one) => one.once);
    expect(new Set(sentOnce).size).toBe(2);
  });

  it("reads the search again once a title asked for is put away", async () => {
    const { sending, sent } = answering(answers());
    signedIn(sending);
    await search("dune");
    const card = await askedFor("Dune");
    await within(card).findByRole("status");
    await userEvent.click(
      within(card).getByRole("button", { name: m.member_title_close() }),
    );
    await waitFor(() => {
      expect(searches(sent)).toHaveLength(2);
    });
  });

  it("reads nothing again for a title put away unasked", async () => {
    const { sending, sent } = answering(answers());
    signedIn(sending);
    await search("dune");
    const card = await opened("Dune");
    await within(card).findByText(wouldAsk.said);
    await userEvent.click(
      within(card).getByRole("button", { name: m.member_title_close() }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(searches(sent)).toHaveLength(1);
  });

  it("rehearses again on a press where the rehearsal could not be read", async () => {
    let silent = true;
    const { sending, sent } = answering(
      answers(() =>
        silent
          ? "nothing"
          : { status: 200, body: enveloped("asked", wouldAsk) },
      ),
    );
    signedIn(sending);
    await search("dune");
    const card = await opened("Dune");
    silent = false;
    await userEvent.click(
      await within(card).findByRole("button", { name: m.action_try_again() }),
    );
    expect(await within(card).findByText(wouldAsk.said)).toBeInTheDocument();
    expect(asks(sent)).toHaveLength(2);
  });

  it("says lemonfiber's words where it turned the search down", async () => {
    const said = "Type at least two letters to search.";
    const { sending } = answering((one) =>
      one.url.pathname === "/api/askable"
        ? { status: 400, body: refusedAs("NOT_A_SEARCH", said) }
        : answers()(one),
    );
    signedIn(sending);
    await search("d");
    expect(await screen.findByText(said)).toBeInTheDocument();
  });

  it("is signed out where lemonfiber stops taking the session mid-search", async () => {
    const { sending } = answering((one) =>
      one.url.pathname === "/api/askable"
        ? {
            status: 401,
            body: nobody,
          }
        : answers()(one),
    );
    const { onrefused } = signedIn(sending);
    await search("dune");
    await waitFor(() => {
      expect(onrefused).toHaveBeenCalledWith(nobody);
    });
  });

  it("is signed out where lemonfiber stops taking the session at the ask", async () => {
    const { sending } = answering(
      answers(() => ({ status: 401, body: nobody })),
    );
    const { onrefused } = signedIn(sending);
    await search("dune");
    await userEvent.click(await screen.findByRole("button", { name: "Dune" }));
    await waitFor(() => {
      expect(onrefused).toHaveBeenCalledWith(nobody);
    });
  });

  it("drops what was found on leaving the room", async () => {
    const { sending } = answering(answers());
    signedIn(sending);
    await search("dune");
    await screen.findByRole("button", { name: "Dune" });
    await userEvent.click(
      screen.getByRole("link", { name: new RegExp(m.room_asked()) }),
    );
    await userEvent.click(
      screen.getByRole("link", { name: new RegExp(m.room_find()) }),
    );
    expect(await screen.findByText(m.found_first())).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dune" })).toBeNull();
  });
  it("draws nothing a search left behind found, once it comes", async () => {
    let release: (said: Said) => void = () => undefined;
    const late = new Promise<Said>((resolve) => {
      release = resolve;
    });
    const { sending } = answeringLater(async (one) =>
      one.url.pathname === "/api/askable" ? late : answers()(one),
    );
    signedIn(sending);
    await search("dune");
    await userEvent.click(
      screen.getByRole("link", { name: new RegExp(m.room_asked()) }),
    );
    await userEvent.click(
      screen.getByRole("link", { name: new RegExp(m.room_find()) }),
    );
    release({ status: 200, body: enveloped("askable", firstPage) });
    expect(await screen.findByText(m.found_first())).toBeInTheDocument();
    await Promise.resolve();
    expect(screen.queryByRole("button", { name: "Dune" })).toBeNull();
  });

  it("keeps no rehearsal or answer for a title put away before it came", async () => {
    let release: (said: Said) => void = () => undefined;
    const late = new Promise<Said>((resolve) => {
      release = resolve;
    });
    let rehearsed = false;
    const { sending } = answeringLater(async (one) => {
      if (one.url.pathname !== "/api/actions/ask") return answers()(one);
      if (one.body?.dry_run === true && !rehearsed) {
        rehearsed = true;
        return { status: 200, body: enveloped("asked", wouldAsk) };
      }
      return late;
    });
    signedIn(sending);
    await search("dune");
    let card = await askedFor("Dune");
    await userEvent.click(
      within(card).getByRole("button", { name: m.member_title_close() }),
    );
    card = await opened("Severance");
    release({ status: 200, body: enveloped("asked", didAsk) });
    await Promise.resolve();
    expect(within(card).queryByText(didAsk.said)).toBeNull();
    expect(within(card).queryByText(wouldAsk.said)).toBeNull();
  });
  it("reads again the page after the last where it went unread", async () => {
    let silent = true;
    const { sending, sent } = answering((one) =>
      one.url.searchParams.get("after") === "page-2" && silent
        ? "nothing"
        : answers()(one),
    );
    signedIn(sending);
    await search("dune");
    await userEvent.click(
      await screen.findByRole("button", { name: m.found_more() }),
    );
    silent = false;
    await userEvent.click(
      await screen.findByRole("button", { name: m.action_try_again() }),
    );
    expect(
      await screen.findByRole("button", { name: "Arrival" }),
    ).toBeInTheDocument();
    expect(searches(sent).map((url) => url.searchParams.get("after"))).toEqual([
      null,
      "page-2",
      "page-2",
    ]);
  });

  it("reads the first page again where it went unread", async () => {
    let silent = true;
    const { sending, sent } = answering((one) =>
      one.url.pathname === "/api/askable" && silent
        ? "nothing"
        : answers()(one),
    );
    signedIn(sending);
    await search("dune");
    expect(await screen.findByText(m.found_unread())).toBeInTheDocument();
    silent = false;
    await userEvent.click(
      screen.getByRole("button", { name: m.action_try_again() }),
    );
    expect(
      await screen.findByRole("button", { name: "Dune" }),
    ).toBeInTheDocument();
    expect(searches(sent).map((url) => url.searchParams.get("after"))).toEqual([
      null,
      null,
    ]);
  });

  it("draws no rehearsal for a title put away before it came over the one opened next", async () => {
    const duneWaits = "Asking for Dune waits for somebody to approve it.";
    let release: (said: Said) => void = () => undefined;
    const late = new Promise<Said>((resolve) => {
      release = resolve;
    });
    const { sending } = answeringLater(async (one) =>
      one.url.pathname === "/api/actions/ask" && one.body?.id === dune.id
        ? late
        : answers()(one),
    );
    signedIn(sending);
    await search("dune");
    const first = await opened("Dune");
    await userEvent.click(
      within(first).getByRole("button", { name: m.member_title_close() }),
    );
    const card = await opened("Severance");
    expect(await within(card).findByText(wouldAsk.said)).toBeInTheDocument();

    release({
      status: 200,
      body: enveloped("asked", { ...wouldAsk, said: duneWaits }),
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(within(card).queryByText(duneWaits)).toBeNull();
    expect(within(card).getByText(wouldAsk.said)).toBeInTheDocument();
  });

  it("is signed out where lemonfiber stops taking the session as the ask is sent", async () => {
    const { sending } = answering(
      answers((one) =>
        one.body?.dry_run === true
          ? { status: 200, body: enveloped("asked", wouldAsk) }
          : { status: 401, body: nobody },
      ),
    );
    const { onrefused } = signedIn(sending);
    await search("dune");
    await askedFor("Dune");
    await waitFor(() => {
      expect(onrefused).toHaveBeenCalledWith(nobody);
    });
  });

  it("asks lemonfiber for each found title's poster, never the catalogue", async () => {
    everythingInView();
    const { sending, sent } = answering(answers());
    signedIn(sending);
    await search("dune");
    await waitFor(() => {
      expect(sent.map((one) => one.url.pathname)).toContain(
        "/api/askable/95396/poster",
      );
    });
    const poster = sent.find(
      (one) => one.url.pathname === "/api/askable/95396/poster",
    );
    expect(poster?.url.searchParams.get("kind")).toBe("tv");
    expect(poster?.url.origin).toBe(here);
  });
});
