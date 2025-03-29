import { dependencies } from "./base/dependencies";
import { TabModel } from "./models/tabs";
import { ModalService } from "./services/modal-service";
import { ShortcutService } from "./services/shortcut-service";

export function registerGlobalShortcuts() {
  const shortcutService =
    dependencies.resolve<ShortcutService>("ShortcutService");
  const tabModel = dependencies.resolve<TabModel>("TabModel");
  const modalService = dependencies.resolve<ModalService>("ModalService");

  shortcutService.register("Meta+W", () => {
    if (tabModel.activeTab) {
      tabModel.close(tabModel.activeTab.id);
    }
  });

  shortcutService.register("Meta+T", () => {
    if (tabModel.activeTab) {
      tabModel.create();
    }
  });

  shortcutService.register("Meta+Shift+]", () => {
    tabModel.activateNext();
  });

  shortcutService.register("Meta+Shift+[", () => {
    tabModel.activatePrev();
  });

  for (let i = 1; i <= 9; i++) {
    shortcutService.register(`Meta+${i}`, () => {
      const tabs = tabModel.all();
      const tabIndex = i - 1;
      if (tabIndex < tabs.length) {
        tabModel.activate(tabs[tabIndex].id);
      }
    });
  }

  // Ctrl+, or Meta+, to open settings
  shortcutService.register("Meta+,", () => {
    modalService.open("settings");
  });

  shortcutService.register("Ctrl+,", () => {
    modalService.open("settings");
  });
}
