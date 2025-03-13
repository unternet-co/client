import './style.css';
import template from './template.html';

export class MainLayout {
  element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
    element.innerHTML = template;
  }
}
