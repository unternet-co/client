import { Disposable, IDisposable } from './disposable';

export class Notifier<Notification = undefined> implements IDisposable {
  private subscribers: ((notification?: Notification) => void)[] = [];
  private defaultNotificationGetter?: () => Notification;
  disposed = false;

  constructor(defaultNotificationGetter?: () => Notification) {
    this.defaultNotificationGetter = defaultNotificationGetter;
  }

  readonly subscribe = (subscriber: (notification?: Notification) => void) => {
    if (this.disposed) {
      throw new Error('Emitter is disposed');
    }

    this.subscribers.push(subscriber);
    this.onSubscribe(subscriber);
    return new Disposable(() => this.removeSubscriber(subscriber));
  };

  onSubscribe(subscriber: (notification?: Notification) => void) {
    if (this.defaultNotificationGetter) {
      subscriber(this.defaultNotificationGetter());
    }
  }

  notify(notification?: Notification): void {
    if (this.disposed) {
      throw new Error('Cannot notify, Notifier is disposed');
    }

    for (const subscriber of this.subscribers) {
      if (!notification && this.defaultNotificationGetter) {
        subscriber(this.defaultNotificationGetter());
      } else {
        subscriber(notification);
      }
    }
  }

  private removeSubscriber(
    subscriber: (notification?: Notification) => void
  ): void {
    this.subscribers = this.subscribers.filter((l) => l !== subscriber);
  }

  dispose(): void {
    this.disposed = true;
    this.subscribers = [];
  }
}
