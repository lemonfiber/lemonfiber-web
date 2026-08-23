/**
 * Real components inside a story's snippet props.
 *
 * A component that takes actions, or a body, takes a `Snippet`, and a story
 * written in TypeScript has no template to write one in. Dressing a `<button>`
 * to look like the real thing is the alternative, and a copy of a component's
 * styling that no gate compares against the original drifts from it silently.
 *
 * Storybook-only, which is why it lives here rather than under `src`.
 */
import {
  createRawSnippet,
  mount,
  unmount,
  type ComponentProps,
  type Snippet,
} from "svelte";
import Action from "../src/components/Action.svelte";
import DeadNote from "../src/components/DeadNote.svelte";
import Value from "../src/components/Value.svelte";

/** Puts something into the node a snippet holds, and takes it away again. */
type Fill = (node: Element) => () => void;

/** A snippet whose one element is filled by hand. */
function holding(fill: Fill): Snippet {
  return createRawSnippet(() => ({
    render: () => `<div style="display: contents"></div>`,
    setup: fill,
  }));
}

/** The buttons a row, a banner or a note offers, in order. */
export function pressing(
  ...each: readonly ComponentProps<typeof Action>[]
): Snippet {
  return holding((node) => {
    const made = each.map((props) => mount(Action, { target: node, props }));
    return () => {
      for (const one of made) void unmount(one);
    };
  });
}

/** What a panel says in place of the figures it can no longer stand behind. */
export function notAnswering(props: ComponentProps<typeof DeadNote>): Snippet {
  return holding((node) => {
    const made = mount(DeadNote, { target: node, props });
    return () => {
      void unmount(made);
    };
  });
}

/** One figure, as a panel's whole body. */
export function showing(props: ComponentProps<typeof Value>): Snippet {
  return holding((node) => {
    const made = mount(Value, { target: node, props });
    return () => {
      void unmount(made);
    };
  });
}
