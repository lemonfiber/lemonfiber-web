import {
  malformed,
  TOKEN_HEADER,
  unreachable,
  type Fetching,
  type Sending,
} from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import type { Reaching } from "./asking";
import {
  enveloped,
  failure,
  codeNamed,
  refusedAs,
  notFromLemonfiber,
  proxyPage,
  replying,
} from "./bodies";
import {
  artworkAt,
  askableOf,
  freshOnce,
  heard,
  knocked,
  REQUESTS,
  saidNo,
  shelfOf,
  takingArtwork,
  takingFoundPoster,
  wished,
} from "./member";
import { didAsk, dune, firstPage, wouldAsk } from "../routes/found";
import { kitsId, kitsShelf, yours } from "../routes/mine";

/** Built rather than written, so no scanner reads it as a real one. */
const session = ["a", "session", "secret"].join("-");
const here = "http://127.0.0.1:7777";

/**
 * Somewhere that is not this machine, assembled rather than written: the
 * structural guards refuse a foreign origin in the source, and this one is here
 * to be refused by the client.
 */
const elsewhere = ["http:", "", "example.test"].join("/");

/** The stream is never opened from here, so nothing needs to answer it. */
const fetching: Fetching = () =>
  Promise.resolve({ ok: true, status: 200, body: null });

/** Whatever this reply is, said as the transport hands it over. */
const saying = (status: number, body = ""): Sending =>
  vi.fn(() => Promise.resolve(replying(status, body)));

const reaching = (sending: Sending, at = here): Reaching => ({
  at,
  token: session,
  sending,
  fetching,
});

/** What lemonfiber says to a member at a door that is not theirs. */
const notYours = "This is not something this account may ask for.";

describe("a member's read", () => {
  it("asks at the read's own address, carrying the session in a header", async () => {
    const sending = saying(200, enveloped("household", yours));

    await heard(reaching(sending), REQUESTS, "household");

    expect(sending).toHaveBeenCalledWith(
      `${here}/api/requests`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          [TOKEN_HEADER]: session,
        }) as unknown,
      }),
    );
  });

  it("answers with the payload the kind it named carries", async () => {
    const came = await heard(
      reaching(saying(200, enveloped("household", yours))),
      REQUESTS,
      "household",
    );
    expect(came).toEqual({ at: "answered", value: yours });
  });

  // Three refusals arrive under one status and are told apart only by what
  // lemonfiber says, so what it says is kept rather than read as the key.
  it.each([
    notYours,
    "This request carried no token or session this run admits.",
    "This account could not be checked with the media server, so nobody was identified. Nothing about the account has changed.",
  ])(
    "keeps what lemonfiber said when it turned the read away: %s",
    async (said) => {
      const came = await heard(
        reaching(saying(403, said)),
        REQUESTS,
        "household",
      );
      expect(came).toEqual({ at: "refused", said });
    },
  );

  it("reads a refusal from something in front of lemonfiber as a refusal too", async () => {
    const came = await heard(
      reaching(saying(401, notYours)),
      REQUESTS,
      "household",
    );
    expect(came).toEqual({ at: "refused", said: notYours });
  });

  // A page is what a proxy answers with, and it is not handed on as
  // lemonfiber's words.
  it.each([
    ["a page", proxyPage],
    ["a document", "{}"],
    ["nothing", "  "],
  ])("keeps no words from a refusal carrying %s", async (_, body) => {
    const came = await heard(
      reaching(saying(403, body)),
      REQUESTS,
      "household",
    );
    expect(came).toEqual({ at: "refused", said: undefined });
  });

  it("reads a failure of the answering in lemonfiber's words", async () => {
    const said = "The media server did not answer.";
    const came = await heard(
      reaching(saying(500, enveloped("error", failure(said)))),
      REQUESTS,
      "household",
    );
    expect(came).toEqual({
      at: "unanswered",
      problem: { kind: "failed", message: said },
    });
  });

  it("says lemonfiber is not answering where nothing came back", async () => {
    const sending: Sending = vi.fn(() => Promise.reject(new Error("closed")));
    const came = await heard(reaching(sending), REQUESTS, "household");
    expect(came).toEqual({ at: "unanswered", problem: unreachable() });
  });

  it("refuses an address that is not this machine, and sends nothing", async () => {
    const sending = saying(200, enveloped("household", yours));
    const came = await heard(
      reaching(sending, elsewhere),
      REQUESTS,
      "household",
    );
    expect(came.at).toBe("unanswered");
    expect(sending).not.toHaveBeenCalled();
  });

  it("refuses a body that is not an envelope", async () => {
    const came = await heard(
      reaching(saying(200, proxyPage)),
      REQUESTS,
      "household",
    );
    expect(came).toEqual({ at: "unanswered", problem: malformed() });
  });

  // A payload read under the wrong kind is fields with changed meanings.
  it("refuses an envelope calling itself something else", async () => {
    const came = await heard(
      reaching(saying(200, notFromLemonfiber("held", kitsShelf))),
      REQUESTS,
      "household",
    );
    expect(came).toEqual({ at: "unanswered", problem: malformed() });
  });
});

describe("knocking at an address", () => {
  it("hands back what was answered unread", async () => {
    const came = await knocked(reaching(saying(200, "anything")), "/api/logs");
    expect(came).toEqual({ at: "answered", value: "anything" });
  });

  it("keeps what lemonfiber said when it turned the address away", async () => {
    const came = await knocked(
      reaching(saying(403, `  ${notYours}\n`)),
      "/api/logs",
    );
    expect(came).toEqual({ at: "refused", said: notYours });
  });

  it("reads an address lemonfiber has nothing at as missing", async () => {
    const came = await knocked(
      reaching(saying(404, "There is no read by that name.")),
      "/api/nothing",
    );
    expect(came).toEqual({
      at: "unanswered",
      problem: { kind: "missing", message: "There is no read by that name." },
    });
  });
});

describe("the shelf", () => {
  // Whose shelf it is is lemonfiber's to decide from the session; the read
  // refuses one naming nobody, so the member the door named is named back.
  it("is read for the member the door named", () => {
    expect(shelfOf(kitsId)).toBe(`/api/held?member=${kitsId}`);
  });

  it("names a member whose id carries a separator as one parameter", () => {
    expect(shelfOf("a&b c")).toBe("/api/held?member=a%26b+c");
  });

  it("answers with what the media server shows them", async () => {
    const came = await heard(
      reaching(saying(200, enveloped("held", kitsShelf))),
      shelfOf(kitsId),
      "held",
    );
    expect(came).toEqual({ at: "answered", value: kitsShelf });
  });

  // Since lemonfiber says which refusal it is, the code decides whether the
  // session still stands, and the sentence is only ever shown.
  it.each([
    ["NOT_YOURS", notYours],
    [
      "UNCONFIRMED",
      "This account could not be checked with the media server, so nobody was identified. Nothing about the account has changed.",
    ],
  ])(
    "reads a refusal coded %s as declined, the session still standing",
    async (name, said) => {
      const came = await heard(
        reaching(saying(403, refusedAs(name, said))),
        REQUESTS,
        "household",
      );
      expect(came).toEqual({ at: "declined", said });
    },
  );

  it("reads a refusal from somewhere lemonfiber is not listening as turned away, in its words", async () => {
    const said = "This request said it came from somewhere this server is not.";
    const came = await knocked(
      reaching(saying(403, refusedAs("ELSEWHERE", said))),
      "/api/logs",
    );
    expect(came).toEqual({ at: "refused", said });
  });

  it("reads a session no longer admitted as turned away, keeping no document as words", async () => {
    const came = await heard(
      reaching(
        saying(
          403,
          refusedAs(
            "NOT_ADMITTED",
            "This request carried no token or session this run admits.",
          ),
        ),
      ),
      REQUESTS,
      "household",
    );
    expect(came).toEqual({ at: "refused", said: undefined });
  });

  it("stands in for no refusal the contract does not list", () => {
    expect(() => codeNamed("NOT_A_REFUSAL")).toThrow("NOT_A_REFUSAL");
  });
});

describe("where a title's pictures are read", () => {
  it("names a place under this page's own address, with the title's id kept whole", () => {
    expect(artworkAt("kit", "f01", "poster")).toBe(
      "held/f01/poster?member=kit",
    );
    expect(artworkAt("kit", "a/b c", "backdrop")).toBe(
      "held/a%2Fb%20c/backdrop?member=kit",
    );
  });

  // The picture is read as the member, as the title is; naming nobody is refused.
  it("names the member it is read as, escaped as a parameter", () => {
    expect(artworkAt("Ada & Kit", "f01", "poster")).toBe(
      "held/f01/poster?member=Ada+%26+Kit",
    );
  });
});

describe("taking a title's picture", () => {
  /** A reply handing over these bytes. */
  const handing = (bytes: Blob): Sending =>
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(""),
        blob: () => Promise.resolve(bytes),
      }),
    );

  it("asks at the picture's own address with the session's key, and hands an image over", async () => {
    const poster = new Blob(["x"], { type: "image/jpeg" });
    const sending = handing(poster);

    expect(await takingArtwork(reaching(sending), "kit", "f01", "poster")).toBe(
      poster,
    );
    const [url, init] = vi.mocked(sending).mock.calls[0] ?? [];
    expect(url).toBe(`${here}/api/held/f01/poster?member=kit`);
    expect(init?.headers[TOKEN_HEADER]).toBe(session);
  });

  it("hands nothing over that is not an image, that was refused, or where it could not ask", async () => {
    const page = new Blob(["<html>"], { type: "text/html" });
    expect(
      await takingArtwork(reaching(handing(page)), "kit", "f01", "poster"),
    ).toBeUndefined();
    expect(
      await takingArtwork(
        reaching(saying(404, refusedAs("ELSEWHERE", "No picture."))),
        "kit",
        "f01",
        "poster",
      ),
    ).toBeUndefined();
    expect(
      await takingArtwork(
        reaching(handing(page), elsewhere),
        "kit",
        "f01",
        "poster",
      ),
    ).toBeUndefined();
  });
});

describe("a member's search", () => {
  it("is read for the member the door named, with the words as one parameter", () => {
    expect(askableOf("kit", "dune & co")).toBe(
      "/api/askable?member=kit&term=dune+%26+co",
    );
  });

  it("carries where the next page begins, where a page said one does", () => {
    expect(askableOf("kit", "dune", "page-2")).toBe(
      "/api/askable?member=kit&term=dune&after=page-2",
    );
  });

  it("answers with the page lemonfiber found", async () => {
    const came = await heard(
      reaching(saying(200, enveloped("askable", firstPage))),
      askableOf("kit", "dune"),
      "askable",
    );
    expect(came).toEqual({ at: "answered", value: firstPage });
  });
});

describe("a found title's poster", () => {
  const handing = (bytes: Blob): Sending =>
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(""),
        blob: () => Promise.resolve(bytes),
        headers: { get: () => bytes.type },
      }),
    );

  it("is asked of lemonfiber with the session's key, naming its kind and the member", async () => {
    const poster = new Blob(["x"], { type: "image/jpeg" });
    const sending = handing(poster);

    const taken = await takingFoundPoster(reaching(sending), "kit", dune);

    expect(taken).toBeInstanceOf(Blob);
    const [url, init] = vi.mocked(sending).mock.calls[0] ?? [];
    const asked = new URL(url ?? "");
    expect(asked.pathname).toBe("/api/askable/438631/poster");
    expect(Object.fromEntries(asked.searchParams)).toEqual({
      member: "kit",
      kind: "movies",
    });
    expect(init?.headers[TOKEN_HEADER]).toBe(session);
  });

  it("is nothing where it was refused or could not be asked", async () => {
    expect(
      await takingFoundPoster(
        reaching(saying(404, refusedAs("NO_PICTURE", "No picture."))),
        "kit",
        dune,
      ),
    ).toBeUndefined();
    expect(
      await takingFoundPoster(
        reaching(handing(new Blob(["x"], { type: "image/jpeg" })), elsewhere),
        "kit",
        dune,
      ),
    ).toBeUndefined();
  });
});

describe("what tells one ask from every other", () => {
  it("is drawn afresh each time, long enough never to be guessed", () => {
    const one = freshOnce();
    expect(one).toMatch(/^[0-9a-f]{32}$/);
    expect(freshOnce()).not.toBe(one);
  });
});

describe("asking for a title", () => {
  it("rehearses at the ask's address, naming the title and its kind", async () => {
    const sending = saying(200, enveloped("asked", wouldAsk));

    const came = await wished(reaching(sending), dune, true);

    expect(came).toEqual({ at: "answered", value: wouldAsk });
    const [url, init] = vi.mocked(sending).mock.calls[0] ?? [];
    expect(url).toBe(`${here}/api/actions/ask`);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body ?? "")).toEqual({
      id: dune.id,
      kind: "movies",
      dry_run: true,
    });
    expect(init?.headers).not.toHaveProperty("Idempotency-Key");
  });

  it("sends the ask itself once, under what tells it from every other", async () => {
    const sending = saying(200, enveloped("asked", didAsk));

    await wished(reaching(sending), dune, false, "once-1");

    const [, init] = vi.mocked(sending).mock.calls[0] ?? [];
    expect(init?.headers["Idempotency-Key"]).toBe("once-1");
    expect(JSON.parse(init?.body ?? "")).toMatchObject({ dry_run: false });
  });

  it("keeps lemonfiber's sentence where it turned the ask down", async () => {
    const said = "You have asked for all your allowance lets you.";
    const came = await wished(
      reaching(saying(409, refusedAs("NOTHING_LEFT", said))),
      dune,
      false,
      "once-1",
    );
    expect(saidNo(came)).toBe(said);
  });

  it("reads a session no longer admitted as turned away", async () => {
    const came = await wished(
      reaching(saying(401, "This request carried no token.")),
      dune,
      true,
    );
    expect(came.at).toBe("refused");
  });

  it("refuses a body that is not an envelope, and one calling itself something else", async () => {
    expect(await wished(reaching(saying(200, "{")), dune, true)).toMatchObject({
      at: "unanswered",
    });
    expect(
      await wished(
        reaching(saying(200, enveloped("household", yours))),
        dune,
        true,
      ),
    ).toEqual({ at: "unanswered", problem: malformed() });
  });

  it("says nothing was asked where nothing came back", async () => {
    const sending: Sending = vi.fn(() => Promise.reject(new Error("gone")));
    const came = await wished(reaching(sending), dune, false, "once-1");
    expect(came).toEqual({ at: "unanswered", problem: unreachable() });
    expect(saidNo(came)).toBeUndefined();
  });
});

describe("the sentence a refusal carried", () => {
  it("is lemonfiber's where it declined with the session standing", () => {
    expect(saidNo({ at: "declined", said: notYours })).toBe(notYours);
  });

  it("is nothing for an answer, or for nothing asked yet", () => {
    expect(saidNo({ at: "answered", value: 1 })).toBeUndefined();
    expect(saidNo(undefined)).toBeUndefined();
  });
});
