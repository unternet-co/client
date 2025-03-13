import './style.css';
import template from './template.html';
import { tabs } from '../tabs/tab-model';

export class MainLayout {
  element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
    element.innerHTML = template;
  }
}
