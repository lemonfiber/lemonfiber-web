/**
 * What a key may use, as a suite or a story stands it in for a running
 * lemonfiber: the operator's, a read key's and a key on a stack with a setting
 * switched off.
 */
import { actedAt, readAt, type Able } from "../lib/able";

/** The operator, who may use everything this stack has. */
export const operatorAble: Able = {
  scope: "operator",
  stack: "stack-one",
  capabilities: {
    [readAt("quality")]: "available",
    [readAt("config")]: "available",
    [actedAt("quality-set")]: "available",
    [actedAt("backup")]: "available",
  },
};

/** A read key, which reads and acts on nothing. */
export const readKeyAble: Able = {
  scope: "read",
  stack: "stack-one",
  capabilities: {
    [readAt("quality")]: "available",
    [readAt("config")]: "unpermitted",
    [actedAt("quality-set")]: "unpermitted",
    [actedAt("backup")]: "unpermitted",
  },
};

/** The operator, on a stack where a setting the quality read needs is off. */
export const switchedOffAble: Able = {
  scope: "operator",
  capabilities: {
    [readAt("quality")]: "unconfigured",
    [actedAt("quality-set")]: "unconfigured",
  },
};
