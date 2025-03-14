import './style.css';
import template from './template.html';

import '../deprecated/elements/top-bar';
import '../deprecated/elements/thread-view';
import '../deprecated/elements/command-bar';
import '../deprecated/elements/resource-bar';

export class MainLayout {
  element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
    element.innerHTML = template;
  }
}
