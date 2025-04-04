import { ulid } from 'ulid';
import { Modal } from './modal';

export interface ModalDefinition {
  title: string;
  element?: string;
}

export class ModalService {
  private definitions: Map<string, ModalDefinition> = new Map();
  private modals: Map<string, Modal> = new Map();

  register(key: string, definition: ModalDefinition): void {
    if (this.definitions.has(key)) {
      throw new Error(`A modal with the key "${key}" is already registered.`);
    }

    this.definitions.set(key, definition);
  }

  deregister(key: string): void {
    const modal = this.definitions.get(key);
    if (!modal) {
      throw new Error(`No modal found with the key "${key}".`);
    }

    this.close(key);
    this.definitions.delete(key);
  }

  open(key: string): Modal {
    if (!this.definitions.has(key)) {
      throw new Error(`Modal key '${key}' does not exist.`);
    }

    if (this.modals.has(key)) return this.modals.get(key)!;

    const modal = new Modal(key, this.definitions.get(key)!);
    modal.open(this.modals.size);
    this.modals.set(key, modal);
    return modal;
  }

  create(definition: ModalDefinition): Modal {
    const key = ulid();
    this.register(key, definition);
    return this.open(key);
  }

  close(key: string): void {
    const modal = this.modals.get(key);
    if (!modal) {
      throw new Error(`No modal found with the ID "${key}".`);
    }

    modal.close();
    this.modals.delete(key);
  }
}
