import { describe, expect, it } from "vitest";
import {
  quoted,
  readableOnThePath,
  servedReadout,
  settledReadout,
  shortened,
  stackReadout,
} from "./machine";
import { dayOf } from "./instant";
import { listed } from "./listed";
import {
  certificate,
  ownStack,
  servedEncrypted,
  servedHere,
  servedPlain,
  settledDone,
  shipped,
} from "../api/machines";
import * as m from "../paraglide/messages.js";

describe("how the console is served", () => {
  it("names its port, that it is encrypted and offered to the network, and the name a request carries", () => {
    expect(servedReadout(servedEncrypted).lines).toStrictEqual([
      m.served_port({ port: 8443 }),
      m.served_network(),
      m.served_named({ name: "media-box.local" }),
    ]);
  });

  it("shows the fingerprint in full beside the sentence asking to compare it, and the rest of the certificate", () => {
    expect(servedReadout(servedEncrypted).entries).toStrictEqual([
      {
        head: m.served_certificate(),
        lines: [
          m.served_fingerprint({ fingerprint: certificate.fingerprint }),
          m.served_compare(),
          m.served_subject({ subject: certificate.subject }),
          m.served_self_signed(),
          m.served_names({ names: listed(certificate.names) }),
          m.served_valid({
            from: dayOf(certificate.valid_from),
            until: dayOf(certificate.valid_until),
          }),
        ],
      },
    ]);
  });

  it("names who signed a certificate that is not its own, marks what was cut and counts names left out", () => {
    const signed = {
      ...servedEncrypted,
      network: false,
      named: null,
      certificate: {
        ...certificate,
        self_signed: false,
        issuer: "Household CA",
        issuer_cut: true,
        subject_cut: true,
        names_more: 3,
      },
    };
    const { lines, entries } = servedReadout(signed);
    expect(lines).toStrictEqual([
      m.served_port({ port: 8443 }),
      m.served_local(),
    ]);
    expect(entries[0]?.lines.slice(2, 5)).toStrictEqual([
      m.served_subject({ subject: shortened(certificate.subject, true) }),
      m.served_issuer({
        issuer: m.machine_shortened({ text: "Household CA" }),
      }),
      m.served_names_more({
        names: listed(certificate.names),
        count: 3,
      }),
    ]);
  });

  it("says one served without encryption to the network can be read on the path, and why it was not recorded", () => {
    expect(readableOnThePath(servedPlain)).toBe(true);
    expect(servedReadout(servedPlain)).toStrictEqual({
      lines: [
        m.served_port({ port: 8080 }),
        m.served_plain_network(),
        m.served_unrecorded({
          reason: "the stack folder could not be written to",
        }),
      ],
      entries: [],
    });
  });

  it("says one served without encryption to this machine alone is not encrypted, and raises nothing", () => {
    expect(readableOnThePath(servedHere)).toBe(false);
    expect(readableOnThePath(servedEncrypted)).toBe(false);
    expect(servedReadout(servedHere).lines).toStrictEqual([
      m.served_port({ port: 8080 }),
      m.served_plain_local(),
    ]);
  });
});

describe("running the stack without lemonfiber", () => {
  it("hands the exact words to copy, and each part they do not bring up with why", () => {
    expect(stackReadout(shipped)).toStrictEqual({
      lines: [
        m.stack_bundled(),
        m.stack_project({ path: "/srv/lemonfiber" }),
        m.stack_env({ path: "/srv/lemonfiber/.env" }),
      ],
      entries: [
        {
          head: "the tunnel",
          lines: ["it starts once lemonfiber has written its keys"],
        },
      ],
      commands: [
        {
          label: m.stack_up(),
          text: "docker compose --project-directory /srv/lemonfiber --env-file /srv/lemonfiber/.env up -d",
        },
        { label: m.stack_quiet(), text: "lemonfiber --yes <action>" },
      ],
    });
  });

  it("names the operator's own stack, and quotes a word the shell would split", () => {
    const told = stackReadout(ownStack);
    expect(told.lines[0]).toBe(m.stack_own({ path: "/srv/my stack" }));
    expect(told.commands?.[0]?.text).toBe(
      "docker compose --project-directory '/srv/my stack' up",
    );
  });

  it("quotes a word holding a quote so it reaches the command whole", () => {
    expect(quoted("it's")).toBe(`'it'"'"'s'`);
    expect(quoted("")).toBe("''");
    expect(quoted("up")).toBe("up");
  });
});

describe("what setup settled", () => {
  it("says where the library is, each way of downloading, who the services run as and that it is set up", () => {
    expect(settledReadout(settledDone)).toStrictEqual({
      lines: [
        m.settled_root({ path: "/srv/media" }),
        m.settled_usenet(),
        m.settled_torrent(),
        m.settled_user_set({ uid: 1000, gid: 1000 }),
        m.settled_done(),
      ],
      entries: [],
    });
  });

  it.each([
    ["part-set", "part-way", m.settled_user_part, m.settled_part_way],
    ["stack-owner", "none", m.settled_user_owner, m.settled_none],
  ] as const)(
    "says where the user came from (%s) and how far setup is (%s)",
    (from, setup, user, stands) => {
      const lines = settledReadout({
        data_root: null,
        protocols: { torrent: false, usenet: false },
        service_user: { from, gid: 100, uid: 99 },
        setup,
      }).lines;
      expect(lines).toStrictEqual([
        m.settled_no_root(),
        m.settled_no_usenet(),
        m.settled_no_torrent(),
        user({ uid: 99, gid: 100 }),
        stands(),
      ]);
    },
  );
});
