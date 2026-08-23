import type { Meta, StoryObj } from "@storybook/svelte-vite";
import SettingRow from "./SettingRow.svelte";
import { flipping, pressing, stating } from "../../.storybook/snippets";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Surfaces/SettingRow",
  component: SettingRow,
} satisfies Meta<typeof SettingRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A setting with two positions. The commonest row on the settings screens, and
 * the only one whose control both shows the setting and changes it.
 */
export const SetByASwitch: Story = {
  args: {
    title: m.setting_boot_title(),
    prose: m.setting_boot_prose(),
    control: flipping({ on: true, label: m.setting_boot_title() }),
  },
};

/**
 * A setting too big for a row. The row says where it stands today and the
 * control opens the screen that changes it.
 */
export const SetSomewhereElse: Story = {
  args: {
    title: m.setting_files_title(),
    prose: m.setting_files_prose({ path: "/data" }),
    control: pressing({ label: m.action_change() }),
  },
};

/**
 * A setting that cannot be changed. There is nothing to press, so the row
 * states where it stands instead of offering a control that would refuse.
 */
export const CannotBeChanged: Story = {
  args: {
    title: m.setting_tunnel_drop_title(),
    prose: m.setting_tunnel_drop_prose(),
    control: stating({ state: "known", label: m.setting_tunnel_drop_state() }),
  },
};

/**
 * A row with something waiting on it. The one firm control on the screen, so
 * a settings pane has a single centre of gravity like any other.
 */
export const SomethingWaiting: Story = {
  args: {
    title: m.product_name(),
    prose: m.setting_version_prose({ installed: "0.8.0", offered: "0.9.0" }),
    control: pressing({ label: m.action_see_what_changed(), weight: "firm" }),
  },
};
