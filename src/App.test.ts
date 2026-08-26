import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { API_VERSION, type Fetching, type Sending } from "@lemonfiber/sdk-ts";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App.svelte";
import { remember, remembered } from "./api/token";
import { stack, worstService } from "./routes/fixture";
import * as m from "./paraglide/messages.js";

const key = ["a", "run", "key"].join("-");
const here = "http://127.0.0.1:7777";

const answering: Sending = () =>
  Promise.resolve({
    ok: true,
    status: 200,
    text: () =>
      Promise.resolve(
        JSON.stringify({
          api_version: API_VERSION,
          kind: "status",
          data: stack,
        }),
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

    await userEvent.type(
      screen.getByRole("textbox", { name: m.unlock_label() }),
      key,
    );
    await userEvent.click(
      screen.getByRole("button", { name: m.unlock_open() }),
    );

    expect(await screen.findByText(worstService.name)).toBeInTheDocument();
    expect(remembered(sessionStorage)).toBe(key);
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
