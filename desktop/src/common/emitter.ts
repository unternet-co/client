import mitt, {
  Emitter as MittEmitter,
  EventType,
  Handler,
  WildcardHandler,
} from 'mitt';
import { Disposable, IDisposable } from './disposable';

/**
 * A strongly typed event emitter that provides disposable subscriptions
 * and prevents external emission of events.
 */
export class Emitter<Events extends Record<EventType, unknown>> {
  private emitter: MittEmitter<Events>;

  constructor() {
    this.emitter = mitt<Events>();
  }

  /**
   * Subscribe to an event.
   *
   * @param type The event type to subscribe to, or "*" for all events
   * @param handler The handler function
   * @returns A disposable for unsubscribing
   */

  on<EventKey extends keyof Events>(
    type: EventKey,
    handler: Handler<Events[EventKey]>
  ): IDisposable;

  on(type: '*', handler: WildcardHandler<Events>): IDisposable;

  on<EventKey extends keyof Events | '*'>(
    type: EventKey | '*',
    handler: EventKey extends '*'
      ? WildcardHandler<Events>
      : Handler<Events[EventKey & keyof Events]>
  ): IDisposable {
    this.emitter.on(type, handler as any);

    return new Disposable(() => {
      this.emitter.off(type, handler as any);
    });
  }

  /**
   * Subscribe to all events with a single handler function.
   *
   * @param handler Function to be called for any event
   * @returns A disposable for unsubscribing
   */
  subscribe(handler: WildcardHandler<Events>): IDisposable {
    return this.on('*', handler);
  }

  /**
   * Creates a specialized event handler function for a specific event type.
   * This is useful for creating event-specific handlers like onChange, onDelete, etc.
   *
   * @param type The event type to create a handler for
   * @returns A function that takes a handler and returns a disposable
   *
   * @example
   * // In your class
   * readonly onChange = this.emitter.createEventHandler('change');
   *
   * // Usage
   * instance.onChange(data => console.log('Changed:', data));
   */
  event<EventKey extends keyof Events>(
    type: EventKey
  ): (handler: Handler<Events[EventKey]>) => IDisposable {
    return (handler: Handler<Events[EventKey]>) => {
      return this.on(type, handler);
    };
  }

  /**
   * Emit an event.
   *
   * @param type The event type to emit
   * @param event The event data to include
   */
  emit<EventKey extends keyof Events>(
    type: EventKey,
    event: Events[EventKey]
  ): void {
    this.emitter.emit(type, event);
  }
}
