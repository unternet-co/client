import { Menu, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';

function buildMenu(
  items: any[],
  selectedId: string | null,
  event: IpcMainInvokeEvent,
  setSelected: (id: string) => void
): any[] {
  return items.map((opt) => {
    if (opt.type === 'separator') return { type: 'separator' };
    const isSubmenu = Array.isArray(opt.submenu);
    const menuItem = {
      ...opt,
      click:
        !isSubmenu && opt.id
          ? () => {
              setSelected(opt.id);
              return opt.id;
            }
          : undefined,
      submenu: isSubmenu
        ? buildMenu(opt.submenu, selectedId, event, setSelected)
        : undefined,
    };
    return menuItem;
  });
}

export function registerNativeMenuHandler(ipcMainInst: typeof ipcMain) {
  ipcMainInst.handle(
    'showNativeMenu',
    async (event, options, selectedValue, position) => {
      let selected: string | null = null;
      function setSelected(val: string) {
        selected = val;
      }
      return await new Promise((resolve) => {
        const menuObject = buildMenu(
          options,
          selectedValue,
          event,
          setSelected
        );
        const menu = Menu.buildFromTemplate(menuObject);
        menu.popup({
          window: BrowserWindow.fromWebContents(event.sender) || undefined,
          x: position?.x,
          y: position?.y,
          callback: () => {
            resolve(selected);
          },
        });
      });
    }
  );
}
