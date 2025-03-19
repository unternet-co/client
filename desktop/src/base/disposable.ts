export interface IDisposable {
  disposed: boolean;
  dispose(): void;
}

export class Disposable {
  disposed = false;
  disposables: DisposableGroup;
  private disposeCallback: () => void;

  constructor(disposeCallback?: () => void) {
    if (disposeCallback) this.disposeCallback = disposeCallback;
  }

  static createEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener
  ) {
    target.addEventListener(type, listener);
    return new Disposable(() => target.removeEventListener(type, listener));
  }

  dispose(): void {
    if (this.disposeCallback) this.disposeCallback();
    this.disposed = true;
  }
}

export class DisposableGroup {
  private disposables: IDisposable[] = [];

  add(disposable: Disposable) {
    this.disposables.push(disposable);
  }

  attachListener(target: EventTarget, type: string, listener: EventListener) {
    this.add(Disposable.createEventListener(target, type, listener));
  }

  dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}
