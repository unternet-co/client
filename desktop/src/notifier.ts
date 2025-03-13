export class Notifier<Notification> {
  private subscribers: ((notification?: Notification) => void)[] = [];
  private initialValueGetter: () => Notification | undefined;
  private disposed = false;

  constructor(initialValueGetter?: () => Notification) {
    this.initialValueGetter = initialValueGetter;
  }

  readonly subscribe = (subscriber: (notification?: Notification) => void) => {
    if (this.disposed) {
      throw new Error('Emitter is disposed');
    }

    if (this.initialValueGetter) subscriber(this.initialValueGetter());
    this.subscribers.push(subscriber);
    return {
      dispose: () => this.removeObserver(subscriber),
    };
  };

  notify(notification?: Notification): void {
    if (this.disposed) {
      throw new Error('Cannot notify, Notifier is disposed');
    }

    for (const subscriber of this.subscribers) {
      subscriber(notification);
    }
  }

  private removeObserver(
    observer: (notification?: Notification) => void
  ): void {
    this.subscribers = this.subscribers.filter((l) => l !== observer);
  }

  dispose(): void {
    this.disposed = true;
    this.subscribers = [];
  }
}
