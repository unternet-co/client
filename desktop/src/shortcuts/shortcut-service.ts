type Shortcut = {
  keys: string; // e.g., "Meta+Shift+T"
  callback: (e: KeyboardEvent) => void;
  description?: string; // Optional, for UI display
};

export class ShortcutService {
  /**
   * Returns a list of all registered shortcuts as { keys, description } objects.
   * Note: Only the keys are available unless descriptions are added to registration.
   */
  public listShortcuts(): { keys: string }[] {
    const result: { keys: string }[] = [];
    for (const [keys, stack] of this.shortcuts.entries()) {
      // Only show the top-most shortcut for each key combination
      if (stack.length > 0) {
        result.push({ keys });
      }
    }
    return result;
  }
  private shortcuts: Map<string, Shortcut[]> = new Map();

  constructor() {
    document.addEventListener('keydown', (e: KeyboardEvent) =>
      this.handleKeydown(e)
    );
  }

  register(keys: string, callback: (e: KeyboardEvent) => void): void {
    const normalizedKeys = this.normalizeKeys(keys);

    if (!this.shortcuts.has(normalizedKeys)) {
      this.shortcuts.set(normalizedKeys, []);
    } else {
      console.warn(`Duplicate shortcut added for '${normalizedKeys}'.`);
    }

    const shortcutStack = this.shortcuts.get(normalizedKeys)!;
    shortcutStack.push({ keys: normalizedKeys, callback });
  }

  deregister(keys: string, callback: (e: KeyboardEvent) => void): void {
    const normalizedKeys = this.normalizeKeys(keys);

    if (!this.shortcuts.has(normalizedKeys)) {
      console.warn(`Shortcut for "${normalizedKeys}" is not registered.`);
      return;
    }

    const shortcutStack = this.shortcuts.get(normalizedKeys)!;
    const index = shortcutStack.findIndex(
      (shortcut) => shortcut.callback === callback
    );

    if (index === -1) {
      console.warn(`Callback for shortcut "${normalizedKeys}" not found.`);
      return;
    }

    shortcutStack.splice(index, 1);

    if (shortcutStack.length === 0) {
      this.shortcuts.delete(normalizedKeys);
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
    const keyCombination = this.getKeyCombination(e);
    const shortcutStack = this.shortcuts.get(keyCombination);

    if (shortcutStack && shortcutStack.length > 0) {
      e.preventDefault();
      const activeShortcut = shortcutStack[shortcutStack.length - 1];
      activeShortcut.callback(e);
    }
  }

  private getKeyCombination(e: KeyboardEvent): string {
    const keys: string[] = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.metaKey) keys.push('Meta');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    keys.push(e.key);
    return this.normalizeKeys(keys.join('+'));
  }

  private normalizeKeys(keys: string): string {
    return keys
      .split('+')
      .map((key) => key.trim().toUpperCase())
      .sort()
      .join('+');
  }
}
