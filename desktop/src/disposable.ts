export interface IDisposable {
  disposed: boolean;
  dispose(): void;
}

export class Disposable {
  disposed = false;

  constructor(disposeCallback?: () => void) {
    this.dispose = disposeCallback;
  }

  dispose(): void {
    this.disposed = true;
  }
}

export class DisposableGroup {
  private disposables: IDisposable[];

  add(disposable: Disposable) {
    this.disposables.push(disposable);
  }

  dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}
