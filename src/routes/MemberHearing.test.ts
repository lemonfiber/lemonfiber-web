import { cleanup, screen, waitFor, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Sending } from "@lemonfiber/sdk-ts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enveloped, replying } from "../api/bodies";
import { didAsk, firstPage, wouldAsk } from "./found";
import { addressAt, kitsDoor, kitsKinds, kitsTelling } from "../api/hearings";
import { kitsNothingPartWay, kitsShelf, yours } from "./mine";
import { everythingInView } from "../lib/gallery.testing";
import type { FoundTitle } from "../lib/askable";
import { keptAt } from "../lib/seen";
import type { Telling } from "../lib/telling";
import type { Household } from "../lib/wire";
import { here, nobody, signedIn, type Said } from "./Member.testing";
import { kitsId } from "./mine";
import * as m from "../paraglide/messages.js";

/** One request as the transport was handed it. */
interface Sent {
  readonly url: URL;
  readonly method: string;
  readonly body: Record<string, unknown> | undefined;
}

/** A transport answering each request with whatever `say` says of it now. */
function answering(say: (sent: Sent) => Said | Promise<Said>): {
  sending: Sending;
  sent: Sent[];
} {
  const sent: Sent[] = [];
  const sending: Sending = vi.fn(
    async (url: string, init: { method: string; body?: string }) => {
      const one: Sent = {
        url: new URL(url),
        method: init.method,
        body:
          init.body === undefined
            ? undefined
            : (JSON.parse(init.body) as Record<string, unknown>),
      };
      sent.push(one);
      const said = await say(one);
      if (said === "nothing") throw new Error("the connection closed");
      return replying(said.status, said.body);
    },
  );
  return { sending, sent };
}

const album: FoundTitle = {
  id: "mbid-blue",
  kind: "music",
  unit: "album",
  title: "Blue",
  year: 1971,
  stands: "askable",
  found: ["vouched", "for", "this", "run", String(Date.now())].join("-"),
};

const ok = (body: string): Said => ({ status: 200, body });

/** A member's own reads answered, as lemonfiber answers them. */
const answers =
  (
    theirs: Household = yours,
    telling: Telling = kitsTelling,
    door = kitsDoor,
  ) =>
  (sent: Sent): Said => {
    switch (sent.url.pathname) {
      case "/api/requests":
        return ok(enveloped("household", theirs));
      case "/api/held":
        return ok(enveloped("held", kitsShelf));
      case "/api/watching":
        return ok(enveloped("part-way", kitsNothingPartWay));
      case "/api/askable/kinds":
        return ok(enveloped("askable-kinds", kitsKinds));
      case "/api/askable":
        return ok(
          enveloped(
            "askable",
            sent.url.searchParams.get("unit") === "album"
              ? { ...firstPage, kinds: ["music"], titles: [album], next: null }
              : firstPage,
          ),
        );
      case "/api/actions/ask":
        return ok(
          enveloped(
            "asked",
            sent.body?.["dry_run"] === true ? wouldAsk : didAsk,
          ),
        );
      case "/api/front-door":
        return ok(enveloped("front-door", door));
      case "/api/notify/mine":
        return ok(enveloped("notify-mine", telling));
      default:
        return { status: 404, body: "" };
    }
  };

const to = (path: string, sent: readonly Sent[]): readonly Sent[] =>
  sent.filter((one) => one.url.pathname === path);

/** Search for some words, the way a member does. */
async function search(words: string): Promise<void> {
  await userEvent.type(
    await screen.findByRole("searchbox", { name: m.found_label() }),
    `${words}{Enter}`,
  );
}

beforeEach(() => {
  globalThis.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("a member asking for music and books", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/find");
  });

  it("reads what they may ask for, and searches and asks in the kind chosen", async () => {
    everythingInView();
    const { sending, sent } = answering(answers());
    signedIn(sending);

    const group = await screen.findByRole("group", { name: m.found_kind() });
    expect(
      to("/api/askable/kinds", sent)[0]?.url.searchParams.get("member"),
    ).toBe(kitsId);
    await userEvent.click(
      within(group).getByRole("radio", { name: m.found_kind_albums() }),
    );
    await search("blue");

    const searched = to("/api/askable", sent).at(-1)?.url.searchParams;
    expect(searched?.get("kind")).toBe("music");
    expect(searched?.get("unit")).toBe("album");

    await userEvent.click(await screen.findByRole("button", { name: "Blue" }));
    const card = await screen.findByRole("dialog", { name: "Blue" });
    await userEvent.click(
      await within(card).findByRole("button", { name: m.found_ask() }),
    );
    await waitFor(() => {
      expect(to("/api/actions/ask", sent)).toHaveLength(2);
    });
    for (const asked of to("/api/actions/ask", sent)) {
      expect(asked.body).toMatchObject({
        id: album.id,
        kind: "music",
        unit: "album",
        found: album.found,
      });
    }
    const poster = to("/api/askable/mbid-blue/poster", sent).at(0)?.url;
    expect(poster?.searchParams.get("unit")).toBe("album");
  });

  it("searches again in the kind chosen after a search", async () => {
    const { sending, sent } = answering(answers());
    signedIn(sending);
    await search("dune");
    await screen.findByRole("button", { name: "Dune" });

    await userEvent.click(
      await screen.findByRole("radio", { name: m.found_kind_books() }),
    );
    await waitFor(() => {
      expect(
        to("/api/askable", sent).at(-1)?.url.searchParams.get("unit"),
      ).toBe("book");
    });
    expect(to("/api/askable", sent).at(-1)?.url.searchParams.get("term")).toBe(
      "dune",
    );
  });

  it("sends no kind or unit for series and films, which are searched together", async () => {
    const { sending, sent } = answering(answers());
    signedIn(sending);
    await screen.findByRole("group", { name: m.found_kind() });
    await search("dune");

    await userEvent.click(await screen.findByRole("button", { name: "Dune" }));
    await waitFor(() => {
      expect(to("/api/actions/ask", sent)).toHaveLength(1);
    });
    const searched = to("/api/askable", sent).at(-1)?.url.searchParams;
    expect(searched?.has("kind")).toBe(false);
    expect(searched?.has("unit")).toBe(false);
    expect(to("/api/actions/ask", sent)[0]?.body).not.toHaveProperty("unit");
  });

  it("is put away where lemonfiber turns the session away", async () => {
    const { sending } = answering((sent) =>
      sent.url.pathname === "/api/askable/kinds"
        ? { status: 401, body: nobody }
        : answers()(sent),
    );
    const { onrefused } = signedIn(sending);
    await waitFor(() => {
      expect(onrefused).toHaveBeenCalledWith(nobody);
    });
  });
});

describe("where a member goes to watch", () => {
  it("is beside the shelf, each place a link and a code, none that does not answer here", async () => {
    globalThis.history.replaceState(undefined, "", "/held");
    const away = addressAt("far.example:9000");
    const door = {
      ...kitsDoor,
      beside: [
        ...kitsDoor.beside,
        {
          service: "Where you listen",
          facing: "shelf" as const,
          because: "Listen to what the house keeps.",
          address: { url: away },
          reaches: "not-here" as const,
        },
      ],
    };
    const { sending, sent } = answering(answers(yours, kitsTelling, door));
    signedIn(sending);

    expect(
      await screen.findByRole("link", {
        name: m.member_door_open({ service: "Where you watch" }),
      }),
    ).toHaveAttribute("href", addressAt("house.local:8096"));
    expect(
      screen.getByRole("img", {
        name: m.member_door_code({ service: "Where you ask" }),
      }),
    ).toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain(away);
    expect(to("/api/front-door", sent)).toHaveLength(1);
  });
});

describe("tell me when", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("switches a way on with every way they are told on, and shows the ways since", async () => {
    const { sending, sent } = answering((one) =>
      one.url.pathname === "/api/actions/notify-choose"
        ? ok(
            enveloped("notify-mine", {
              ...kitsTelling,
              offered: kitsTelling.offered.map((way) => ({
                ...way,
                receiving: true,
              })),
            }),
          )
        : answers()(one),
    );
    signedIn(sending);

    await userEvent.click(
      await screen.findByRole("button", { name: "Our phones" }),
    );
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Our phones" }),
      ).toHaveAttribute("aria-pressed", "true");
    });
    const chose = to("/api/actions/notify-choose", sent);
    expect(chose).toHaveLength(1);
    expect(chose[0]?.method).toBe("POST");
    expect(chose[0]?.body).toEqual({ backends: ["family-chat", "phones"] });
  });

  it("says a choice did not go through, and moves nothing", async () => {
    const { sending } = answering((one) =>
      one.url.pathname === "/api/actions/notify-choose"
        ? "nothing"
        : answers()(one),
    );
    signedIn(sending);

    await userEvent.click(
      await screen.findByRole("button", { name: "Our phones" }),
    );
    expect(
      await screen.findByText(m.member_tell_unchosen()),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Our phones" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("is put away where lemonfiber turns the choice away", async () => {
    const { sending } = answering((one) =>
      one.url.pathname === "/api/actions/notify-choose"
        ? { status: 401, body: nobody }
        : answers()(one),
    );
    const { onrefused } = signedIn(sending);

    await userEvent.click(
      await screen.findByRole("button", { name: "Our phones" }),
    );
    await waitFor(() => {
      expect(onrefused).toHaveBeenCalledWith(nobody);
    });
  });
});

describe("what's new", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  const moved = (): Household => {
    const [first, ...rest] = yours.members;
    if (first === undefined) return yours;
    const [request, ...others] = first.requests;
    if (request === undefined) return yours;
    return {
      ...yours,
      members: [
        {
          ...first,
          requests: [
            { ...request, state: request.state === "here" ? "gone" : "here" },
            ...others,
          ],
        },
        ...rest,
      ],
    };
  };

  it("marks nothing the first time this browser shows the list", async () => {
    signedIn(answering(answers()).sending);
    await screen.findByRole("table");
    expect(screen.queryByText(m.member_new())).toBeNull();
    expect(globalThis.localStorage.getItem(keptAt(kitsId))).not.toBeNull();
  });

  it("marks what changed since this browser last showed it, and sends nothing of it", async () => {
    const first = answering(answers());
    signedIn(first.sending);
    await screen.findByRole("table");
    cleanup();

    const again = answering(answers(moved()));
    signedIn(again.sending);
    const marks = await screen.findAllByText(m.member_new());
    expect(marks).toHaveLength(1);

    for (const one of [...first.sent, ...again.sent]) {
      expect(one.method).toBe("GET");
      expect(one.url.origin).toBe(here);
      expect(one.body).toBeUndefined();
      expect(one.url.pathname).not.toBe("/api/news");
    }
  });
});
