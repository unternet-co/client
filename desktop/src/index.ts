import { tabModel } from './models/tabs';
import { appendEl } from './utils/dom';
import './ui/app-root';

document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'w' && e.metaKey) {
    e.preventDefault();
    if (tabModel.activeTab) tabModel.close(tabModel.activeTab);
  }
});

document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 't' && e.metaKey) {
    e.preventDefault();
    tabModel.create();
  }
});
