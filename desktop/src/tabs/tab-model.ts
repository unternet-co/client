import { IDisposable } from '../disposable';
import { Notifier } from '../notifier';

type TabType = 'workspace' | 'home';

export interface BaseTab {
  id?: string;
  title: string;
  type: TabType;
}

export interface WorkspaceTab extends BaseTab {
  type: 'workspace';
  workspaceId: string;
}

export type Tab = BaseTab | WorkspaceTab;

interface RemoveTabNotification {
  type: 'remove';
  index: number;
  activeTab: string;
}

interface AddTabNotification {
  type: 'add';
  tab: Tab;
  activeTab: string;
}

type TabChangeNotification = RemoveTabNotification | AddTabNotification;

export class TabModel implements IDisposable {
  private tabs: Tab[] = [];
  private changeNotifier = new Notifier<TabChangeNotification>();
  readonly onChange = this.changeNotifier.subscribe;
  activeTab: Tab['id'];
  disposed = false;

  constructor() {
    this.add({
      title: 'Hello world!',
      id: '12391893712',
      type: 'workspace',
    });
  }

  all() {
    return this.tabs;
  }

  add(tab: Tab) {
    this.tabs.push(tab);
    this.activeTab = tab.id;
    this.changeNotifier.notify({ type: 'add', tab, activeTab: this.activeTab });
  }

  remove(tabId: Tab['id']) {
    const index = this.tabs.findIndex((tab) => tab.id === tabId);
    if (index) {
      this.tabs.splice(index, 1);
      this.activeTab = this.tabs[index - 1];
      this.changeNotifier.notify({
        type: 'remove',
        index,
        activeTab: this.activeTab,
      });
    }
  }

  dispose() {
    this.changeNotifier.dispose();
    this.tabs = [];
    this.disposed = true;
  }
}

export const tabModel = new TabModel();
