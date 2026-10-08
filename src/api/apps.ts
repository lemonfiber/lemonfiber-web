/**
 * Which app to watch on, as a suite stands it in for a running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Device, Guidance } from "../lib/clients";

/** A phone, well served by an open-source app. */
export const phone: Device = {
  device: "An Android phone",
  client: "Findroid",
  open_source: true,
  support: "good",
};

/** A smart TV, served by a closed app, with a caution and what to do instead. */
export const television: Device = {
  device: "A Samsung TV",
  client: "Jellyfin for Tizen",
  open_source: false,
  support: "poor",
  caution: "It has to be installed from a computer.",
  instead: "Plug in a streaming stick and use that.",
};

/** The guidance in full, with playback likely to struggle on this machine. */
export const guidance: Guidance = {
  devices: [phone, television],
  only_at_home: "Every app here works at home only.",
  nothing_is_installed: "Nothing is installed on anybody's device for them.",
  straining: {
    preset: "best",
    caution: "The preset in force asks for more than this machine can convert.",
    instead: "Choose a lighter preset in the settings.",
  },
  trouble: [
    {
      symptom: "It keeps buffering",
      causes: [
        {
          because: "The device cannot play the file as it is.",
          tell: "Other files play smoothly.",
          fix: "Choose a lighter preset.",
        },
      ],
    },
  ],
};
