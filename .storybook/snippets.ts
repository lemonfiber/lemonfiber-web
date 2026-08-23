/**
 * Real components inside a story's snippet props.
 *
 * A component that takes actions, or a body, takes a `Snippet`, and a story
 * written in TypeScript has no template to write one in. Dressing a `<button>`
 * to look like the real thing is the alternative, and a copy of a component's
 * styling that no gate compares against the original drifts from it silently.
 *
 * Each component gets its own function rather than sharing a generic one.
 * Svelte's `Component<Props, Exports, Bindings>` constrains its later
 * parameters by `Props` and takes `Props` contravariantly, so a signature
 * accepting any component infers `Props` as its own constraint and rejects
 * every concrete component handed to it. `NoInfer` does not change that.
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
import Enclosure from "../src/components/Enclosure.svelte";
import Icon from "../src/components/Icon.svelte";
import Meter from "../src/components/Meter.svelte";
import SchematicNode from "../src/components/Node.svelte";
import StateTag from "../src/components/StateTag.svelte";
import Switch from "../src/components/Switch.svelte";
import Tag from "../src/components/Tag.svelte";
import Value from "../src/components/Value.svelte";
import Wire from "../src/components/Wire.svelte";

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

/** The mark sitting before a tag's words. */
export function marking(props: ComponentProps<typeof Icon>): Snippet {
  return holding((node) => {
    const made = mount(Icon, { target: node, props });
    return () => {
      void unmount(made);
    };
  });
}

/** The two-position control that sets a row's setting. */
export function flipping(props: ComponentProps<typeof Switch>): Snippet {
  return holding((node) => {
    const made = mount(Switch, { target: node, props });
    return () => {
      void unmount(made);
    };
  });
}

/** What a row states where it offers no control at all. */
export function stating(props: ComponentProps<typeof StateTag>): Snippet {
  return holding((node) => {
    const made = mount(StateTag, { target: node, props });
    return () => {
      void unmount(made);
    };
  });
}

/** How far along something is, as the bar a table row draws it with. */
export function measuring(props: ComponentProps<typeof Meter>): Snippet {
  return holding((node) => {
    const made = mount(Meter, { target: node, props });
    return () => {
      void unmount(made);
    };
  });
}

/** The tag naming what a row is or where it came from. */
export function naming(props: ComponentProps<typeof Tag>): Snippet {
  return holding((node) => {
    const made = mount(Tag, { target: node, props });
    return () => {
      void unmount(made);
    };
  });
}

/** A box in a schematic, and what it holds. */
type Box = Omit<ComponentProps<typeof Enclosure>, "children"> & {
  readonly holds: readonly Part[];
};

/** One part of a schematic: a node, a connector, or a box of further parts. */
export type Part =
  | { readonly node: ComponentProps<typeof SchematicNode> }
  | { readonly wire: ComponentProps<typeof Wire> }
  | { readonly box: Box };

/** Puts one part in place, and takes it away again. */
function place(target: Element, part: Part): () => void {
  if ("node" in part) {
    const made = mount(SchematicNode, { target, props: part.node });
    return () => {
      void unmount(made);
    };
  }
  if ("wire" in part) {
    const made = mount(Wire, { target, props: part.wire });
    return () => {
      void unmount(made);
    };
  }
  const { holds, ...rest } = part.box;
  const made = mount(Enclosure, {
    target,
    props: { ...rest, children: wiring(...holds) },
  });
  return () => {
    void unmount(made);
  };
}

/** The parts a schematic box holds, in the order they are read. */
export function wiring(...parts: readonly Part[]): Snippet {
  return holding((node) => {
    const made = parts.map((part) => place(node, part));
    return () => {
      for (const undo of made) undo();
    };
  });
}
