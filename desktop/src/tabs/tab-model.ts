import { Notifier } from '../notifier';
import type { Tab } from './types';

class TabModel {
  private _tabs: Tab[] = [];
  private _watchNotifier = new Notifier<Tab[]>(() => this._tabs);
  readonly watch = this._watchNotifier.subscribe;

  get all() {
    return this._tabs;
  }

  add(tab: Tab) {
    this._tabs.push(tab);
    this._watchNotifier.notify();
  }

  dispose() {
    this._watchNotifier.dispose();
    this._tabs = [];
  }
}

export const tabs = new TabModel();
