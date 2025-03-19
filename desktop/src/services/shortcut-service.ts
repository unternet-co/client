import { tabModel } from '../models/tabs';

export class ShortcutService {
  constructor() {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'w' && e.metaKey) {
        e.preventDefault();
        if (tabModel.activeTab) tabModel.close(tabModel.activeTab);
      }

      if (e.key === 't' && e.metaKey) {
        e.preventDefault();
        tabModel.create();
      }

      if (e.key === ']' && e.metaKey && e.shiftKey) {
        e.preventDefault();
        tabModel.activateNext();
      }

      if (e.key === '[' && e.metaKey && e.shiftKey) {
        e.preventDefault();
        tabModel.activatePrev();
      }
    });
  }
}

export const shortcutService = new ShortcutService();
