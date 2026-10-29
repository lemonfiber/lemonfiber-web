/**
 * The operator's own overlay, as a suite stands it in for a running
 * lemonfiber.
 */
import type { Unvetted } from "../lib/unvetted";

/** An overlay that changes the egress guard. */
export const overlaid: Unvetted = {
  overlay: "/etc/lemonfiber/overlay.yml",
  services: ["gluetun"],
};
