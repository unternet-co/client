import { Notifier } from '../notifier';
import type { Tab } from './types';

class TabModel {
  tabs: Tab[] = [];
  private _watchNotifier = new Notifier<Tab[]>(() => this.tabs);
  readonly watch = this._watchNotifier.subscribe;

  addTab(tab: Tab) {
    this.tabs.push(tab);
    this._watchNotifier.notify(this.tabs);
  }
}

export const tabs = new TabModel();

tabs.addTab({
  title: 'Hello!',
  type: 'workspace',
});

tabs.addTab({
  title: 'Hello!',
  type: 'workspace',
});
