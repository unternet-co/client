import type { MenuItemConstructorOptions } from 'electron';
import { ChangeEvent } from './select';
export interface NativeMenuOption extends MenuItemConstructorOptions {
  value: string;
}

/**
 * Encapsulates the logic for building native menu options, mapping selection IDs to values,
 * and managing native menu event handlers for Electron environments.
 */
export class SelectNativeMenu {
  #idValueMap = new Map<string, string>();
  #idx = 0;
  #handlerMap: WeakMap<HTMLElement, EventListener> = new WeakMap();

  /**
   * Normalizes a string or object to a NativeMenuOption array.
   * Accepts JSON strings, arrays, or objects with an 'options' field.
   */
  static parseOptions(
    optionsAttr: string | object | null | undefined
  ): NativeMenuOption[] {
    if (!optionsAttr) return [];
    if (typeof optionsAttr === 'string') {
      try {
        const parsed = JSON.parse(optionsAttr);
        if (Array.isArray(parsed)) return parsed;
        if (parsed?.options && Array.isArray(parsed.options))
          return parsed.options;
        return [];
      } catch {
        return [];
      }
    }
    if (Array.isArray(optionsAttr)) return optionsAttr;
    if (
      (optionsAttr as any)?.options &&
      Array.isArray((optionsAttr as any).options)
    ) {
      return (optionsAttr as any).options;
    }
    return [];
  }

  /**
   * Recursively flattens options and finds the label for a given value.
   */
  static findLabelForValue(
    options: NativeMenuOption[],
    value: string | null | undefined
  ): string | undefined {
    if (!value || !Array.isArray(options)) return undefined; // Ensure options is an array
    const flat = this.#flatten(options);
    return flat.find((opt) => opt.value === value)?.label;
  }

  // Private static flatten helper for NativeMenuOption trees
  static #flatten(opts: NativeMenuOption[]): NativeMenuOption[] {
    return opts.flatMap((opt) =>
      Array.isArray(opt.submenu)
        ? [opt, ...this.#flatten(opt.submenu as NativeMenuOption[])]
        : [opt]
    );
  }

  /**
   * Builds Electron menu options from NativeMenuOption[] and maps unique IDs to values.
   * @param options NativeMenuOption[]
   * @returns MenuItemConstructorOptions[]
   */
  buildMenuOptions(options: NativeMenuOption[]): MenuItemConstructorOptions[] {
    this.#idValueMap.clear();
    this.#idx = 0;
    return this.#recurse(options);
  }

  /**
   * Internal recursive builder for menu options.
   */
  #recurse(opts: NativeMenuOption[]): MenuItemConstructorOptions[] {
    return opts.map((opt) => {
      const { value, submenu, ...rest } = opt as NativeMenuOption & {
        submenu?: NativeMenuOption[];
      };
      if (rest.label === undefined && rest.type !== 'separator') {
        throw new Error(
          `Menu items must have a label. Problematic option: ${JSON.stringify(opt)}`
        );
      }
      if (rest.type === 'separator') return { type: 'separator' };
      const id = `menu-item-${this.#idx++}`;
      this.#idValueMap.set(id, value);
      return {
        ...rest,
        id,
        ...(Array.isArray(submenu) ? { submenu: this.#recurse(submenu) } : {}),
      };
    });
  }

  /**
   * Returns the value associated with a menu item ID.
   * @param id string
   */
  getValueForId(id: string): string | undefined {
    return this.#idValueMap.get(id);
  }

  /**
   * Registers the native menu click event handler on the given element.
   * Handles value comparison, updating, and event dispatch internally.
   * @param el HTMLElement
   * @param getOptions () => NativeMenuOption[]
   * @param getValue () => string | null
   * @param setValue (value: string) => void
   */
  registerEvents(
    el: HTMLElement,
    getOptions: () => NativeMenuOption[],
    getValue: () => string | null,
    setValue: (value: string) => void
  ) {
    this.unregisterEvents(el); // Always clean up before registering
    const handler = this.#handleNativeMenuClick.bind(
      this,
      el,
      getOptions,
      getValue,
      setValue
    );
    el.addEventListener('click', handler);
    this.#handlerMap.set(el, handler);
  }

  /**
   * Unregisters the native menu click event handler from the given element.
   * @param el HTMLElement
   */
  unregisterEvents(el: HTMLElement) {
    const handler = this.#handlerMap.get(el);
    if (handler) {
      el.removeEventListener('click', handler);
      this.#handlerMap.delete(el);
    }
  }

  /**
   * Handles click events for native menu (Electron only).
   * @param el HTMLElement
   * @param getOptions () => NativeMenuOption[]
   * @param onValue (value: string) => void
   * @param e MouseEvent
   */
  async #handleNativeMenuClick(
    el: HTMLElement,
    getOptions: () => NativeMenuOption[],
    getValue: () => string | null,
    setValue: (value: string) => void,
    e: MouseEvent
  ) {
    e.preventDefault();
    e.stopPropagation();
    const showNativeMenu = window.electronAPI?.showNativeMenu;
    if (!showNativeMenu) return;
    const menuOptions = this.buildMenuOptions(getOptions());
    const button = (el.shadowRoot || el).querySelector(
      'button.select--native'
    ) as HTMLElement | null;
    const rect = button?.getBoundingClientRect();
    const x = rect ? Math.round(rect.left) : undefined;
    const y = rect ? Math.round(rect.top) : undefined;
    const selectedId = await showNativeMenu(menuOptions, null, { x, y });
    const value =
      selectedId != null ? this.getValueForId(selectedId) : undefined;
    if (value && value !== getValue()) {
      setValue(value);
      el.dispatchEvent(new ChangeEvent(value));
    }
  }
}
