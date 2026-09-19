/**
 * Being let in by a password, for somebody who is not at the terminal.
 *
 * The per-run key answers one question — is this the machine's own operator —
 * and it answers it by having been printed on the terminal that started the
 * process. It is no use at all to somebody holding a phone, so there is a second
 * way in: a password, exchanged once for a session. What comes back travels in
 * the same header the per-run key does, so everything above here holds one thing
 * rather than two and every read is made the same way whichever way in was used.
 *
 * One request, carrying no key. It is the one endpoint this surface reaches
 * without one, since somebody holding a password and nothing else carries none
 * by definition — which is why it is not made through `./reached`, whose whole
 * business is that the key travels by having been written rather than by whoever
 * wrote the request having remembered it.
 *
 * The status is read before the body is. `401` is the wrong pair and `403` is a
 * request this server will not answer at all, and the client package reads both
 * as the key being the wrong one — which is the right reading everywhere a key
 * is what was sent, and the wrong one here, where nothing was. So the pair is
 * read from the status alone and everything else is handed to the package, whose
 * business is what a status that is not a success means.
 *
 * A refusal says the pair was not recognised and does not say which half. Two
 * credentials open this door — the operator's own and a household member's, held
 * by the media server — and naming the one that failed would say which accounts
 * exist to whoever is guessing.
 *
 * Nothing is kept about when the session ends. The server refuses an expired
 * session exactly as it refuses a wrong one, and a page holding its own copy of
 * that moment would be a second opinion about who is admitted.
 */
import {
  address,
  isKind,
  malformed,
  parse,
  refusalIn,
  unreachable,
  type Sending,
} from "@lemonfiber/sdk-ts";

/** Where a credential is exchanged for a session. */
const SESSION = "/api/session";

/** The status a pair this run does not hold is answered with. */
const NOT_RECOGNISED = 401;

/** What reaching one running lemonfiber takes, before there is anything to carry. */
export interface Arriving {
  /** Where it is listening, as the page's own address. */
  readonly at: string;
  readonly sending: Sending;
}

/**
 * What somebody handed over at the door.
 *
 * The name is absent for the operator, whose password is lemonfiber's own. It is
 * present for a household member, whose account the media server holds — and the
 * two are told apart by lemonfiber rather than by this page, which is why one
 * form takes both and no setting chooses between them.
 */
export interface Offered {
  /** Who is signing in, where it is not the operator. */
  readonly name?: string | undefined;
  readonly password: string;
}

/** What became of one attempt at the door. */
export type Arrived =
  /** Let in, and this is what every request after this one carries. */
  | { readonly at: "admitted"; readonly token: string }
  /** No account here answers to that pair. */
  | { readonly at: "not-recognised" }
  /** Not let in, and why, in lemonfiber's words. */
  | { readonly at: "declined"; readonly said: string };

/** Asking to be let in, handed to a screen so a story can answer it. */
export type Admitting = (offered: Offered) => Promise<Arrived>;

/**
 * Hand over a credential, and read what came back.
 */
export async function admitting(
  arriving: Arriving,
  offered: Offered,
): Promise<Arrived> {
  const where = address(arriving.at);
  if (!where.ok) return { at: "declined", said: where.problem.message };

  const given =
    offered.name === undefined
      ? { password: offered.password }
      : { name: offered.name, password: offered.password };

  let status: number;
  let said: string;
  try {
    const answer = await arriving.sending(`${where.base}${SESSION}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(given),
    });
    status = answer.status;
    said = await answer.text();
  } catch {
    return { at: "declined", said: unreachable().message };
  }

  if (status === NOT_RECOGNISED) return { at: "not-recognised" };
  if (status < 200 || status >= 300) {
    return { at: "declined", said: refusalIn(status, said).message };
  }

  const read = parse<unknown>(said);
  if (!read.ok) return { at: "declined", said: read.problem.message };
  if (!isKind(read.value, "admission")) {
    return { at: "declined", said: malformed().message };
  }

  return { at: "admitted", token: read.value.data.token };
}
