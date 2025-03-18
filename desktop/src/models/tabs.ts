import { Notifier } from '../utils/notifier';
import {
  DatabaseService,
  tabDatabaseService,
} from '../services/database-service';

export interface ITab {
  id?: string;
  title: string;
  type: 'workspace' | 'home';
  workspaceId?: string;
}

export interface TabChangeNotification {
  activeTab: ITab;
}

export class TabStore {
  private tabs: ITab[] = [];
  private databaseService: DatabaseService<string, ITab>;
  private changeNotifier = new Notifier<TabChangeNotification | void>();
  readonly subscribe = this.changeNotifier.subscribe;
  private activeTabId: ITab['id'];
  disposed = false;

  constructor(databaseService: DatabaseService<string, ITab>) {
    this.databaseService = databaseService;
    this.create();
  }

  all() {
    return this.tabs;
  }

  setActive(id?: string) {
    this.activeTabId = id;
  }

  get activeTab(): ITab | undefined {
    return this.tabs.find((t) => t.id === this.activeTabId);
  }

  create() {
    const tab = {
      id: crypto.randomUUID(),
      title: 'New workspace',
      type: 'workspace',
    } as ITab;

    this.tabs.push(tab);
    this.activeTabId = tab.id;
    this.changeNotifier.notify({ activeTab: tab });

    this.databaseService.create(tab);
  }

  close(tabId: ITab['id']) {
    const index = this.tabs.findIndex((tab) => tab.id === tabId);

    if (index === this.tabs.length - 1 && index !== 0) {
      this.activeTabId = this.tabs[index - 1].id;
    }

    if (index >= 0) {
      this.tabs.splice(index, 1);
      this.changeNotifier.notify({
        activeTab: this.tabs[index - 1],
      });
    }
  }

  dispose() {
    this.changeNotifier.dispose();
    this.tabs = [];
    this.disposed = true;
  }
}

export const tabStore = new TabStore(tabDatabaseService);
