import { Disposable } from '../base/disposable';
import { Notifier } from '../base/notifier';
import { DatabaseService } from '../services/database-service';

export interface Tab {
  id: string;
  title: string;
  type: 'workspace' | 'home';
  workspaceId?: string;
}

export interface TabChangeNotification {
  activeTab?: Tab;
}

export class TabModel extends Disposable {
  private tabs: Tab[] = [];
  private databaseService: DatabaseService<string, Tab>;
  private notifier = new Notifier<TabChangeNotification | void>();
  readonly subscribe = this.notifier.subscribe;
  private activeTabId: Tab['id'];

  constructor(databaseService: DatabaseService<string, Tab>) {
    super();
    this.databaseService = databaseService;
    this.loadTabs();
  }

  async loadTabs() {
    this.tabs = await this.databaseService.all();
    if (this.tabs.length) this.activeTabId = this.tabs[0].id;
    this.notifier.notify({ activeTab: this.activeTab });
  }

  all() {
    return this.tabs;
  }

  setActive(id: string) {
    this.activeTabId = id;
    this.notifier.notify({ activeTab: this.activeTab });
  }

  get activeTab(): Tab | undefined {
    return this.tabs.find((t) => t.id === this.activeTabId);
  }

  create() {
    const tab = {
      id: crypto.randomUUID(),
      title: 'New workspace',
      type: 'workspace',
    } as Tab;

    this.tabs.push(tab);
    this.activeTabId = tab.id;
    this.notifier.notify({ activeTab: tab });

    this.databaseService.create(tab);
  }

  close(tabId: Tab['id']) {
    const index = this.tabs.findIndex((tab) => tab.id === tabId);
    if (index === -1) return;

    const wasActive = this.activeTabId === tabId;
    this.tabs.splice(index, 1);
    this.databaseService.delete(tabId);

    if (wasActive && this.tabs.length > 0) {
      this.activeTabId = this.tabs[index]
        ? this.tabs[index].id
        : this.tabs[index - 1].id;
    }

    this.notifier.notify({
      activeTab: this.tabs.find((tab) => tab.id === this.activeTabId),
    });
  }

  dispose() {
    this.notifier.dispose();
    this.tabs = [];
    super.dispose();
  }
}

export const tabDatabase = new DatabaseService<string, Tab>('tabs');
export const tabModel = new TabModel(tabDatabase);
