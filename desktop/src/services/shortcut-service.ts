import { TabModel } from '../models/tabs';
import { SettingsPage } from '../ui/pages/settings-page';

export class ShortcutService {
  constructor(private tabModel: TabModel) {
    this.tabModel = tabModel;

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'w' && e.metaKey) {
        e.preventDefault();
        if (this.tabModel.activeTab)
          this.tabModel.close(this.tabModel.activeTab.id);
      }

      if (e.key === 't' && e.metaKey) {
        e.preventDefault();
        this.tabModel.create();
      }

      if (e.key === ']' && e.metaKey && e.shiftKey) {
        e.preventDefault();
        this.tabModel.activateNext();
      }

      if (e.key === '[' && e.metaKey && e.shiftKey) {
        e.preventDefault();
        this.tabModel.activatePrev();
      }

      // command+1-9 to tab between workspaces
      const numKey = parseInt(e.key);
      if (!isNaN(numKey) && numKey >= 1 && numKey <= 9 && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const tabs = this.tabModel.all();
        const tabIndex = numKey - 1; 

        if (tabIndex < tabs.length) {
          this.tabModel.activate(tabs[tabIndex].id);
        }
      }
      
      // Ctrl+, to open settings (common shortcut in many applications)
      if (e.key === ',' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        SettingsPage.open();
      }
    });
  }
}
