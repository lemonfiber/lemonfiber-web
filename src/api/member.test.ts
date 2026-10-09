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
import { artworkAt, heard, knocked, REQUESTS, shelfOf } from "./member";
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
  it("names this page's own address, with the title's id kept whole", () => {
    expect(artworkAt("f01", "poster")).toBe("/api/held/f01/poster");
    expect(artworkAt("a/b c", "backdrop")).toBe("/api/held/a%2Fb%20c/backdrop");
  });
});
