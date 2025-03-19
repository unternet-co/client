import { tabStore } from '../stores/tabs';

export class ShortcutService {
  constructor() {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'w' && e.metaKey) {
        e.preventDefault();
        if (tabStore.activeTab) tabStore.close(tabStore.activeTab);
      }

      if (e.key === 't' && e.metaKey) {
        e.preventDefault();
        tabStore.create();
      }

      if (e.key === ']' && e.metaKey && e.shiftKey) {
        e.preventDefault();
        tabStore.activateNext();
      }

      if (e.key === '[' && e.metaKey && e.shiftKey) {
        e.preventDefault();
        tabStore.activatePrev();
      }
    });
  }
}

export const shortcutService = new ShortcutService();
