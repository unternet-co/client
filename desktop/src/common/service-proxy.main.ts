// Auto-generates IPC proxy for any service interface
import { ipcRenderer } from 'electron';

type ServiceMethods<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => Promise<any>
    ? (...args: Parameters<T[K]>) => ReturnType<T[K]>
    : never;
};

export function createServiceProxy<T>(serviceName: string): ServiceMethods<T> {
  return new Proxy({} as ServiceMethods<T>, {
    get(target, prop: string) {
      return (...args: any[]) =>
        ipcRenderer.invoke(`${serviceName}:${prop}`, ...args);
    },
  });
}

export function createEventListener(
  eventName: string,
  callback: (data: any) => void
) {
  // Remove existing listeners to prevent duplicates
  ipcRenderer.removeAllListeners(eventName);
  ipcRenderer.on(eventName, (_, data) => callback(data));
}
