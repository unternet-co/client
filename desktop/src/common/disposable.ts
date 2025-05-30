export interface IDisposable {
  disposed: boolean;
  dispose(): void;
}

export class Disposable implements IDisposable {
  static createEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener
  ) {
    target.addEventListener(type, listener);
    return new Disposable(() => target.removeEventListener(type, listener));
  }

  disposed = false;
  disposables = new DisposableGroup();
  private disposeCallback: () => void;

  constructor(disposeCallback?: () => void) {
    if (disposeCallback) this.disposeCallback = disposeCallback;
  }

  dispose(): void {
    if (this.disposeCallback) this.disposeCallback();
    this.disposables.dispose();
    this.disposed = true;
  }
}

export class DisposableGroup {
  private disposables: IDisposable[] = [];

  get all() {
    return this.disposables;
  }

  add(...disposables: Array<IDisposable>) {
    for (const d of disposables) {
      this.disposables.push(d);
    }
  }

  attachListener(
    target: EventTarget,
    type: string,
    listener: (e: any) => void
  ) {
    this.add(Disposable.createEventListener(target, type, listener));
  }

  dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}
