/**
 * What a member's rooms read beside what they asked for: the kinds they may
 * ask for on Find, where to watch beside the shelf, and how they are told on
 * the list of what they asked for, with which of their requests are new.
 *
 * Each is read on the way into the room it is drawn in and dropped on the way
 * out. An answer for a room since left dates nothing and is dropped; being
 * turned away is passed on wherever the member has gone.
 */
import type { Reaching } from "../api/asking";
import {
  chose,
  DOOR,
  heard,
  kindsOf,
  toldOf,
  type Answer,
  type Heard,
} from "../api/member";
import { browserKeeping, type Keeping } from "../lib/keeping";
import { choicesOf, pickedOf, type Kinds } from "../lib/kinds";
import type { Whereabouts } from "../lib/rooms";
import {
  keepShown,
  keptShown,
  newlyOf,
  shownOf,
  type Shown,
} from "../lib/seen";
import { toggled, type Telling } from "../lib/telling";
import type { Door } from "../lib/ways";
import type { Household } from "../lib/wire";

/** What choosing how they are told came to, where it did not come to the ways since. */
export type Choosing = "sending" | Exclude<Heard<Telling>, { at: "answered" }>;

/** Who is asking: what reaching lemonfiber takes, and the member the door named. */
export interface Asker {
  readonly reaching: Reaching;
  readonly member: string;
}

export class Hearing {
  kinds = $state<Heard<Kinds> | undefined>(undefined);
  door = $state<Heard<Door> | undefined>(undefined);
  telling = $state<Heard<Telling> | undefined>(undefined);
  choosing = $state<Choosing | undefined>(undefined);
  fresh = $state<readonly string[]>([]);
  #picked = $state<string | undefined>(undefined);

  readonly choices = $derived(
    this.kinds?.at === "answered" ? choicesOf(this.kinds.value) : undefined,
  );

  readonly asking = $derived(
    this.choices === undefined
      ? undefined
      : pickedOf(this.choices, this.#picked),
  );

  readonly #asker: () => Asker;
  readonly #turned: (said: string | undefined) => void;
  readonly #keeping: Keeping | undefined;
  #arrival = 0;
  #room = "";
  #before: Shown | undefined;

  constructor(
    asker: () => Asker,
    turned: (said: string | undefined) => void,
    keeping: Keeping | undefined = browserKeeping(),
  ) {
    this.#asker = asker;
    this.#turned = turned;
    this.#keeping = keeping;
  }

  /** Arrive somewhere: drop what the last room read, and read what this one draws. */
  arrive(to: Whereabouts): void {
    this.#arrival += 1;
    this.kinds = undefined;
    this.door = undefined;
    this.telling = undefined;
    this.choosing = undefined;
    this.fresh = [];
    this.#picked = undefined;
    this.#room = "room" in to ? to.room : "";
    const { reaching, member } = this.#asker();
    this.#before = keptShown(this.#keeping, member);
    if (this.#room === "find")
      void this.#take(
        heard(reaching, kindsOf(member), "askable-kinds"),
        (answer) => {
          this.kinds = answer;
        },
      );
    if (this.#room === "held")
      void this.#take(heard(reaching, DOOR, "front-door"), (answer) => {
        this.door = answer;
      });
    if (this.#room === "asked")
      void this.#take(
        heard(reaching, toldOf(member), "notify-mine"),
        (answer) => {
          this.telling = answer;
        },
      );
  }

  /** Take what was picked to search for and ask in. */
  pick(key: string): void {
    this.#picked = key;
  }

  /**
   * Take what they asked for as it was just answered. On the list of what they
   * asked for, it is shown: what changed since this browser last showed it is
   * marked, and what is shown now is kept in this browser alone.
   */
  saw(household: Household): void {
    if (this.#room !== "asked") return;
    const now = shownOf(household);
    this.fresh = newlyOf(this.#before, now);
    keepShown(this.#keeping, this.#asker().member, now);
  }

  /** Switch one way of being told the other way, and take the ways as they stand since. */
  async tick(id: string): Promise<void> {
    if (this.telling?.at !== "answered" || this.choosing === "sending") return;
    const arrival = this.#arrival;
    this.choosing = "sending";
    const answer = await chose(
      this.#asker().reaching,
      toggled(this.telling.value.offered, id),
    );
    if (this.#away(answer) || arrival !== this.#arrival) return;
    if (answer.at === "answered") {
      this.telling = answer;
      this.choosing = undefined;
      return;
    }
    this.choosing = answer;
  }

  async #take<T>(
    asking: Promise<Answer<T>>,
    take: (answer: Heard<T>) => void,
  ): Promise<void> {
    const arrival = this.#arrival;
    const answer = await asking;
    if (this.#away(answer) || arrival !== this.#arrival) return;
    take(answer);
  }

  /** Whether lemonfiber turned the session away, which is passed on. */
  #away<T>(answer: Answer<T>): answer is Extract<Answer<T>, { at: "refused" }> {
    if (answer.at !== "refused") return false;
    this.#turned(answer.said);
    return true;
  }
}
