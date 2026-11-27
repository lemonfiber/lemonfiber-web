/**
 * What a record of a request is headed by, as the request is happening.
 *
 * The words live in `messages/`, so no screen holds one.
 */
import { titleOfMove } from "./moved";
import { titleOfPlug } from "./plugged";
import { titleOfTending } from "./invited";
import { titleOfTuning } from "./tuned";
import { isDoing, type Doing, type Requested } from "./requested";
import * as m from "../paraglide/messages.js";

/**
 * What a record of it is headed by: what was asked for, as it is happening.
 */
export function titleOfDoing(doing: Requested, scoped: boolean): string {
  if (isDoing(doing)) return titleOfOverview(doing, scoped);
  switch (doing) {
    case "repair":
      return m.doing_repair_title();
    case "diagnose":
      return m.doing_diagnose_title();
    case "accept":
      return m.doing_accept_title();
    case "undo":
      return m.doing_undo_title();
    case "backup":
      return m.doing_backup_title();
    case "restore":
      return m.doing_restore_title();
    case "support":
      return m.doing_support_title();
    case "quality-set":
    case "quality-reapply":
    case "quality-upgrade":
      return titleOfTuning(doing);
    case "config-set":
      return m.doing_config_title();
    case "invite":
    case "reissue":
    case "household-allow":
    case "household-approve":
    case "household-decline":
    case "household-handoff":
      return titleOfTending(doing);
    case "companion-pair":
      return m.doing_pair_title();
    case "bandwidth":
      return m.doing_bandwidth_title();
    case "downloads-pause":
      return m.doing_pause_title();
    case "downloads-resume":
      return m.doing_resume_title();
    case "update":
      return m.doing_update_title();
    case "walkthrough":
      return m.doing_walk_title();
    case "search":
      return m.doing_search_title();
    case "hosting-install":
      return m.doing_host_title();
    case "hosting-remove":
      return m.doing_unhost_title();
    case "forget":
      return m.doing_forget_title();
    case "uninstall":
      return m.doing_uninstall_title();
    case "stop-seeding":
      return m.doing_let_go_title();
    case "space":
      return m.doing_reclaim_title();
    case "wiring-fill":
      return m.doing_fill_title();
    case "migrate-adopt":
    case "migrate-import":
    case "migrate-beside":
    case "migrate-replace":
      return titleOfMove(doing);
    case "plugin-install":
    case "plugin-update":
    case "plugin-remove":
    case "plugin-prove":
    case "plugin-run":
      return titleOfPlug(doing);
    case "credentials-revoke":
      return m.doing_revoke_grant_title();
    case "settings-set":
      return m.doing_values_set_title();
    case "settings-clear":
      return m.doing_values_clear_title();
    case "run":
      return m.doing_run_title();
  }
}

/** What a record of something the overview asked for is headed by. */
function titleOfOverview(doing: Doing, scoped: boolean): string {
  switch (doing) {
    case "up":
      return scoped ? m.doing_up_chosen_title() : m.doing_up_title();
    case "down":
      return scoped ? m.doing_down_chosen_title() : m.doing_down_title();
    case "switch":
      return m.doing_switch_title();
    case "restart":
      return m.doing_restart_title();
    case "pull":
      return m.doing_pull_title();
    case "watch":
      return m.doing_watch_title();
    case "seed":
      return m.doing_seed_title();
    case "adopt":
      return m.doing_adopt_title();
  }
}
