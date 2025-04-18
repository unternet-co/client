import { appendEl, attachStyles, createEl } from '../../common/utils';
import { BUG_REPORT_URL } from '../../constants';
import { ModalSize, ModalPadding } from '../modal';
import { ModalElement } from '../modal-element';

export class BugModal extends ModalElement {
  size: ModalSize = 'full';
  padding: ModalPadding = 'none';

  constructor() {
    super();
    const styles = /*css*/ `
      :root {
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
