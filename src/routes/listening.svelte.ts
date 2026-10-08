/**
 * The console's live connection: what it last carried, and whether it still
 * carries.
 *
 * The stream carries the figures the overview and the disk are drawn from, the
 * line a wait says while it is still waiting, each step a walk takes while it
 * takes it, and each alert as it starts and as it ends. A connection that carried
 * figures and stopped leaves them in place and dates them; one that never
 * carried any has nothing to date. Whether anything is still listening is held,
 * so the screen can offer to open it again only when nothing is.
 */
import type { Arrival, Kind } from "@lemonfiber/sdk-ts";
import { carrying, watching, type Reaching } from "../api/asking";
import type { Flow } from "../lib/flow";
import { heardWith, type Heard } from "../lib/stepping";
import type { Alert, Moment } from "../lib/wire";

/** What the stream calls the payload the screens are drawn from. */
const MOMENTS = "dashboard" satisfies Kind;

/** What the stream calls a line said while a wait is still waiting. */
const WAITING = "start" satisfies Kind;

/** What the stream calls one step a walk takes while it takes it. */
const STEP = "step" satisfies Kind;

/** What the stream calls an alert starting or ending. */
const ALERT = "alert" satisfies Kind;

/** The live connection, as the console holds it. */
export class Listening {
  /** The figures the stream last carried, where it has carried any. */
  moment = $state<Moment | undefined>(undefined);

  /** Whether the connection is opening, carrying, stale or lost. */
  flow = $state<Flow>("opening");

  /** When what it last carried was true, where it has carried anything. */
  carriedAt = $state<number | undefined>(undefined);

  /** What a wait said while it is still waiting, where one is. */
  waitingSaid = $state<string | undefined>(undefined);

  /** Each step heard, by the job of the walk taking it. */
  steps = $state<Heard>({});

  /** The latest alert the stream said start or end, until it is put away. */
  told = $state<Alert | undefined>(undefined);

  /** Whether anything is still listening. */
  listening = $state(false);

  /** What ends the listening there is, for as long as there is one. */
  #gate = new AbortController();

  readonly #reaching: () => Reaching;

  constructor(reaching: () => Reaching) {
    this.#reaching = reaching;
  }

  /**
   * Listen to the stream until it is put away.
   *
   * A stream that opened and broke is reopened a few times; one that never
   * opened is tried once, and a stream that has given up looks from here
   * exactly like one that is still trying.
   */
  listen(): void {
    const opening = new AbortController();
    this.#gate = opening;
    const opened = watching(this.#reaching(), opening.signal);
    if (!opened.ok) {
      this.flow = "lost";
      return;
    }

    this.listening = true;
    void (async () => {
      for await (const arrival of opened.arrivals) {
        if (opening.signal.aborted) break;
        if (arrival.at === "lost") {
          this.#lost();
        } else if (carrying(arrival, MOMENTS)) {
          this.moment = arrival.data;
          if (arrival.at === "live") {
            this.flow = "live";
            this.carriedAt = Date.now();
          } else {
            this.flow = "stale";
            this.carriedAt = Date.now() - arrival.quietForMs;
          }
        } else if (carrying(arrival, WAITING)) {
          this.waitingSaid = arrival.data;
        } else if (arrival.at === "live") {
          this.#heard(arrival);
        }
      }
      this.listening = false;
    })();
  }

  /**
   * Open the stream again, for a connection nothing is opening on its own.
   *
   * Reopening is what a stream that carried and broke is given; a first
   * opening that failed is not one of those and is tried once. So the asking
   * is the operator's to make, and it is made from the banner that says so.
   */
  reopen(): void {
    this.#gate.abort();
    this.flow = "opening";
    this.listen();
  }

  /** Put away the alert on the screen, which the next one replaces anyway. */
  readonly dismiss = (): void => {
    this.told = undefined;
  };

  /**
   * A step or an alert that has just arrived.
   *
   * Only what arrives live is taken: what the stream hands over again after a
   * break is the last of each kind held from before it, already heard once,
   * and taking it twice would narrate a step twice or raise an alert again.
   * A step said for no job belongs to no walk this console can show.
   */
  #heard(arrival: Extract<Arrival, { at: "live" }>): void {
    if (carrying(arrival, STEP) && arrival.job !== undefined) {
      this.steps = heardWith(this.steps, arrival.job, arrival.data);
    } else if (carrying(arrival, ALERT)) {
      this.told = arrival.data;
    }
  }

  /** Stop listening, for a screen that is being put away. */
  stop(): void {
    this.#gate.abort();
  }

  /**
   * A connection that carried figures and stopped leaves them on the screen
   * and says how long ago they were true. One that never carried any has
   * nothing to date.
   */
  #lost(): void {
    this.flow = this.moment === undefined ? "lost" : "stale";
  }
}
