import { ulid } from 'ulid';
import { Modal } from './modal';

/**
 * The definition of a modal.
 */
export interface ModalDefinition {
  /** The title of the modal displayed in the header. */
  title: string;

  /**
   * The name of the element to render as the content of the modal.
   * If not provided, the modal will render a basic container with the title and a close button.
   */
  element?: string;

  /** If the modal should be deregistered when closed. */
  ephemeral?: boolean;

  /** If the modal should be a non-modal, right-docked variant. */
  modal?: boolean;

  /** If the modal should be docked to the right. */
  position?: 'right' | 'left' | 'bottom' | 'top' | 'center' | 'full';
}

export class ModalService {
  private definitions: Map<string, ModalDefinition> = new Map();
  private modals: Map<string, Modal> = new Map();

  /**
   * Registers a modal for use.
   *
   * Use {@link ModalService#create} for ephemeral modals.
   *
   * Registration should happen:
   * - During component initialization for modals tied to specific components
   * - At application startup for globally available modals
   * - Before the first time the modal needs to be opened
   *
   * Remember to {@link ModalService#deregister} modals when their parent components are destroyed to prevent memory leaks.
   *
   * @param key The key of the modal to register.
   * @param definition The definition of the modal to register.
   * @see {@link ModalService#deregister} for removing registered modals
   * @see {@link ModalService#create} for ephemeral modals that don't need registration
   */
  register(key: string, definition: ModalDefinition): void {
    if (this.definitions.has(key)) {
      throw new Error(`A modal with the key "${key}" is already registered.`);
    }

    this.definitions.set(key, definition);
  }

  /**
   * Unregisters a modal by key.
   *
   * It is prudent to deregister a modal when:
   * - The component that owns the modal is being destroyed/unmounted
   * - The modal's functionality is no longer needed in the application
   * - You want to replace a modal definition with a new one using the same key
   * - During cleanup operations to prevent memory leaks
   *
   * Deregistering will automatically close the modal if it's currently open.
   *
   * @param key The key of the modal to unregister.
   * @throws Error if no modal is found with the given key
   * @see {@link ModalService#register} for registering modals
   */
  deregister(key: string): void {
    const definition = this.definitions.get(key);
    if (!definition) {
      throw new Error(`No ModalDefinition found with the key "${key}".`);
    }

    // Close the modal if it's open, but tell it to skip the deregistration
    // step to avoid the circular dependency
    if (this.modals.has(key)) {
      this.close(key);
    }

    this.definitions.delete(key);
  }

  /**
   * Opens a modal by key. Creates the modal if it doesn't exist.
   * @param key The key of the modal to open.
   * @param attributes Optional attributes to pass to the modal.
   * @returns The opened modal.
   */
  open(key: string): Modal {
    if (this.modals.has(key)) return this.modals.get(key)!;
    if (!this.definitions.has(key))
      throw new Error(`Modal with key "${key}" has not been registered.`);
    const definition = this.definitions.get(key)!;
    const modal = new Modal(
      key,
      definition,
      definition.modal !== false ? true : false
    );
    modal.open(this.modals.size);
    this.modals.set(key, modal);
    return modal;
  }

  /**
   * Creates a modal that is ephemeral by default.
   *
   * This method is most appropriate for modals that aren't used again after they are closed.
   * It creates a modal with a unique ID and opens it immediately.
   *
   * @example
   * // Create a simple modal with a title and custom content
   * const modal = modalService.create();
   * modal.title = 'My Custom Modal';
   *
   * // Add content to the modal
   * const content = document.createElement('div');
   * content.innerHTML = '<p>This is my custom modal content</p>';
   * modal.contents.appendChild(content);
   *
   * // To close the modal programmatically
   * // modal.close();
   *
   * @returns The created modal instance that can be customized further.
   */
  create(definition: ModalDefinition): Modal {
    if (definition.ephemeral === undefined) definition.ephemeral = true;

    const key = ulid();
    this.register(key, definition);
    return this.open(key);
  }

  /**
   * Closes a modal by key.
   * @param key The key of the modal to close.
   */
  close(key: string): void {
    const modal = this.modals.get(key);
    if (!modal) {
      throw new Error(`No modal found with the ID "${key}".`);
    }

    modal.close();
    this.modals.delete(key);
  }
}
