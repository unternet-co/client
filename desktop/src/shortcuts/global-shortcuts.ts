import { dependencies } from '../common/dependencies';
import { TabModel } from '../deprecated/tabs';
import { ModalService } from '../modals/modal-service';
import { ShortcutService } from './shortcut-service';

import { WorkspaceModel } from '../models/workspace-model';

export function registerGlobalShortcuts() {
  const shortcutService =
    dependencies.resolve<ShortcutService>('ShortcutService');
  // const tabModel = dependencies.resolve<TabModel>('TabModel');
  const modalService = dependencies.resolve<ModalService>('ModalService');
  const workspaceModel = dependencies.resolve<WorkspaceModel>('WorkspaceModel');

  shortcutService.register({
    keys: 'Meta+N',
    callback: () => {
      workspaceModel.create();
    },
    description: 'Create new workspace',
  });

  // shortcutService.register('Meta+Shift+]', () => {
  //   tabModel.activateNext();
  // });

  // shortcutService.register('Meta+Shift+[', () => {
  //   tabModel.activatePrev();
  // });

  // Ctrl+, or Meta+, to open settings
  shortcutService.register({
    keys: 'Meta+,',
    callback: () => {
      modalService.open('settings');
    },
    description: 'Open settings',
  });

  shortcutService.register({
    keys: 'Ctrl+,',
    callback: () => {
      modalService.open('settings');
    },
    description: 'Open settings',
  });

  // Meta+K: Archive messages up to the most recent message in the active workspace
  shortcutService.register({
    keys: 'Meta+K',
    callback: () => {
      workspaceModel.archiveMessages();
    },
    description: 'Archive messages in active workspace',
  });

  shortcutService.register({
    keys: 'Meta+Shift+L',
    callback: () => {
      workspaceModel.archiveMessages();
    },
    description: 'Archive messages in active workspace',
  });
}
