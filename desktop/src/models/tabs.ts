import { Disposable } from "../base/disposable";
import { Notifier } from "../base/notifier";
import { KeyStoreService } from "../services/keystore-service";
import { Workspace, WorkspaceModel, WorkspaceNotification } from "./workspaces";

export interface Tab {
  type: "page" | "workspace";
  id: string;
}

export interface TabStoreData {
  activeTabId: string;
  tabs: Tab[];
}

export const initTabStoreData: TabStoreData = {
  activeTabId: "home",
  tabs: [
    {
      type: "page",
      id: "home",
    },
    // Settings is now a standalone button, not a tab
  ],
};

export interface TabChangeNotification {
  activeTab?: Tab;
  newTab?: Tab;
}

export class TabModel extends Disposable {
  private tabs: Tab[] = [];
  private store: KeyStoreService<TabStoreData>;
  private workspaceModel: WorkspaceModel;
  private notifier = new Notifier<TabChangeNotification>();
  readonly subscribe = this.notifier.subscribe;
  private activeTabId: Tab["id"];

  constructor(
    store: KeyStoreService<TabStoreData>,
    workspaceModel: WorkspaceModel,
  ) {
    super();
    this.store = store;
    this.workspaceModel = workspaceModel;
    this.loadTabs();
    this.workspaceModel.subscribe(this.onWorkspaces.bind(this));
  }

  onWorkspaces(notification?: WorkspaceNotification) {
    if (notification?.type === "delete" && this.has(notification.workspaceId)) {
      this.close(notification.workspaceId);
    }
  }

  get(id: Tab["id"]) {
    return this.tabs.find((tab: Tab) => tab.id === id);
  }

  // TODO: Make this just load workspaces directly, have workspace ID
  // Store active tab in app config JSON
  async loadTabs() {
    const tabData = this.store.get();

    for (const tab of tabData.tabs) {
      if (tab.type === "workspace" && tab.id) {
        await this.workspaceModel.activate(tab.id);
      }
    }

    this.activeTabId = tabData.activeTabId;
    this.tabs = tabData.tabs;
    this.notifier.notify({ activeTab: this.activeTab });
  }

  all() {
    return this.tabs;
  }

  activate(id: Tab["id"]) {
    this.activeTabId = id;
    this.store.update({ activeTabId: id });
    this.notifier.notify({ activeTab: this.activeTab });
  }

  has(id: Tab["id"]) {
    return !!this.tabs.find((tab) => tab.id === id);
  }

  get activeTab(): Tab | undefined {
    return this.tabs.find((t) => t.id === this.activeTabId);
  }

  get activeTabIndex(): number {
    return this.tabs.findIndex((t) => t.id === this.activeTabId);
  }

  activateNext() {
    if (this.activeTabIndex + 1 < this.tabs.length) {
      this.activate(this.tabs[this.activeTabIndex + 1].id);
    }
  }

  getTitle(id: Tab["id"]) {
    return this.workspaceModel.get(id)?.title;
  }

  activatePrev() {
    if (this.activeTabIndex - 1 >= 0) {
      this.activate(this.tabs[this.activeTabIndex - 1].id);
    }
  }

  create(id?: Workspace["id"]) {
    let workspace: Workspace;

    if (id) {
      workspace = this.workspaceModel.get(id)!;
      this.workspaceModel.activate(id);
    } else {
      workspace = this.workspaceModel.create();
    }

    const tab = {
      type: "workspace",
      id: workspace.id,
    } as Tab;

    this.tabs.push(tab);
    this.activeTabId = tab.id;
    this.persist();

    this.notifier.notify({ activeTab: tab, newTab: tab });
  }

  persist() {
    this.store.update({
      activeTabId: this.activeTabId,
      tabs: this.tabs,
    });
  }

  close(id: Tab["id"]) {
    const index = this.tabs.findIndex((x) => x.id === id);
    if (index === -1) return;

    const tab = this.tabs[index];
    const wasActive = this.activeTabId === id;
    this.tabs.splice(index, 1);

    if (tab.type === "workspace") {
      this.workspaceModel.deactivate(id);
    }

    if (wasActive && this.tabs.length > 0) {
      this.activeTabId = this.tabs[index]
        ? this.tabs[index].id
        : this.tabs[index - 1].id;
    }

    this.persist();

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
