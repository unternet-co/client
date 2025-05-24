import { dependencies } from '../common/dependencies';
import { TabModel } from '../deprecated/tabs';
import { ModalService } from '../ui/common/modals/modal-service';
import { WorkspaceService } from '../workspaces/workspace-service';
import { ShortcutService } from './shortcut-service';

export function registerGlobalShortcuts() {
  const shortcutService =
    dependencies.resolve<ShortcutService>('ShortcutService');
  // const tabModel = dependencies.resolve<TabModel>('TabModel');
  const modalService = dependencies.resolve<ModalService>('ModalService');
  const workspaceModel =
    dependencies.resolve<WorkspaceService>('WorkspaceService');

  shortcutService.register({
    keys: 'Meta+N',
    callback: () => {
      modalService.open('new-workspace');
    },
    description: 'Create new workspace',
  });

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
}
