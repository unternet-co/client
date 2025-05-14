import { NativeMenu, NativeMenuOption } from './menu/native-menu';

// Renderer-specific menu option type: click is zero-arg only
export type RendererMenuOption = Omit<NativeMenuOption, 'click'> & {
  click?: () => void;
};

/**
 * Shows a native context menu at the specified (x, y) screen coordinates.
 * @param options Array of NativeMenuOption to build the menu
 * @param x X coordinate (screen, not page)
 * @param y Y coordinate (screen, not page)
 */
export function showContextMenu(
  options: RendererMenuOption[],
  x: number,
  y: number
): void {
  const showNativeMenu = (window as any).electronAPI?.showNativeMenu;
  if (!showNativeMenu) return;
  const menu = new NativeMenu();

  // Build a map from value to click handler, and strip click from options
  const actionMap = new Map<string, () => void>();
  const serializableOptions = options.map((opt) => {
    const { click, ...rest } = opt;
    if (typeof opt.value === 'string' && typeof click === 'function') {
      actionMap.set(opt.value, click);
    }
    return rest;
  });

  const menuOptions = menu.buildMenuOptions(
    serializableOptions as NativeMenuOption[]
  );
  showNativeMenu(menuOptions, { x, y }).then(
    (selectedId: string | undefined) => {
      if (selectedId) {
        const value = menu.getValueForId(selectedId);
        if (value && actionMap.has(value)) {
          actionMap.get(value)!();
        }
      }
    }
  );
}

/**
 * Attaches a native context menu to the given element.
 * @param element The target HTMLElement
 * @param options A NativeMenuOption[] or a function returning one (for dynamic menus)
 */
export function attachContextMenu(
  element: HTMLElement,
  options: RendererMenuOption[] | (() => RendererMenuOption[])
): void {
  element.addEventListener('contextmenu', (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const menuOptions = typeof options === 'function' ? options() : options;
    // Use clientX/clientY for menu popup location
    showContextMenu(menuOptions, e.clientX, e.clientY);
  });
}
