import { AppLayout } from './ui/layout';
import { tabModel } from './models/tabs';

new AppLayout(document.body);

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
