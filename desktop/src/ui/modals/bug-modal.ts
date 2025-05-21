import { appendEl, attachStyles, createEl } from '../../common/utils';
import { BUG_REPORT_URL } from '../../constants';
import { ModalElement } from '../common/modals/modal-element';

export class BugModal extends ModalElement {
  constructor() {
    super({
      title: 'Report a bug',
      size: 'full',
      padding: 'none',
    });

    const styles = /*css*/ `
      :host {
        width: 100%;
        height: 100%;
      }

      iframe {
        width: 100%;
        height: 100%;
        border: 0;
      }
    `;

    const shadow = this.attachShadow({ mode: 'open' });
    attachStyles(shadow, styles);
    appendEl(shadow, createEl('iframe', { src: BUG_REPORT_URL }));
  }
}

customElements.define('bug-modal', BugModal);
