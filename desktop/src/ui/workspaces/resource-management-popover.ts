import { html } from 'lit';
import { PopoverElement } from '../common/elements/popover';
import './resource-management-popover.css';

export class ResourceManagementPopover extends PopoverElement {
  get template() {
    return html`
      <form>
        <p>Resource management UI goes here.</p>
        <un-input></un-input>
      </form>
    `;
  }
}

customElements.define('resource-management-popover', ResourceManagementPopover);
