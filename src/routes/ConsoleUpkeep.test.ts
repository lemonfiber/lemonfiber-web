import { render, screen, waitFor, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import {
  API_VERSION,
  type ByKind,
  type Fetching,
  type Kind,
  type Sending,
} from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { allWell } from "./findings";
import {
  archive,
  backed,
  described,
  destination,
  kept,
  listed,
  listing,
  restored,
  written,
} from "../api/archived";
import { bytes } from "../lib/figures";
import * as m from "../paraglide/messages.js";

const key = ["a", "run", "key"].join("-");
const here = "http://127.0.0.1:7777";
const job = "4e1ab7d0e5c639f2";

/** One envelope, rendered as an endpoint renders it. */
const enveloped = <K extends Kind>(kind: K, data: ByKind[K]["data"]): string =>
  JSON.stringify({ api_version: API_VERSION, kind, data });

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () => Promise.resolve({ ok: false, body: null });

/** One reply, as a transport hands it over, or no reply at all. */
type Says = { readonly status: number; readonly body: string } | "unreachable";

/** The name for work handed to the runtime, as every job is answered. */
const started: Says = {
  status: 202,
  body: enveloped("job", { job, action: "x" }),
};

/** What was asked of the stack, in the order it was asked. */
interface Asked {
  /** Each action, by the address it was posted to and what it carried. */
  readonly posted: { readonly at: string; readonly body: string }[];
  /** How many times the backups were read. */
  listed: number;
  /** Each file asked for, by the address it was asked at. */
  readonly taken: string[];
  /** Whether a file asked for is turned away for the key. */
  turnedAway?: boolean;
}

/**
 * A stack that answers each action as it is told to, or with a name for the
 * work where it is not, and redeems each name for the next of what it was
 * given — holding at the last.
 */
function stack(
  answers: Partial<Record<string, readonly Says[]>>,
  becoming: readonly Says[],
  asked: Asked,
): Sending {
  let redeemed = 0;
  const posts = new Map<string, number>();
  return (url, init) => {
    const said = (answer: Says) =>
      answer === "unreachable"
        ? Promise.reject(new TypeError("Failed to fetch"))
        : Promise.resolve({
            ok: answer.status >= 200 && answer.status < 300,
            status: answer.status,
            text: () => Promise.resolve(answer.body),
          });
    const at = url.replace(here, "");
    if (init.method === "POST") {
      asked.posted.push({ at, body: init.body ?? "" });
      const count = posts.get(at) ?? 0;
      posts.set(at, count + 1);
      const replies = answers[at.replace("/api/actions/", "")] ?? [started];
      return said(replies[Math.min(count, replies.length - 1)] ?? started);
    }
    if (at.startsWith("/api/jobs/")) {
      const next = becoming[Math.min(redeemed, becoming.length - 1)];
      redeemed += 1;
      return said(next ?? started);
    }
    if (at.startsWith("/api/bundle/")) {
      asked.taken.push(at);
      if (asked.turnedAway) return said({ status: 401, body: "" });
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(""),
        blob: () => Promise.resolve(new Blob(["gzipped"])),
      });
    }
    if (at.startsWith("/api/backups")) {
      asked.listed += 1;
      return said({ status: 200, body: enveloped("archives", kept) });
    }
    if (at.startsWith("/api/storage") || at.startsWith("/api/checks")) {
      return said({ status: 200, body: enveloped("doctor", allWell) });
    }
    return said({ status: 404, body: "" });
  };
}

const opened = (
  at: string,
  sending: Sending,
  onrefused: () => void = vi.fn(),
): void => {
  globalThis.history.replaceState(undefined, "", at);
  render(Console, {
    reaching: { at: here, token: key, sending, fetching: silent },
    onrefused,
    pausing: () => Promise.resolve(),
  });
};

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

const backups = (): HTMLElement =>
  screen.getByRole("status", { name: m.backups_asked() });

const support = (): HTMLElement =>
  screen.getByRole("status", { name: m.support_asked() });

const fresh = (): Asked => ({ posted: [], listed: 0, taken: [] });

describe("taking a backup from the disk screen", () => {
  it("lists the backups kept, read on the way in", async () => {
    const sent = fresh();
    opened("/storage", stack({}, [], sent));

    expect(await screen.findByText(archive)).toBeInTheDocument();
    expect(sent.listed).toBe(1);
  });

  // Nothing comes back to read before a backup is written, so what it writes
  // is said before the yes and nothing is sent until then.
  it("says what it writes before the yes, and sends nothing yet", async () => {
    const sent = fresh();
    opened("/storage", stack({}, [], sent));
    await screen.findByText(archive);

    await press(m.action_backup());

    expect(
      within(backups()).getByText(m.confirm_backup_prose()),
    ).toBeInTheDocument();
    expect(sent.posted).toStrictEqual([]);

    await press(m.action_leave_as_is());
    expect(screen.queryByText(m.confirm_backup_prose())).toBeNull();
    expect(sent.posted).toStrictEqual([]);
  });

  it("takes one on a yes, follows it to where it went, and reads the backups again", async () => {
    const sent = fresh();
    opened(
      "/storage",
      stack({}, [{ status: 200, body: enveloped("backup", backed) }], sent),
    );
    await screen.findByText(archive);

    await press(m.action_backup());
    await press(m.action_backup_yes());

    expect(sent.posted).toStrictEqual([
      { at: "/api/actions/backup", body: "{}" },
    ]);
    expect(
      await within(backups()).findByText(
        m.came_backup_path({ path: backed.path, scope: m.came_scope_whole() }),
      ),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(sent.listed).toBe(2);
    });
  });

  // lemonfiber takes a backup only of a stopped stack, and says so. That is a
  // refusal, in its words, and reads differently from a page that lost track.
  it("says a refusal in lemonfiber's words", async () => {
    const running =
      "The stack is still running. Stop it before taking a backup.";
    const sent = fresh();
    opened("/storage", stack({}, [{ status: 409, body: running }], sent));
    await screen.findByText(archive);

    await press(m.action_backup());
    await press(m.action_backup_yes());

    expect(await within(backups()).findByText(running)).toBeInTheDocument();
    expect(
      within(backups()).getByText(m.eyebrow_stopped_short()),
    ).toBeInTheDocument();
  });

  it("says it lost track where lemonfiber could not be asked", async () => {
    const sent = fresh();
    opened("/storage", stack({}, ["unreachable"], sent));
    await screen.findByText(archive);

    await press(m.action_backup());
    await press(m.action_backup_yes());

    expect(
      await within(backups()).findByText(m.eyebrow_lost_track()),
    ).toBeInTheDocument();
  });
});

describe("putting a backup back", () => {
  const listed200: Says = {
    status: 200,
    body: enveloped("restore", listing),
  };

  // The listing changes nothing, so it is asked for at once, by name alone,
  // and read before anything is agreed to.
  it("asks what putting it back would do first, and shows it before any yes", async () => {
    const sent = fresh();
    opened("/storage", stack({ restore: [listed200] }, [], sent));
    await screen.findByText(archive);

    await press(m.action_restore_listing({ archive }));

    expect(
      await within(backups()).findByText(
        m.came_restore_relocation({ now: "/mnt/media", was: "/srv/media" }),
      ),
    ).toBeInTheDocument();
    expect(sent.posted).toStrictEqual([
      { at: "/api/actions/restore", body: JSON.stringify({ archive }) },
    ]);
  });

  it("puts it back on a yes naming the listing, and says what it put back", async () => {
    const sent = fresh();
    opened(
      "/storage",
      stack(
        { restore: [listed200, started] },
        [{ status: 200, body: enveloped("restore", restored) }],
        sent,
      ),
    );
    await screen.findByText(archive);
    await press(m.action_restore_listing({ archive }));
    await within(backups()).findByText(m.backups_listing_title({ archive }));

    await press(m.backups_repoint_label());
    await press(m.action_restore_yes({ archive }));

    expect(sent.posted.at(-1)).toStrictEqual({
      at: "/api/actions/restore",
      body: JSON.stringify({
        archive,
        confirm: true,
        offer: listed,
        repoint: true,
      }),
    });
    expect(
      await within(backups()).findByText(
        m.came_restore_repointed({ now: "/mnt/media", was: "/srv/media" }),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(m.backups_listing_title({ archive }))).toBeNull();
  });

  // A listing that has moved on is refused by lemonfiber, in its words.
  it("says a refused agreement in lemonfiber's words", async () => {
    const moved = "The archive has changed since it was listed.";
    const sent = fresh();
    opened(
      "/storage",
      stack({ restore: [listed200, { status: 409, body: moved }] }, [], sent),
    );
    await screen.findByText(archive);
    await press(m.action_restore_listing({ archive }));
    await within(backups()).findByText(m.backups_listing_title({ archive }));

    await press(m.action_restore_yes({ archive }));

    expect(await within(backups()).findByText(moved)).toBeInTheDocument();
    expect(
      within(backups()).getByText(m.eyebrow_refused()),
    ).toBeInTheDocument();
  });
});

describe("gathering a support bundle from the checks screen", () => {
  const read200: Says = { status: 200, body: enveloped("bundle", described) };

  it("describes a bundle first, and shows every file before any yes", async () => {
    const sent = fresh();
    opened("/checks", stack({ support: [read200] }, [], sent));
    await screen.findByText(m.action_support_describe());

    await press(m.action_support_describe());

    expect(
      await within(support()).findByText(
        m.came_bundle_would({
          path: destination,
          size: bytes(described.bytes),
        }),
      ),
    ).toBeInTheDocument();
    expect(within(support()).getByText("logs/sonarr.txt")).toBeInTheDocument();
    expect(sent.posted).toStrictEqual([
      {
        at: "/api/actions/support",
        body: JSON.stringify({ write: false, logs: 200, filenames: false }),
      },
    ]);
  });

  it("writes it on the terms it was read under, and says where it went", async () => {
    const sent = fresh();
    opened(
      "/checks",
      stack(
        { support: [read200, started] },
        [{ status: 200, body: enveloped("bundle", written) }],
        sent,
      ),
    );
    await screen.findByText(m.action_support_describe());
    await press(m.action_support_describe());
    await within(support()).findByText(m.support_bundle_title());

    await press(m.action_support_write());

    expect(sent.posted.at(-1)).toStrictEqual({
      at: "/api/actions/support",
      body: JSON.stringify({ write: true, logs: 200, filenames: false }),
    });
    expect(
      await within(support()).findByText(
        m.came_bundle_written({
          path: destination,
          size: bytes(written.bytes),
        }),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(m.support_bundle_title())).toBeNull();
  });

  it("hands the bundle written to the browser, by the name it was written under", async () => {
    URL.createObjectURL = vi.fn(() => "blob:bundle");
    URL.revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    const sent = fresh();
    opened(
      "/checks",
      stack(
        { support: [read200, started] },
        [{ status: 200, body: enveloped("bundle", written) }],
        sent,
      ),
    );
    await screen.findByText(m.action_support_describe());
    await press(m.action_support_describe());
    await within(support()).findByText(m.support_bundle_title());
    await press(m.action_support_write());
    await screen.findByText(m.action_support_save());

    await press(m.action_support_save());

    await waitFor(() => {
      expect(click).toHaveBeenCalledOnce();
    });
    expect(sent.taken).toStrictEqual(["/api/bundle/bundle.tar.gz"]);
    click.mockRestore();
  });

  it("passes a key turned away while saving on, as every refusal of it is", async () => {
    const onrefused = vi.fn();
    const sent = { ...fresh(), turnedAway: true };
    opened(
      "/checks",
      stack(
        { support: [read200, started] },
        [{ status: 200, body: enveloped("bundle", written) }],
        sent,
      ),
      onrefused,
    );
    await screen.findByText(m.action_support_describe());
    await press(m.action_support_describe());
    await within(support()).findByText(m.support_bundle_title());
    await press(m.action_support_write());
    await screen.findByText(m.action_support_save());

    await press(m.action_support_save());

    await waitFor(() => {
      expect(onrefused).toHaveBeenCalledOnce();
    });
    expect(sent.taken).toStrictEqual(["/api/bundle/bundle.tar.gz"]);
  });
});

describe("the records the two panels keep", () => {
  it("puts one away when it is asked to", async () => {
    const sent = fresh();
    opened(
      "/storage",
      stack({}, [{ status: 200, body: enveloped("backup", backed) }], sent),
    );
    await screen.findByText(archive);
    await press(m.action_backup());
    await press(m.action_backup_yes());
    await within(backups()).findByText(m.doing_backup_title());

    await press(m.action_hide_record());

    expect(within(backups()).queryByText(m.doing_backup_title())).toBeNull();
  });
});
