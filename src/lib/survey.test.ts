import { describe, expect, it } from "vitest";
import {
  carryingLines,
  linkingLines,
  modeLines,
  occupantLines,
  surveyGroups,
} from "./survey";
import {
  adopt,
  helper,
  newerRadarr,
  olderSonarr,
  replace,
  separate,
  sonarr,
  survey,
  unread,
} from "../api/surveys";
import * as m from "../paraglide/messages.js";

describe("one container of somebody else's", () => {
  it("says it runs, the ports it publishes, and that lemonfiber could take it over", () => {
    expect(occupantLines(sonarr)).toStrictEqual([
      m.survey_running({ service: "sonarr" }),
      m.survey_publishes({ ports: "8989" }),
      m.survey_adoptable(),
    ]);
  });

  it("says it is stopped, publishes nothing, and could not be taken over", () => {
    expect(occupantLines(helper)).toStrictEqual([
      m.survey_stopped({ service: "cron-helper" }),
      m.survey_publishes_nothing(),
      m.survey_not_adoptable(),
    ]);
  });
});

describe("taking one service over", () => {
  it("names both versions and why, and that its database is backed up first", () => {
    expect(carryingLines(olderSonarr)).toStrictEqual([
      m.survey_versions({
        service: "sonarr",
        existing: "3.0.10",
        ours: "4.0.9",
        verdict: "ours",
      }),
      olderSonarr.because,
      m.survey_backup_first(),
    ]);
  });

  it("says where lemonfiber will not take it over", () => {
    expect(carryingLines(newerRadarr)).toStrictEqual([
      m.survey_versions({
        service: "radarr",
        existing: "6.0.0",
        ours: "5.8.3",
        verdict: "existing",
      }),
      newerRadarr.because,
      m.survey_refused(),
    ]);
  });
});

describe("a layout that cannot hold a hardlink", () => {
  const linking = separate;

  it("names the filesystems, why, the cost, that the layout is kept, and the remedy", () => {
    expect(linkingLines(linking)).toStrictEqual([
      m.survey_filesystems({ filesystems: "/mnt/tv, /mnt/downloads" }),
      linking.because,
      linking.cost,
      m.survey_layout_kept(),
      linking.remedy,
    ]);
  });

  it("does not say the layout is kept where lemonfiber says it would change it", () => {
    expect(linkingLines({ ...linking, forced: true })).not.toContain(
      m.survey_layout_kept(),
    );
  });
});

describe("what may be done", () => {
  it("says what each comes to, whether it disturbs what runs, and which is chosen", () => {
    expect(modeLines(adopt)).toStrictEqual([
      m.survey_mode({ mode: "adopt", what: adopt.what }),
      m.survey_leaves_alone(),
      m.survey_preselected(),
    ]);
    expect(modeLines(replace)).toStrictEqual([
      m.survey_mode({ mode: "replace", what: replace.what }),
      m.survey_disturbs(),
    ]);
  });
});

describe("everything the survey found", () => {
  it("is grouped in reading order: each project, the ports, taking over, hardlinks, what may be done, and what is named", () => {
    expect(surveyGroups(survey).map((group) => group.title)).toStrictEqual([
      m.survey_project({ project: "media" }),
      m.survey_ports_said(),
      m.survey_carrying_said(),
      m.survey_linking_said(),
      m.survey_modes_said(),
      m.survey_unsupported_said(),
      m.survey_not_carried_said(),
    ]);
  });

  it("names a port in the way and where lemonfiber would listen instead", () => {
    const ports = surveyGroups(survey).find(
      (group) => group.title === m.survey_ports_said(),
    );
    expect(ports?.entries).toStrictEqual([
      [m.survey_conflict({ port: 8989, held: "media", wanted: "sonarr" })],
      [m.survey_beside({ service: "sonarr", from: 8989, to: 18989 })],
    ]);
  });

  it("names what cannot be taken over and what is never carried, with why", () => {
    const groups = surveyGroups(survey);
    expect(groups.at(-2)?.entries).toStrictEqual([
      [
        m.survey_named({
          what: "media/cron-helper",
          because: "lemonfiber does not know it.",
        }),
      ],
    ]);
    expect(groups.at(-1)?.entries).toStrictEqual([
      [
        m.survey_named({
          what: "Custom scripts",
          because: "They are not part of any service.",
        }),
      ],
    ]);
  });

  it("leaves out every group with nothing under it", () => {
    expect(surveyGroups(unread)).toStrictEqual([]);
    expect(
      surveyGroups({ ...unread, read: true, linking: null }),
    ).toStrictEqual([]);
  });
});
