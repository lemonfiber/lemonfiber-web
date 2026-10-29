/**
 * What setup's tunnel step asks of the egress guard, and the answer it sends.
 *
 * The guard's manifest names what it needs: settings with the values each
 * accepts, a setting only the operator holds, and secrets. Setup asks them in
 * the order the report gives them. A value is offered only where the answers
 * before it meet its needs, and a setting or a secret is asked only where its
 * own needs are met, so what is asked moves as the answers do. The answer
 * carries exactly what is asked now and nothing it is not asked for, since
 * lemonfiber refuses both a gap and an extra.
 */
import type { SetupAnswerBody } from "@lemonfiber/sdk-ts";
import type { Wizard } from "./wizard";

/** One question about the egress guard, in the order setup asks it. */
export type GuardQuestion = Wizard["guard"][number];

/** A question answered with one of a setting's values. */
type Choosing = Extract<GuardQuestion, { asks: "choice" }>;

/** The values of other settings a value or a question is asked under. */
type Needs = Readonly<Record<string, readonly string[]>>;

/** What the operator has given so far, by setting or by secret. */
export type Given = Readonly<Record<string, string>>;

/** The tunnel answer, carrying what the egress guard was given. */
type Carrying = Extract<SetupAnswerBody, { vpn: unknown }>;

/** The value a setting stands at: the one given, or the default its question names. */
function standing(
  questions: readonly GuardQuestion[],
  settings: Given,
  setting: string,
): string | undefined {
  const given = settings[setting];
  if (given !== undefined) return given;
  const asked = questions.find(
    (one): one is Choosing => one.asks === "choice" && one.setting === setting,
  );
  return asked?.default ?? undefined;
}

/** Whether the settings stand at a value each of these needs names. */
function met(
  questions: readonly GuardQuestion[],
  settings: Given,
  needs: Needs,
): boolean {
  return Object.entries(needs).every(([setting, values]) => {
    const value = standing(questions, settings, setting);
    return value !== undefined && values.includes(value);
  });
}

/** Every value a choice offers under the answers given. */
export function offered(
  questions: readonly GuardQuestion[],
  settings: Given,
  question: Choosing,
): readonly string[] {
  return question.choices
    .filter((one) => met(questions, settings, one.needs))
    .map((one) => one.value);
}

/** Every question asked under the answers given, in the order setup asks them. */
export function askedNow(
  questions: readonly GuardQuestion[],
  settings: Given,
): readonly GuardQuestion[] {
  return questions.filter(
    (one) => one.asks === "choice" || met(questions, settings, one.needs),
  );
}

/** The value a choice is answered with: one it offers, given or by default. */
export function chosen(
  questions: readonly GuardQuestion[],
  settings: Given,
  question: Choosing,
): string | undefined {
  const value = standing(questions, settings, question.setting);
  return value !== undefined &&
    offered(questions, settings, question).includes(value)
    ? value
    : undefined;
}

/**
 * The tunnel answer carrying everything asked under the answers given, or
 * nothing while one of them is unanswered. With nothing asked, the answer is
 * the bare word.
 */
export function carrying(
  questions: readonly GuardQuestion[],
  settings: Given,
  secrets: Given,
): Carrying | undefined {
  if (questions.length === 0) return { vpn: "carrying" };
  const given: {
    settings: Record<string, string>;
    secrets: Record<string, string>;
  } = { settings: {}, secrets: {} };
  for (const question of askedNow(questions, settings)) {
    switch (question.asks) {
      case "choice": {
        const value = chosen(questions, settings, question);
        if (value === undefined) return undefined;
        given.settings[question.setting] = value;
        break;
      }
      case "value": {
        const value = (settings[question.setting] ?? "").trim();
        if (value === "") return undefined;
        given.settings[question.setting] = value;
        break;
      }
      case "secret": {
        const value = secrets[question.secret] ?? "";
        if (value === "") return undefined;
        given.secrets[question.secret] = value;
        break;
      }
    }
  }
  return { vpn: { carrying: given } };
}
