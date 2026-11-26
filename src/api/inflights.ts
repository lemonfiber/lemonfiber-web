/**
 * What a stop would interrupt, as a suite stands it in for a running
 * lemonfiber.
 *
 * Declared as the payload the kind carries, so the compiler asks whether each
 * field is one the contract has.
 */
import type { Reading } from "@lemonfiber/sdk-ts";
import type { InFlight, InFlightOf, Unfinished } from "../lib/inflight";

/** A series coming down over Usenet. */
export const expanse: Unfinished = {
  name: "The.Expanse.S01E01.1080p",
  progress: 62,
  protocol: "usenet",
};

/** A film coming down over a torrent. */
export const arrival: Unfinished = {
  name: "Arrival.2016.2160p",
  progress: 8,
  protocol: "torrent",
};

/** Two downloads a stop would interrupt. */
export const twoComing: InFlight = { downloads: [expanse, arrival] };

/** Nothing a stop would interrupt. */
export const nothingComing: InFlight = { downloads: [] };

/** A stack that names nothing still coming down, whatever is asked about. */
export const quietStack: InFlightOf = () => ({
  ok: true,
  value: nothingComing,
});

/** Two downloads still coming down, as the stack answered. */
export const coming: Reading<InFlight> = { ok: true, value: twoComing };

/** A stack that could not be asked what is still coming down. */
export const unreachable: Reading<InFlight> = {
  ok: false,
  problem: { kind: "unreachable", message: "lemonfiber did not answer." },
};
