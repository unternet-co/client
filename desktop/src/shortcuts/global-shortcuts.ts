import { dependencies } from '../common/dependencies';
import { TabModel } from '../tabs';
import { ModalService } from '../modals/modal-service';
import { ShortcutService } from './shortcut-service';

import { WorkspaceModel } from '../workspaces';

export function registerGlobalShortcuts() {
  const shortcutService =
    dependencies.resolve<ShortcutService>('ShortcutService');
  // const tabModel = dependencies.resolve<TabModel>('TabModel');
  const modalService = dependencies.resolve<ModalService>('ModalService');
  const workspaceModel = dependencies.resolve<WorkspaceModel>('WorkspaceModel');

  shortcutService.register('Meta+N', () => {
    workspaceModel.create();
  });

  // shortcutService.register('Meta+Shift+]', () => {
  //   tabModel.activateNext();
  // });

  // shortcutService.register('Meta+Shift+[', () => {
  //   tabModel.activatePrev();
  // });

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

  // Meta+K: Archive messages up to the most recent message in the active workspace
  shortcutService.register('Meta+K', () => {
    workspaceModel.setArchivedMessageId();
    workspaceModel.setArchiveVisibility(false);
  });

  shortcutService.register('Meta+Shift+L', () => {
    workspaceModel.setArchivedMessageId();
    workspaceModel.setArchiveVisibility(false);
  });
}
