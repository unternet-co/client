import { HTMLTemplateResult } from 'lit';
import { IDisposable } from '../common/disposable';

export interface Page extends IDisposable {
  id: string;
  render(): HTMLTemplateResult;
}

export class PageManager {
  pages = new Map<string, Page>();

  register(page: Page) {
    this.pages.set(page.id, page);
  }

  render(id: string): HTMLTemplateResult | null {
    if (!this.pages.has(id)) {
      console.warn(`Page with id ${id} is not registered.`);
      return null;
    }

    return this.pages.get(id).render();
  }
}
