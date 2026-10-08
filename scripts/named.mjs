/**
 * The names this surface gives what it draws, held to a few words each.
 *
 * A heading, a panel's title, a control's label and the name a section or a
 * table is announced by say what they open or do, and a name that runs to a
 * sentence is one a reader tabbing through the page hears in full at every
 * stop. A sentence may explain beside it; the name itself stays short.
 *
 * The words come from `messages/`, so a name is read where the template takes
 * it: an attribute that names an element, or text inside a heading, that is
 * `m.key(…)`. The key is looked up in the base catalogue and its words are
 * counted with each placeholder as one word, since what fills one is a single
 * name the reader already knows.
 */

/** The most words one name may take. */
export const A_NAME = 3;

/** The attributes that name an element, as against what it says. */
const NAMING = new Set(["title", "label", "aria-label"]);

/** A heading, at whatever level. */
const HEADING = /^h[1-6]$/u;

/**
 * Components whose label is a statement rather than a name: a placeholder is
 * announced while nothing has answered and says so in a sentence, and a tag
 * states how something stands.
 */
const STATES = new Set(["Skeleton", "Tag"]);

/** The catalogue a template's words are taken from. */
const CATALOGUE = "m";

/** Every key an expression takes its words from, through either branch of a choice. */
function keysOf(expression) {
  if (expression === null || typeof expression !== "object") return [];
  switch (expression.type) {
    case "CallExpression": {
      const { callee } = expression;
      const named =
        callee?.type === "MemberExpression" &&
        callee.object?.name === CATALOGUE &&
        typeof callee.property?.name === "string";
      return named ? [callee.property.name] : [];
    }
    case "ConditionalExpression":
      return [
        ...keysOf(expression.consequent),
        ...keysOf(expression.alternate),
      ];
    case "LogicalExpression":
      return [...keysOf(expression.left), ...keysOf(expression.right)];
    default:
      return [];
  }
}

/** The keys one attribute takes a name from. */
function keysNaming(attribute) {
  if (attribute.type !== "Attribute" || !NAMING.has(attribute.name)) return [];
  const parts = Array.isArray(attribute.value)
    ? attribute.value
    : [attribute.value];
  return parts.flatMap((part) =>
    part?.type === "ExpressionTag" ? keysOf(part.expression) : [],
  );
}

/**
 * Every key a parsed template takes a name from: the naming attributes of
 * every element and component, and every expression inside a heading.
 */
export function namingKeys(tree) {
  const found = [];
  const visit = (node, inHeading) => {
    if (node === null || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const child of node) visit(child, inHeading);
      return;
    }
    if (node.type === "Comment" || node.type === "Attribute") return;
    if (node.type === "ExpressionTag") {
      if (inHeading) found.push(...keysOf(node.expression));
      return;
    }
    if (Array.isArray(node.attributes) && !STATES.has(node.name)) {
      for (const attribute of node.attributes)
        found.push(...keysNaming(attribute));
    }
    const heading =
      inHeading || (node.type === "RegularElement" && HEADING.test(node.name));
    for (const [key, child] of Object.entries(node)) {
      if (key !== "attributes" && key !== "metadata") visit(child, heading);
    }
  };
  visit(tree, false);
  return found;
}

/** The words a message holds, each placeholder counted as one. */
export function wordsOf(message) {
  return message
    .replaceAll(/\{[^}]*\}/gu, "X")
    .trim()
    .split(/\s+/u)
    .filter((word) => word !== "");
}

/** Every name among these keys that runs past a few words, as a finding. */
export function tooLong(keys, catalogue) {
  return [...new Set(keys)].flatMap((key) => {
    const message = catalogue.get(key);
    if (typeof message !== "string") return [];
    const words = wordsOf(message);
    return words.length > A_NAME
      ? [
          `${key} ("${message}") names what it is drawn on in ${words.length} words — say it in at most ${A_NAME}, and put a sentence beside it`,
        ]
      : [];
  });
}
