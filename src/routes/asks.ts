/**
 * Every family of requests the console asks for, each with its asking awaiting
 * a yes, on the one desk their records are kept at.
 */
import { configuring, type Change } from "../lib/configuring";
import { filling, type Fill } from "../lib/filling";
import { finding, type Find } from "../lib/finding";
import { hosting, type Host } from "../lib/hosting";
import { mending, type Mend } from "../lib/mending";
import { moving, type Move } from "../lib/moving";
import { pairing, type Pair } from "../lib/pairing";
import { plugging, type Plug } from "../lib/plugging";
import { reclaiming, type Reclaim } from "../lib/reclaiming";
import { removing, type Remove } from "../lib/removing";
import { revoking, type Revoke } from "../lib/revoking";
import { scheduling, type Run } from "../lib/scheduling";
import { lettingGo, type Letting } from "../lib/seeding";
import { sharing, type Declare } from "../lib/sharing";
import { tending, type Tend } from "../lib/tending";
import { tuning, type Tune } from "../lib/tuning";
import { updating, type Update } from "../lib/updating";
import { upkeep, type Keep } from "../lib/upkeep";
import { valuing, type Value } from "../lib/valuing";
import { Asked, type Desk } from "./desk.svelte";

/** Each family's asking awaiting a yes. */
export interface Asks {
  readonly mend: Asked<Mend>;
  readonly keep: Asked<Keep>;
  readonly tune: Asked<Tune>;
  readonly fill: Asked<Fill>;
  readonly plug: Asked<Plug>;
  readonly revoke: Asked<Revoke>;
  readonly value: Asked<Value>;
  readonly move: Asked<Move>;
  readonly change: Asked<Change>;
  readonly tend: Asked<Tend>;
  readonly pair: Asked<Pair>;
  readonly share: Asked<Declare>;
  readonly update: Asked<Update>;
  readonly find: Asked<Find>;
  readonly host: Asked<Host>;
  readonly remove: Asked<Remove>;
  readonly letGo: Asked<Letting>;
  readonly reclaim: Asked<Reclaim>;
  readonly run: Asked<Run>;
}

/** Every family's asking, kept at this desk. */
export function asksAt(desk: Desk): Asks {
  return {
    mend: new Asked(desk, mending),
    keep: new Asked(desk, upkeep),
    tune: new Asked(desk, tuning),
    fill: new Asked(desk, filling),
    plug: new Asked(desk, plugging),
    revoke: new Asked(desk, revoking),
    value: new Asked(desk, valuing),
    move: new Asked(desk, moving),
    change: new Asked(desk, configuring),
    tend: new Asked(desk, tending),
    pair: new Asked(desk, pairing),
    share: new Asked(desk, sharing),
    update: new Asked(desk, updating),
    find: new Asked(desk, finding),
    host: new Asked(desk, hosting),
    remove: new Asked(desk, removing),
    letGo: new Asked(desk, lettingGo),
    reclaim: new Asked(desk, reclaiming),
    run: new Asked(desk, scheduling),
  };
}
