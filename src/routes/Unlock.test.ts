import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Unlock from "./Unlock.svelte";
import type { Admitting, Arrived } from "../api/admitting";
import * as m from "../paraglide/messages.js";

/** Built rather than written, so no scanner reads it as a real one. */
const key = ["a", "run", "key"].join("-");
const session = ["a", "session", "secret"].join("-");
const password = ["a", "chosen", "password"].join("-");

const answering = (came: Arrived): Admitting =>
  vi.fn(() => Promise.resolve(came));

const admitted: Arrived = { at: "admitted", token: session };

const doorway = (onsignin: Admitting = answering(admitted)) => {
  const opened = vi.fn();
  render(Unlock, { onopen: opened, onsignin });
  return opened;
};

const signIn = async (said: string, called = ""): Promise<void> => {
  if (called !== "") {
    await userEvent.type(screen.getByLabelText(m.wayin_name_label()), called);
  }
  await userEvent.type(screen.getByLabelText(m.wayin_password_label()), said);
  await userEvent.click(screen.getByRole("button", { name: m.wayin_signin() }));
};

describe("the screen that opens lemonfiber", () => {
  it("says the two things that open it", () => {
    doorway();
    expect(
      screen.getByRole("heading", { level: 1, name: m.unlock_title() }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: m.wayin_signin_title() }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: m.wayin_key_title() }),
    ).toBeInTheDocument();
  });

  // One form, both kinds of person. Nothing on this screen picks between them.
  it("offers no choice of which kind of person is signing in", () => {
    doorway();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("switch")).toBeNull();
  });
});

describe("handing over a password", () => {
  it("sends no name where none was given", async () => {
    const asked = answering(admitted);
    render(Unlock, { onopen: vi.fn(), onsignin: asked });

    await signIn(password);

    expect(asked).toHaveBeenCalledWith({ name: undefined, password });
  });

  it("sends the name a member signed in under", async () => {
    const asked = answering(admitted);
    render(Unlock, { onopen: vi.fn(), onsignin: asked });

    await signIn(password, "Ada");

    expect(asked).toHaveBeenCalledWith({ name: "Ada", password });
  });

  it("hands the session on to whoever keeps it", async () => {
    const opened = doorway();

    await signIn(password);

    expect(opened).toHaveBeenCalledWith(session);
  });

  // A password is hidden as it is typed, which is the difference between a
  // password and every other box on this screen.
  it("hides the password as it is typed", () => {
    doorway();
    expect(screen.getByLabelText(m.wayin_password_label())).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("signs in on enter, without reaching for the control", async () => {
    const opened = doorway();

    await userEvent.type(
      screen.getByLabelText(m.wayin_password_label()),
      `${password}{Enter}`,
    );

    expect(opened).toHaveBeenCalledWith(session);
  });

  it("asks for nothing until there is a password to send", async () => {
    const asked = answering(admitted);
    render(Unlock, { onopen: vi.fn(), onsignin: asked });

    await userEvent.click(
      screen.getByRole("button", { name: m.wayin_signin() }),
    );

    expect(asked).not.toHaveBeenCalled();
  });

  // Verifying a password is deliberately expensive, and a form completed again
  // while the first attempt is still out would spend that twice.
  it("sends one attempt while one is still out", async () => {
    let admit = (_came: Arrived): void => undefined;
    const asked = vi.fn<Admitting>(
      () =>
        new Promise<Arrived>((resolve) => {
          admit = resolve;
        }),
    );
    const opened = vi.fn();
    render(Unlock, { onopen: opened, onsignin: asked });

    await userEvent.type(
      screen.getByLabelText(m.wayin_password_label()),
      `${password}{Enter}`,
    );
    await fireEvent.submit(
      screen.getByRole("form", { name: m.wayin_signin_title() }),
    );

    expect(asked).toHaveBeenCalledTimes(1);

    admit(admitted);
    await vi.waitFor(() => {
      expect(opened).toHaveBeenCalledWith(session);
    });
  });

  // The whole of what the reader may know: two credentials open this door, and
  // naming the half that failed would say which accounts exist.
  it("says the pair was not recognised, and not which half", async () => {
    render(Unlock, {
      onopen: vi.fn(),
      onsignin: answering({ at: "not-recognised" }),
    });

    await signIn(password, "Ada");

    expect(await screen.findByRole("status")).toHaveTextContent(
      m.wayin_not_recognised_lead(),
    );
    expect(screen.queryByText(/Ada/)).toBeNull();
  });

  // The refusal says how long is left, so a reader waits rather than retrying
  // into the limit and extending it.
  it("says what lemonfiber said where it would not open the page", async () => {
    const said = "Too many answers. Try again in 4 minutes.";
    render(Unlock, {
      onopen: vi.fn(),
      onsignin: answering({ at: "declined", said }),
    });

    await signIn(password);

    expect(await screen.findByRole("alert")).toHaveTextContent(said);
  });

  it("drops a refusal the next attempt has not earned", async () => {
    const asked = vi
      .fn<Admitting>()
      .mockResolvedValueOnce({ at: "not-recognised" })
      .mockResolvedValueOnce(admitted);
    const opened = vi.fn();
    render(Unlock, { onopen: opened, onsignin: asked });

    await signIn(password);
    expect(await screen.findByRole("status")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: m.wayin_signin() }),
    );

    expect(opened).toHaveBeenCalledWith(session);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("says nothing was refused before anything was sent", () => {
    doorway();
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("handing over the key a run printed", () => {
  it("hands over the key it was given", async () => {
    const opened = doorway();

    await userEvent.type(screen.getByLabelText(m.unlock_label()), key);
    await userEvent.click(
      screen.getByRole("button", { name: m.unlock_open() }),
    );

    expect(opened).toHaveBeenCalledWith(key);
  });

  // A key is copied off a terminal, and what comes with it is whitespace.
  it("drops what was pasted around it", async () => {
    const opened = doorway();

    await userEvent.type(screen.getByLabelText(m.unlock_label()), `  ${key}  `);
    await userEvent.click(
      screen.getByRole("button", { name: m.unlock_open() }),
    );

    expect(opened).toHaveBeenCalledWith(key);
  });

  it("hands over the key on enter, without reaching for the control", async () => {
    const opened = doorway();

    await userEvent.type(
      screen.getByLabelText(m.unlock_label()),
      `${key}{Enter}`,
    );

    expect(opened).toHaveBeenCalledWith(key);
  });

  it("asks for nothing on an empty box", async () => {
    const opened = doorway();

    await userEvent.click(
      screen.getByRole("button", { name: m.unlock_open() }),
    );

    expect(opened).not.toHaveBeenCalled();
  });

  // A page nothing answers a password for is still opened by the key, and does
  // not offer a form nothing is listening to.
  it("is the whole screen where no password is answered", () => {
    render(Unlock, { onopen: vi.fn() });

    expect(screen.getByLabelText(m.unlock_label())).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: m.wayin_signin_title() }),
    ).toBeNull();
  });
});

describe("arriving because a run turned the console away", () => {
  // Which of the two reasons this screen is here is what it says, and one of
  // them is the only account a reader gets of a console that vanished.
  it("says what the run stopped taking, whichever it was", () => {
    render(Unlock, { onopen: vi.fn(), refused: true });

    expect(screen.getByRole("alert")).toHaveTextContent(
      m.unlock_refused_lead(),
    );
    expect(screen.getByText(m.unlock_refused_prose())).toBeInTheDocument();
  });

  it("says nothing of the sort where nothing was refused", () => {
    doorway();

    expect(screen.queryByRole("alert")).toBeNull();
  });
});
