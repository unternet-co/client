import './layout.css';
import template from './template.html';
import { createFragment, createEl } from '../utils';

export class MainLayout {
  element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
    element.innerHTML = template;
  }
}
