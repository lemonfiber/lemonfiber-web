/**
 * What is already on this machine, before anything is proposed, in groups of
 * lines a reader can carry.
 *
 * The survey names every project on this machine that is not lemonfiber's,
 * each container in it with whether it runs, the ports it publishes and
 * whether lemonfiber could take it over as it stands. Then the ports both want
 * and where lemonfiber would listen instead to run beside them, what adopting
 * each recognised service would come to for its data, what the existing
 * layout costs where it cannot hold a hardlink, what may be done about it all,
 * least destructive first, and what was found that cannot be adopted or that
 * no migration carries across. A survey that could not ask the container
 * engine says so, and never reads as an empty machine.
 *
 * What lemonfiber writes into the reading is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { listed } from "./listed";
import * as m from "../paraglide/messages.js";

/** What is already on this machine. */
export type Survey = ByKind["migration"]["data"];

/** One project on this machine that is not lemonfiber's. */
export type Standing = Survey["standing"][number];

/** One container of somebody else's project. */
export type Occupant = Standing["services"][number];

/** What adopting one recognised service would come to. */
export type Carrying = Survey["carrying"][number];

/** What the existing layout costs where it cannot hold a hardlink. */
export type Linking = NonNullable<Survey["linking"]>;

/** One thing the operator may do about what is here. */
export type Mode = Survey["modes"][number];

/** Something found that is named rather than passed over, and why. */
export type Named = Survey["unsupported"][number];

/** A heading, and every item under it, each line by line. */
export interface Group {
  readonly title: string;
  readonly entries: readonly (readonly string[])[];
}

/** One container, line by line. */
export function occupantLines(occupant: Occupant): readonly string[] {
  const { service, ports } = occupant;
  const runs = occupant.running
    ? m.survey_running({ service })
    : m.survey_stopped({ service });
  const publishes =
    ports.length === 0
      ? m.survey_publishes_nothing()
      : m.survey_publishes({ ports: listed(ports.map(String)) });
  const taken = occupant.adoptable
    ? m.survey_adoptable()
    : m.survey_not_adoptable();
  return [runs, publishes, taken];
}

/** What adopting one service would come to, line by line. */
export function carryingLines(carrying: Carrying): readonly string[] {
  const lines = [
    m.survey_versions({
      service: carrying.service,
      existing: carrying.existing,
      ours: carrying.ours,
      verdict: carrying.verdict,
    }),
    carrying.because,
  ];
  if (carrying.backup_first) lines.push(m.survey_backup_first());
  if (carrying.refused) lines.push(m.survey_refused());
  return lines;
}

/** What the existing layout costs where it cannot hold a hardlink. */
export function linkingLines(linking: Linking): readonly string[] {
  return [
    m.survey_filesystems({ filesystems: listed(linking.filesystems) }),
    linking.because,
    linking.cost,
    ...(linking.forced ? [] : [m.survey_layout_kept()]),
    linking.remedy,
  ];
}

/** One thing the operator may do, line by line. */
export function modeLines(mode: Mode): readonly string[] {
  return [
    m.survey_mode({ mode: mode.mode, what: mode.what }),
    mode.disturbs ? m.survey_disturbs() : m.survey_leaves_alone(),
    ...(mode.preselected ? [m.survey_preselected()] : []),
  ];
}

/** Something found that is named rather than passed over. */
function namedLine(named: Named): string {
  return m.survey_named({ what: named.what, because: named.because });
}

/** The ports in the way, and where lemonfiber would listen instead. */
function portLines(survey: Survey): readonly (readonly string[])[] {
  return [
    ...survey.conflicts.map((one) => [
      m.survey_conflict({
        port: one.port,
        held: one.held_by,
        wanted: one.wanted_by,
      }),
    ]),
    ...survey.beside.map((one) => [
      m.survey_beside({ service: one.service, from: one.from, to: one.to }),
    ]),
  ];
}

/**
 * Everything the survey found, as headed groups in the order a reader takes
 * them: each project, then the ports in the way, what adopting would carry,
 * what the layout costs, what may be done, and what is named and not carried.
 * A group with nothing under it is left out.
 */
export function surveyGroups(survey: Survey): readonly Group[] {
  const { linking } = survey;
  const groups: Group[] = [
    ...survey.standing.map((standing) => ({
      title: m.survey_project({ project: standing.project }),
      entries: standing.services.map((one) => occupantLines(one)),
    })),
    { title: m.survey_ports_said(), entries: portLines(survey) },
    {
      title: m.survey_carrying_said(),
      entries: survey.carrying.map((one) => carryingLines(one)),
    },
    {
      title: m.survey_linking_said(),
      entries:
        linking === undefined || linking === null
          ? []
          : [linkingLines(linking)],
    },
    {
      title: m.survey_modes_said(),
      entries: survey.modes.map((one) => modeLines(one)),
    },
    {
      title: m.survey_unsupported_said(),
      entries: survey.unsupported.map((one) => [namedLine(one)]),
    },
    {
      title: m.survey_not_carried_said(),
      entries: survey.not_carried.map((one) => [namedLine(one)]),
    },
  ];
  return groups.filter((group) => group.entries.length > 0);
}
