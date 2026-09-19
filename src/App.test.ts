import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { API_VERSION, type Fetching, type Sending } from "@lemonfiber/sdk-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.svelte";
import { remember, remembered } from "./api/token";
import { stack, worstService } from "./routes/fixture";
import * as m from "./paraglide/messages.js";

const key = ["a", "run", "key"].join("-");
const session = ["a", "session", "secret"].join("-");
const password = ["a", "chosen", "password"].join("-");
const here = "http://127.0.0.1:7777";

const enveloped = (kind: string, data: unknown): string =>
  JSON.stringify({ api_version: API_VERSION, kind, data });

const answering: Sending = () =>
  Promise.resolve({
    ok: true,
    status: 200,
    text: () => Promise.resolve(enveloped("status", stack)),
  });

/** A run that admits one password and answers every read from the fixture. */
const admitting: Sending = (url) =>
  Promise.resolve({
    ok: true,
    status: 200,
    text: () =>
      Promise.resolve(
        url.endsWith("/api/session")
          ? enveloped("admission", {
              token: session,
              until: "2026-09-19T21:00:00Z",
            })
          : enveloped("status", stack),
      ),
  });

const refusing: Sending = () =>
  Promise.resolve({ ok: false, status: 401, text: () => Promise.resolve("") });

const silent: Fetching = () => Promise.resolve({ ok: false, body: null });

const app = (sending: Sending = answering): void => {
  render(App, {
    at: here,
    store: sessionStorage,
    sending,
    fetching: silent,
  });
};

describe("App", () => {
  beforeEach(() => {
    sessionStorage.clear();
    globalThis.history.replaceState(undefined, "", "/");
  });

  // There is no cookie, no session and nowhere to look the key up.
  it("asks for the key before it asks lemonfiber for anything", () => {
    app();
    expect(
      screen.getByRole("heading", { level: 1, name: m.unlock_title() }),
    ).toBeInTheDocument();
  });

  it("opens the console once it is given one", async () => {
    app();

    await userEvent.type(screen.getByLabelText(m.unlock_label()), key);
    await userEvent.click(
      screen.getByRole("button", { name: m.unlock_open() }),
    );

    expect(await screen.findByText(worstService.name)).toBeInTheDocument();
    expect(remembered(sessionStorage)).toBe(key);
  });

  // A password is exchanged once for a session, which travels in the same
  // header the key does — so everything above the door holds one thing.
  it("opens the console for a password, and keeps what it was given for it", async () => {
    app(admitting);

    await userEvent.type(
      screen.getByLabelText(m.wayin_password_label()),
      password,
    );
    await userEvent.click(
      screen.getByRole("button", { name: m.wayin_signin() }),
    );

    expect(await screen.findByText(worstService.name)).toBeInTheDocument();
    expect(remembered(sessionStorage)).toBe(session);
  });

  // The password itself is sent once and never again. A credential re-sent on
  // every request is a credential with more chances to leak.
  it("sends the password once, and nothing after that carries it", async () => {
    const sent = vi.fn(admitting);
    render(App, {
      at: here,
      store: sessionStorage,
      sending: sent,
      fetching: silent,
    });

    await userEvent.type(
      screen.getByLabelText(m.wayin_password_label()),
      password,
    );
    await userEvent.click(
      screen.getByRole("button", { name: m.wayin_signin() }),
    );
    await screen.findByText(worstService.name);

    const carrying = sent.mock.calls.filter(([, init]) =>
      JSON.stringify(init).includes(password),
    );
    expect(carrying).toHaveLength(1);
    expect(sent.mock.calls.length).toBeGreaterThan(1);
  });

  // A reload keeps the key, so a page that comes back does not stop to ask.
  it("opens straight away where this tab already has one", async () => {
    remember(sessionStorage, key);
    app();

    expect(await screen.findByText(worstService.name)).toBeInTheDocument();
  });

  // A key is minted once per run, so a refusal means this page holds one from a
  // run that has ended. There is nothing to retry.
  it("forgets a key the run refuses, and asks again", async () => {
    remember(sessionStorage, key);
    app(refusing);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: m.unlock_title(),
      }),
    ).toBeInTheDocument();
    expect(remembered(sessionStorage)).toBeUndefined();
  });

  // The whole page is swapped under whoever was reading the console. A reader
  // who cannot see that happen is told nothing unless the screen that replaced
  // it says so, and is left standing on the document unless it takes the focus
  // the old screen dropped.
  it("says why the console went, and stands the reader at the top of it", async () => {
    remember(sessionStorage, key);
    app(refusing);

    const heading = await screen.findByRole("heading", {
      level: 1,
      name: m.unlock_title(),
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      m.unlock_refused_lead(),
    );
    expect(heading).toHaveFocus();
  });

  // A tab that never had a key is not a handover, and nothing was taken away.
  it("says nothing of the sort, and takes no focus, on a first visit", () => {
    app();

    expect(screen.queryByRole("alert")).toBeNull();
    expect(
      screen.getByRole("heading", { level: 1, name: m.unlock_title() }),
    ).not.toHaveFocus();
  });
});
