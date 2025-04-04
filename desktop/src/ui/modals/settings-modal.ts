import { ModalSize } from '../../modals/modal';
import { ModalElement } from '../../modals/modal-element';

export class SettingsModal extends ModalElement {
  size: ModalSize = 'full';
}

customElements.define('settings-modal', SettingsModal);
