import { ActionDirective } from './actions';

/**
 * Protocols determine how an `ActionDirective` is executed.
 *
 * This goes hand in hand with `Resource`s.
 * Each protocol has a unique `scheme`.
 *
 * {@link ActionDirective}
 * {@link Resource}
 */
export interface Protocol {
  scheme: string;
  handler: ProtocolHandler;
}

export type ProtocolHandler = (
  directive: ActionDirective
) => any | Promise<any>;

/**
 * Creates a protocol-handlers dictionary indexed by the protocol scheme.
 *
 * @param protocols
 * @returns Protocol dictionary/record/map.
 */
export function createProtocolHandlers(protocols: Protocol[]) {
  const handlers: Record<string, ProtocolHandler> = {};
  for (const protocol of protocols) {
    handlers[protocol.scheme] = protocol.handler.bind(protocol);
  }
  return handlers;
}
