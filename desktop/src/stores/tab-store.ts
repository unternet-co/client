import { Disposable } from '../base/disposable';
import { Notifier } from '../base/notifier';
import { DatabaseService } from '../services/db-service';
import { workspaceStore } from './workspace-store';
import { ulid } from 'ulid';
import { tabDatabase } from '../services/db-service';
import { Tab } from '../data-types';

export interface TabChangeNotification {
  activeTab?: Tab;
  newTab?: Tab;
}

export class TabStore extends Disposable {
  private tabs: Tab[] = [];
  private workspaceStore = workspaceStore;
  private databaseService: DatabaseService<string, Tab>;
  private notifier = new Notifier<TabChangeNotification>();
  readonly subscribe = this.notifier.subscribe;
  private activeTabId: Tab['id'];

  constructor(databaseService: DatabaseService<string, Tab>) {
    super();
    this.databaseService = databaseService;
    this.loadTabs();
  }

  async loadTabs() {
    this.tabs = await this.databaseService.all();
    if (this.tabs.length) {
      this.activeTabId = this.tabs[0].id;
      if (this.tabs[0].workspaceId) {
        this.workspaceStore.setActive(this.tabs[0].workspaceId);
      }
    }
    this.notifier.notify({ activeTab: this.activeTab });
  }

  all() {
    return this.tabs;
  }

  setActive(tab: Tab) {
    this.activeTabId = tab.id;
    if (tab.workspaceId) this.workspaceStore.setActive(tab.workspaceId);
    this.notifier.notify({ activeTab: this.activeTab });
  }

  get activeTab(): Tab | undefined {
    return this.tabs.find((t) => t.id === this.activeTabId);
  }

  get activeTabIndex(): number {
    return this.tabs.findIndex((t) => t.id === this.activeTabId);
  }

  activateNext() {
    if (this.activeTabIndex + 1 < this.tabs.length) {
      this.setActive(this.tabs[this.activeTabIndex + 1]);
    }
  }

  activatePrev() {
    if (this.activeTabIndex - 1 >= 0) {
      this.setActive(this.tabs[this.activeTabIndex - 1]);
    }
  }

  create() {
    const tab = {
      id: ulid(),
      title: 'New workspace',
      type: 'workspace',
    } as Tab;

    const workspace = this.workspaceStore.create();
    tab.workspaceId = workspace.id;
    this.tabs.push(tab);
    this.activeTabId = tab.id;
    this.notifier.notify({ activeTab: tab, newTab: tab });

    this.databaseService.create(tab);
  }

  // TODO: Make this add to history, not delete
  close(tab: Tab) {
    const tabId = tab.id;
    const index = this.tabs.findIndex((x) => x.id === tabId);
    if (index === -1) return;

    const wasActive = this.activeTabId === tabId;
    this.tabs.splice(index, 1);
    this.databaseService.delete(tabId);
    if (tab.workspaceId) this.workspaceStore.delete(tab.workspaceId);

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

export const tabStore = new TabStore(tabDatabase);
