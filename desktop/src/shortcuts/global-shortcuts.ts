import { dependencies } from '../common/dependencies';
import { TabModel } from '../tabs';
import { ModalService } from '../modals/modal-service';
import { ShortcutService } from './shortcut-service';

export function registerGlobalShortcuts() {
  const shortcutService =
    dependencies.resolve<ShortcutService>('ShortcutService');
  const tabModel = dependencies.resolve<TabModel>('TabModel');
  const modalService = dependencies.resolve<ModalService>('ModalService');

  shortcutService.register('Meta+W', () => {
    if (tabModel.activeTab) {
      tabModel.close(tabModel.activeTab.id);
    }
  });

  shortcutService.register('Meta+N', () => {
    if (tabModel.activeTab) {
      tabModel.create();
    }
  });

  shortcutService.register('Meta+Shift+]', () => {
    tabModel.activateNext();
  });

  shortcutService.register('Meta+Shift+[', () => {
    tabModel.activatePrev();
  });

  // Ctrl+, or Meta+, to open settings
  shortcutService.register('Meta+,', () => {
    modalService.open('settings');
  });

  shortcutService.register('Ctrl+,', () => {
    modalService.open('settings');
  });

  shortcutService.register('Meta+Shift+,', () => {
    modalService.open('workspace-settings');
  });

  shortcutService.register('Ctrl+Shift+,', () => {
    modalService.open('workspace-settings');
  });
}
