import { Disposable, IDisposable } from './disposable';

type Subscriber<Notification> = (notification?: Notification) => void;

export class Notifier<Notification = undefined> implements IDisposable {
  private subscribers: ((notification?: Notification) => void)[] = [];
  disposed = false;

  /**
   * Adds a subscriber to receive notifications.
   *
   * @param subscriber The function to call when a notification is sent
   * @returns A disposable object that can be used to unsubscribe
   *
   * @example
   * const subscription = notifier.subscribe(notification => {
   *   console.log('Received notification:', notification);
   * });
   *
   * // Later unsubscribe
   * subscription.dispose();
   */
  readonly subscribe = (subscriber: Subscriber<Notification>) => {
    if (this.disposed) {
      throw new Error('Emitter is disposed');
    }

    this.subscribers.push(subscriber);
    return new Disposable(() => this.removeSubscriber(subscriber));
  };

  /**
   * Creates a specialized subscription function that only receives notifications
   * matching the given predicate.
   *
   * @param predicate A function that tests whether a notification should be handled
   * @returns A function that can be used to subscribe to filtered notifications
   *
   * @example
   * // Create a specialized subscription function
   * const onMessageAdded = notifier.when(
   *   (notification) => notification.type === 'addmessage'
   * );
   *
   * // Later use it to subscribe
   * const subscription = onMessageAdded(message => {
   *   console.log('New message:', message);
   * });
   */
  readonly when = <NotificationType extends Notification>(
    predicate: (notification: Notification) => notification is NotificationType
  ) => {
    return (subscriber: Subscriber<NotificationType>): IDisposable => {
      return this.subscribe((notification?: Notification) => {
        if (!notification) return;

        if (predicate(notification)) {
          subscriber(notification);
        }
      });
    };
  };

  /**
   * Sends a notification to all subscribers.
   *
   * @param notification The notification to send to subscribers
   * @throws Error if the notifier has been disposed
   *
   * @example
   * // Send a notification to all subscribers
   * notifier.notify({ type: 'update', data: { id: 123 } });
   */
  notify(notification?: Notification): void {
    if (this.disposed) {
      throw new Error('Cannot notify, Notifier is disposed');
    }

    for (const subscriber of this.subscribers) {
      subscriber(notification);
    }
  }

  /**
   * Removes a subscriber from the notification list.
   *
   * @param subscriber The subscriber function to remove
   * @private This method is typically only called by the disposable returned from subscribe
   */
  private removeSubscriber(
    subscriber: (notification?: Notification) => void
  ): void {
    this.subscribers = this.subscribers.filter((l) => l !== subscriber);
  }

  /**
   * Disposes the notifier, clearing all subscribers and preventing further notifications.
   * After calling this method, the notifier cannot be used anymore.
   */
  dispose(): void {
    this.disposed = true;
    this.subscribers = [];
  }
}
